import { Hono } from "hono";
import { z } from "zod";
import {
  createDb,
  inventoryCategories,
  inventoryItems,
  inventoryLocations,
  inventoryAssetUnits,
  inventoryLoans,
  inventoryStockMovements,
  inventoryRequisitions,
  users,
  desc,
  eq,
} from "@school-erp/db";
import { authMiddleware, requireRoles } from "../auth/middleware";
import type { Bindings } from "../index";

export const inventoryRouter = new Hono<{ Bindings: Bindings }>();

// All inventory operations require authentication
inventoryRouter.use("*", authMiddleware());

const createCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  description: z.string().optional(),
});

const createLocationSchema = z.object({
  name: z.string().min(1, "Nama lokasi wajib diisi"),
  code: z.string().min(1, "Kode lokasi wajib diisi"),
  description: z.string().optional(),
});

const createItemSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  code: z.string().min(1, "Kode barang wajib diisi"),
  name: z.string().min(1, "Nama barang wajib diisi"),
  type: z.enum(["fixed_asset", "consumable"]),
  unit: z.string().min(1, "Satuan unit wajib diisi"),
  minStockAlert: z.number().int().min(0).default(0),
  description: z.string().optional(),
});

const createAssetUnitSchema = z.object({
  itemId: z.string().min(1, "Barang wajib dipilih"),
  assetTag: z.string().optional(),
  serialNumber: z.string().optional(),
  locationId: z.string().min(1, "Lokasi penempatan wajib dipilih"),
  condition: z.enum(["good", "light_damage", "heavy_damage", "lost"]).default("good"),
  notes: z.string().optional(),
});

const updateAssetUnitSchema = z.object({
  locationId: z.string().optional(),
  status: z.enum(["available", "loaned", "maintenance", "disposed"]).optional(),
  condition: z.enum(["good", "light_damage", "heavy_damage", "lost"]).optional(),
  notes: z.string().optional(),
});

const createLoanSchema = z.object({
  unitId: z.string().min(1, "Unit aset wajib dipilih"),
  expectedReturnDate: z.string().min(1, "Estimasi tanggal kembali wajib diisi"),
  purpose: z.string().min(1, "Keperluan peminjaman wajib diisi"),
});

const approveLoanSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

const returnLoanSchema = z.object({
  returnCondition: z.enum(["good", "light_damage", "heavy_damage", "lost"]),
  inspectionNotes: z.string().optional(),
});

const createStockMovementSchema = z.object({
  itemId: z.string().min(1, "Barang wajib dipilih"),
  type: z.enum(["in", "out", "adjustment"]),
  quantity: z.number().int(),
  notes: z.string().optional(),
});

const createRequisitionSchema = z.object({
  itemId: z.string().min(1, "Barang wajib dipilih"),
  quantity: z.number().int().positive("Jumlah harus lebih dari 0"),
  reason: z.string().min(1, "Alasan permintaan wajib diisi"),
});

// Categories
inventoryRouter.get("/categories", async (c) => {
  const db = createDb(c.env.DB);
  try {
    const categories = await db
      .select()
      .from(inventoryCategories)
      .orderBy(inventoryCategories.name);
    return c.json({ categories });
  } catch {
    return c.json({ categories: [] });
  }
});

inventoryRouter.post("/categories", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid category payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  const db = createDb(c.env.DB);
  const id = `cat_${Date.now()}`;
  const category = {
    id,
    name: data.name,
    description: data.description ?? null,
    createdAt: new Date(),
  };

  try {
    await db.insert(inventoryCategories).values(category);
    return c.json({ message: "Kategori berhasil ditambahkan", category }, 201);
  } catch (err: unknown) {
    return c.json({ error: "Gagal menyimpan kategori", message: String(err) }, 500);
  }
});

// Locations
inventoryRouter.get("/locations", async (c) => {
  const db = createDb(c.env.DB);
  try {
    const locations = await db
      .select()
      .from(inventoryLocations)
      .orderBy(inventoryLocations.name);
    return c.json({ locations });
  } catch {
    return c.json({ locations: [] });
  }
});

inventoryRouter.post("/locations", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createLocationSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid location payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  const db = createDb(c.env.DB);
  const id = `loc_${Date.now()}`;
  const location = {
    id,
    name: data.name,
    code: data.code,
    description: data.description ?? null,
    createdAt: new Date(),
  };

  try {
    await db.insert(inventoryLocations).values(location);
    return c.json({ message: "Lokasi berhasil ditambahkan", location }, 201);
  } catch (err: unknown) {
    return c.json({ error: "Gagal menyimpan lokasi", message: String(err) }, 500);
  }
});

// Items Catalog
inventoryRouter.get("/items", async (c) => {
  const db = createDb(c.env.DB);
  const typeFilter = c.req.query("type") as "fixed_asset" | "consumable" | undefined;
  const categoryId = c.req.query("categoryId");

  try {
    const items = await db
      .select({
        id: inventoryItems.id,
        categoryId: inventoryItems.categoryId,
        categoryName: inventoryCategories.name,
        code: inventoryItems.code,
        name: inventoryItems.name,
        type: inventoryItems.type,
        unit: inventoryItems.unit,
        minStockAlert: inventoryItems.minStockAlert,
        description: inventoryItems.description,
        createdAt: inventoryItems.createdAt,
      })
      .from(inventoryItems)
      .leftJoin(
        inventoryCategories,
        eq(inventoryItems.categoryId, inventoryCategories.id)
      )
      .orderBy(desc(inventoryItems.createdAt));

    const filtered = items.filter((item: { type: string; categoryId: string }) => {
      if (typeFilter && item.type !== typeFilter) return false;
      if (categoryId && item.categoryId !== categoryId) return false;
      return true;
    });

    return c.json({ items: filtered });
  } catch {
    return c.json({ items: [] });
  }
});

inventoryRouter.post("/items", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid item payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  const db = createDb(c.env.DB);
  const id = `itm_${Date.now()}`;
  const item = {
    id,
    categoryId: data.categoryId,
    code: data.code,
    name: data.name,
    type: data.type,
    unit: data.unit,
    minStockAlert: data.minStockAlert,
    description: data.description ?? null,
    createdAt: new Date(),
  };

  try {
    await db.insert(inventoryItems).values(item);
    return c.json({ message: "Barang berhasil ditambahkan ke katalog", item }, 201);
  } catch (err: unknown) {
    return c.json({ error: "Gagal menyimpan barang ke katalog", message: String(err) }, 500);
  }
});

// Asset Units
inventoryRouter.get("/asset-units", async (c) => {
  const db = createDb(c.env.DB);
  const itemId = c.req.query("itemId");
  const locationId = c.req.query("locationId");
  const status = c.req.query("status");

  try {
    const units = await db
      .select({
        id: inventoryAssetUnits.id,
        itemId: inventoryAssetUnits.itemId,
        itemName: inventoryItems.name,
        itemCode: inventoryItems.code,
        assetTag: inventoryAssetUnits.assetTag,
        serialNumber: inventoryAssetUnits.serialNumber,
        locationId: inventoryAssetUnits.locationId,
        locationName: inventoryLocations.name,
        locationCode: inventoryLocations.code,
        status: inventoryAssetUnits.status,
        condition: inventoryAssetUnits.condition,
        notes: inventoryAssetUnits.notes,
        createdAt: inventoryAssetUnits.createdAt,
      })
      .from(inventoryAssetUnits)
      .leftJoin(inventoryItems, eq(inventoryAssetUnits.itemId, inventoryItems.id))
      .leftJoin(
        inventoryLocations,
        eq(inventoryAssetUnits.locationId, inventoryLocations.id)
      )
      .orderBy(desc(inventoryAssetUnits.createdAt));

    const filtered = units.filter((u: { itemId: string; locationId: string; status: string }) => {
      if (itemId && u.itemId !== itemId) return false;
      if (locationId && u.locationId !== locationId) return false;
      if (status && u.status !== status) return false;
      return true;
    });

    return c.json({ units: filtered });
  } catch {
    return c.json({ units: [] });
  }
});

inventoryRouter.post("/asset-units", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createAssetUnitSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid asset unit payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  const db = createDb(c.env.DB);
  const year = new Date().getFullYear();
  const countRand = Math.floor(1000 + Math.random() * 9000);
  const assetTag = data.assetTag || `AST/${year}/${countRand}`;

  const id = `ast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const unit = {
    id,
    itemId: data.itemId,
    assetTag,
    serialNumber: data.serialNumber ?? null,
    locationId: data.locationId,
    status: "available" as const,
    condition: data.condition,
    notes: data.notes ?? null,
    createdAt: new Date(),
  };

  try {
    await db.insert(inventoryAssetUnits).values(unit);
    return c.json({ message: "Unit aset berhasil didaftarkan", unit }, 201);
  } catch (err: unknown) {
    return c.json({ error: "Gagal mendaftarkan unit aset", message: String(err) }, 500);
  }
});

inventoryRouter.patch("/asset-units/:id", requireRoles("admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = updateAssetUnitSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid asset unit update payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  const db = createDb(c.env.DB);
  try {
    await db
      .update(inventoryAssetUnits)
      .set({
        ...(data.locationId && { locationId: data.locationId }),
        ...(data.status && { status: data.status }),
        ...(data.condition && { condition: data.condition }),
        ...(data.notes !== undefined && { notes: data.notes }),
      })
      .where(eq(inventoryAssetUnits.id, id));

    return c.json({ message: "Unit aset berhasil diperbarui" });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memperbarui unit aset", message: String(err) }, 500);
  }
});

// Issue #3: Asset Loans & Circulation
inventoryRouter.get("/loans", async (c) => {
  const db = createDb(c.env.DB);
  const user = c.get("user" as never) as { id: string; role: string } | undefined;

  try {
    const loans = await db
      .select({
        id: inventoryLoans.id,
        unitId: inventoryLoans.unitId,
        assetTag: inventoryAssetUnits.assetTag,
        itemName: inventoryItems.name,
        borrowerId: inventoryLoans.borrowerId,
        borrowerName: users.fullName,
        loanDate: inventoryLoans.loanDate,
        expectedReturnDate: inventoryLoans.expectedReturnDate,
        actualReturnDate: inventoryLoans.actualReturnDate,
        purpose: inventoryLoans.purpose,
        outCondition: inventoryLoans.outCondition,
        returnCondition: inventoryLoans.returnCondition,
        status: inventoryLoans.status,
        inspectionNotes: inventoryLoans.inspectionNotes,
      })
      .from(inventoryLoans)
      .leftJoin(inventoryAssetUnits, eq(inventoryLoans.unitId, inventoryAssetUnits.id))
      .leftJoin(inventoryItems, eq(inventoryAssetUnits.itemId, inventoryItems.id))
      .leftJoin(users, eq(inventoryLoans.borrowerId, users.id))
      .orderBy(desc(inventoryLoans.createdAt));

    // If teacher, only return their loans unless admin
    const filtered = loans.filter((l) => {
      if (user?.role !== "admin_tu" && user?.role !== "admin" && l.borrowerId !== user?.id) {
        return false;
      }
      return true;
    });

    return c.json({ loans: filtered });
  } catch {
    return c.json({ loans: [] });
  }
});

inventoryRouter.post("/loans", async (c) => {
  const user = c.get("user" as never) as { id: string } | undefined;
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => null);
  const parsed = createLoanSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid loan payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  const db = createDb(c.env.DB);
  const id = `loan_${Date.now()}`;

  try {
    const loan = {
      id,
      unitId: data.unitId,
      borrowerId: user.id,
      loanDate: new Date(),
      expectedReturnDate: new Date(data.expectedReturnDate),
      purpose: data.purpose,
      outCondition: "good" as const,
      status: "pending" as const,
      createdAt: new Date(),
    };

    await db.insert(inventoryLoans).values(loan);
    return c.json({ message: "Pengajuan pinjaman berhasil dibuat", loan }, 201);
  } catch (err: unknown) {
    return c.json({ error: "Gagal membuat permohonan pinjam", message: String(err) }, 500);
  }
});

inventoryRouter.post("/loans/:id/approval", requireRoles("admin"), async (c) => {
  const loanId = c.req.param("id");
  const user = c.get("user" as never) as { id: string } | undefined;
  const body = await c.req.json().catch(() => null);
  const parsed = approveLoanSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid approval payload", details: parsed.error }, 400);
  }

  const db = createDb(c.env.DB);
  const isApprove = parsed.data.action === "approve";

  try {
    const loanRecord = await db.select().from(inventoryLoans).where(eq(inventoryLoans.id, loanId)).limit(1);
    if (!loanRecord.length) return c.json({ error: "Peminjaman tidak ditemukan" }, 404);

    await db
      .update(inventoryLoans)
      .set({
        status: isApprove ? "borrowed" : "rejected",
        approverId: user?.id,
      })
      .where(eq(inventoryLoans.id, loanId));

    if (isApprove) {
      await db
        .update(inventoryAssetUnits)
        .set({ status: "loaned" })
        .where(eq(inventoryAssetUnits.id, loanRecord[0].unitId));
    }

    return c.json({ message: isApprove ? "Peminjaman disetujui" : "Peminjaman ditolak" });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memproses persetujuan", message: String(err) }, 500);
  }
});

inventoryRouter.post("/loans/:id/return", requireRoles("admin"), async (c) => {
  const loanId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = returnLoanSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid return payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  const db = createDb(c.env.DB);

  try {
    const loanRecord = await db.select().from(inventoryLoans).where(eq(inventoryLoans.id, loanId)).limit(1);
    if (!loanRecord.length) return c.json({ error: "Peminjaman tidak ditemukan" }, 404);

    await db
      .update(inventoryLoans)
      .set({
        status: "returned",
        actualReturnDate: new Date(),
        returnCondition: data.returnCondition,
        inspectionNotes: data.inspectionNotes ?? null,
      })
      .where(eq(inventoryLoans.id, loanId));

    await db
      .update(inventoryAssetUnits)
      .set({
        status: "available",
        condition: data.returnCondition,
      })
      .where(eq(inventoryAssetUnits.id, loanRecord[0].unitId));

    return c.json({ message: "Aset berhasil dikembalikan dan diinspeksi" });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memproses pengembalian", message: String(err) }, 500);
  }
});

// Issue #4: Consumables & Stock Movements
inventoryRouter.get("/stock-movements", async (c) => {
  const db = createDb(c.env.DB);
  const itemId = c.req.query("itemId");

  try {
    const movements = await db
      .select({
        id: inventoryStockMovements.id,
        itemId: inventoryStockMovements.itemId,
        itemName: inventoryItems.name,
        itemCode: inventoryItems.code,
        unit: inventoryItems.unit,
        type: inventoryStockMovements.type,
        quantity: inventoryStockMovements.quantity,
        balanceAfter: inventoryStockMovements.balanceAfter,
        notes: inventoryStockMovements.notes,
        createdAt: inventoryStockMovements.createdAt,
      })
      .from(inventoryStockMovements)
      .leftJoin(inventoryItems, eq(inventoryStockMovements.itemId, inventoryItems.id))
      .orderBy(desc(inventoryStockMovements.createdAt));

    const filtered = itemId ? movements.filter((m) => m.itemId === itemId) : movements;
    return c.json({ movements: filtered });
  } catch {
    return c.json({ movements: [] });
  }
});

inventoryRouter.post("/stock-movements", requireRoles("admin"), async (c) => {
  const user = c.get("user" as never) as { id: string } | undefined;
  const body = await c.req.json().catch(() => null);
  const parsed = createStockMovementSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid stock movement payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  const db = createDb(c.env.DB);

  try {
    const lastMv = await db
      .select()
      .from(inventoryStockMovements)
      .where(eq(inventoryStockMovements.itemId, data.itemId))
      .orderBy(desc(inventoryStockMovements.createdAt))
      .limit(1);

    const currentBalance = lastMv.length > 0 ? lastMv[0].balanceAfter : 0;
    let newBalance = currentBalance;

    if (data.type === "in") {
      newBalance = currentBalance + data.quantity;
    } else if (data.type === "out") {
      if (currentBalance < data.quantity) {
        return c.json({ error: "Stok tidak mencukupi untuk pengeluaran barang" }, 400);
      }
      newBalance = currentBalance - data.quantity;
    } else {
      // adjustment / opname
      newBalance = data.quantity;
    }

    const id = `sm_${Date.now()}`;
    const movement = {
      id,
      itemId: data.itemId,
      type: data.type,
      quantity: data.quantity,
      balanceAfter: newBalance,
      referenceUser: user?.id,
      notes: data.notes ?? null,
      createdAt: new Date(),
    };

    await db.insert(inventoryStockMovements).values(movement);
    return c.json({ message: "Mutasi persediaan berhasil dicatat", movement }, 201);
  } catch (err: unknown) {
    return c.json({ error: "Gagal mencatat mutasi stok", message: String(err) }, 500);
  }
});

inventoryRouter.get("/requisitions", async (c) => {
  const db = createDb(c.env.DB);
  const user = c.get("user" as never) as { id: string; role: string } | undefined;

  try {
    const reqs = await db
      .select({
        id: inventoryRequisitions.id,
        itemId: inventoryRequisitions.itemId,
        itemName: inventoryItems.name,
        unit: inventoryItems.unit,
        requesterId: inventoryRequisitions.requesterId,
        requesterName: users.fullName,
        quantity: inventoryRequisitions.quantity,
        reason: inventoryRequisitions.reason,
        status: inventoryRequisitions.status,
        createdAt: inventoryRequisitions.createdAt,
      })
      .from(inventoryRequisitions)
      .leftJoin(inventoryItems, eq(inventoryRequisitions.itemId, inventoryItems.id))
      .leftJoin(users, eq(inventoryRequisitions.requesterId, users.id))
      .orderBy(desc(inventoryRequisitions.createdAt));

    const filtered = reqs.filter((r) => {
      if (user?.role !== "admin_tu" && user?.role !== "admin" && r.requesterId !== user?.id) {
        return false;
      }
      return true;
    });

    return c.json({ requisitions: filtered });
  } catch {
    return c.json({ requisitions: [] });
  }
});

inventoryRouter.post("/requisitions", async (c) => {
  const user = c.get("user" as never) as { id: string } | undefined;
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => null);
  const parsed = createRequisitionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid requisition payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  const db = createDb(c.env.DB);
  const id = `req_${Date.now()}`;

  try {
    const requisition = {
      id,
      itemId: data.itemId,
      requesterId: user.id,
      quantity: data.quantity,
      reason: data.reason,
      status: "pending" as const,
      createdAt: new Date(),
    };

    await db.insert(inventoryRequisitions).values(requisition);
    return c.json({ message: "Permintaan ATK berhasil diajukan", requisition }, 201);
  } catch (err: unknown) {
    return c.json({ error: "Gagal mengajukan permintaan barang", message: String(err) }, 500);
  }
});
