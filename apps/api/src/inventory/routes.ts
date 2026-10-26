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
  ne,
  and,
  demoSeedCategories,
  demoSeedLocations,
  demoSeedInventoryItems,
  demoSeedAssetUnits,
  demoSeedLoans,
  demoSeedStockMovements,
} from "@school-erp/db";
import { authMiddleware, requireRoles } from "../auth/middleware";
import type { Bindings } from "../index";
import { AssetCirculation } from "./circulation";
import { StockLedger } from "./ledger";
import { ItemCatalog, CatalogDomainError } from "./catalog";
import { isEmptyDatabase } from "../empty-database";

export const inventoryRouter = new Hono<{ Bindings: Bindings }>();

// All inventory operations require authentication
inventoryRouter.use("*", authMiddleware());

const createCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  description: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").optional(),
  description: z.string().nullable().optional(),
});

const createLocationSchema = z.object({
  name: z.string().min(1, "Nama lokasi wajib diisi"),
  code: z.string().min(1, "Kode lokasi wajib diisi"),
  description: z.string().optional(),
});

const updateLocationSchema = z.object({
  name: z.string().min(1, "Nama lokasi wajib diisi").optional(),
  code: z.string().min(1, "Kode lokasi wajib diisi").optional(),
  description: z.string().nullable().optional(),
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

const updateItemSchema = z.object({
  name: z.string().min(1, "Nama barang tidak boleh kosong").optional(),
  code: z.string().min(1, "Kode barang tidak boleh kosong").optional(),
  categoryId: z.string().min(1, "Kategori wajib dipilih").optional(),
  minStockAlert: z.number().int().min(0).optional(),
  description: z.string().nullable().optional(),
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
  serialNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
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

const approveRequisitionSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

type Actor = { sub: string; username: string; role: string };

async function resolveActor(db: ReturnType<typeof createDb>, user: Actor | undefined) {
  if (!user) return { id: "system", role: "system" };
  try {
    const rows = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.username, user.username))
      .limit(1);
    if (rows[0]) return rows[0];
  } catch {
    // fall through to token identity
  }
  return { id: user.sub, role: user.role };
}

// Categories
inventoryRouter.get("/categories", async (c) => {
  const db = createDb(c.env.DB);
  try {
    const categories = await db
      .select()
      .from(inventoryCategories)
      .orderBy(inventoryCategories.name);
    if (categories.length > 0) return c.json({ categories });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat kategori inventaris", message: String(err) }, 500);
  }
  if (!(await isEmptyDatabase(db))) return c.json({ categories: [] });
  return c.json({ categories: demoSeedCategories });
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

inventoryRouter.patch("/categories/:id", requireRoles("admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid category update payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  if (data.name === undefined && data.description === undefined) {
    return c.json({ error: "Tidak ada data kategori yang diperbarui" }, 400);
  }

  const db = createDb(c.env.DB);
  try {
    const existing = await db
      .select()
      .from(inventoryCategories)
      .where(eq(inventoryCategories.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Kategori tidak ditemukan" }, 404);
    }

    if (data.name && data.name !== existing[0].name) {
      const dup = await db
        .select({ id: inventoryCategories.id })
        .from(inventoryCategories)
        .where(eq(inventoryCategories.name, data.name))
        .limit(1);
      if (dup.length > 0) {
        return c.json({ error: "Nama kategori sudah digunakan" }, 400);
      }
    }

    const updates: Partial<{ name: string; description: string | null }> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;

    await db
      .update(inventoryCategories)
      .set(updates)
      .where(eq(inventoryCategories.id, id));

    return c.json({
      message: "Kategori berhasil diperbarui",
      category: {
        ...existing[0],
        ...updates,
      },
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memperbarui kategori", message: String(err) }, 500);
  }
});

inventoryRouter.delete("/categories/:id", requireRoles("admin"), async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select()
      .from(inventoryCategories)
      .where(eq(inventoryCategories.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Kategori tidak ditemukan" }, 404);
    }

    const items = await db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(eq(inventoryItems.categoryId, id))
      .limit(1);

    if (items.length > 0) {
      return c.json(
        { error: "Kategori tidak dapat dihapus karena masih digunakan oleh barang inventaris" },
        400
      );
    }

    await db.delete(inventoryCategories).where(eq(inventoryCategories.id, id));
    return c.json({ message: "Kategori berhasil dihapus", id });
  } catch (err: unknown) {
    return c.json({ error: "Gagal menghapus kategori", message: String(err) }, 500);
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
    if (locations.length > 0) return c.json({ locations });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat lokasi inventaris", message: String(err) }, 500);
  }
  if (!(await isEmptyDatabase(db))) return c.json({ locations: [] });
  return c.json({ locations: demoSeedLocations });
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

inventoryRouter.patch("/locations/:id", requireRoles("admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = updateLocationSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid location update payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  if (data.name === undefined && data.code === undefined && data.description === undefined) {
    return c.json({ error: "Tidak ada data lokasi yang diperbarui" }, 400);
  }

  const db = createDb(c.env.DB);
  try {
    const existing = await db
      .select()
      .from(inventoryLocations)
      .where(eq(inventoryLocations.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Lokasi tidak ditemukan" }, 404);
    }

    if (data.code && data.code !== existing[0].code) {
      const dup = await db
        .select({ id: inventoryLocations.id })
        .from(inventoryLocations)
        .where(eq(inventoryLocations.code, data.code))
        .limit(1);
      if (dup.length > 0) {
        return c.json({ error: "Kode lokasi sudah digunakan" }, 400);
      }
    }

    if (data.name && data.name !== existing[0].name) {
      const dupName = await db
        .select({ id: inventoryLocations.id })
        .from(inventoryLocations)
        .where(eq(inventoryLocations.name, data.name))
        .limit(1);
      if (dupName.length > 0) {
        return c.json({ error: "Nama lokasi sudah digunakan" }, 400);
      }
    }

    const updates: Partial<{ name: string; code: string; description: string | null }> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.code !== undefined) updates.code = data.code;
    if (data.description !== undefined) updates.description = data.description;

    await db
      .update(inventoryLocations)
      .set(updates)
      .where(eq(inventoryLocations.id, id));

    return c.json({
      message: "Lokasi berhasil diperbarui",
      location: {
        ...existing[0],
        ...updates,
      },
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memperbarui lokasi", message: String(err) }, 500);
  }
});

inventoryRouter.delete("/locations/:id", requireRoles("admin"), async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select()
      .from(inventoryLocations)
      .where(eq(inventoryLocations.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Lokasi tidak ditemukan" }, 404);
    }

    const units = await db
      .select({ id: inventoryAssetUnits.id })
      .from(inventoryAssetUnits)
      .where(eq(inventoryAssetUnits.locationId, id))
      .limit(1);

    if (units.length > 0) {
      return c.json(
        { error: "Lokasi tidak dapat dihapus karena masih ada unit aset di lokasi ini" },
        400
      );
    }

    await db.delete(inventoryLocations).where(eq(inventoryLocations.id, id));
    return c.json({ message: "Lokasi berhasil dihapus", id });
  } catch (err: unknown) {
    return c.json({ error: "Gagal menghapus lokasi", message: String(err) }, 500);
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

    if (items.length > 0) {
      const filtered = items.filter((item: { type: string; categoryId: string }) => {
        if (typeFilter && item.type !== typeFilter) return false;
        if (categoryId && item.categoryId !== categoryId) return false;
        return true;
      });
      return c.json({ items: filtered });
    }
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat katalog barang", message: String(err) }, 500);
  }

  if (!(await isEmptyDatabase(db))) return c.json({ items: [] });

  const filteredDemo = demoSeedInventoryItems.filter((item) => {
    if (typeFilter && item.type !== typeFilter) return false;
    if (categoryId && item.categoryId !== categoryId) return false;
    return true;
  });
  return c.json({ items: filteredDemo });
});

inventoryRouter.post("/items", requireRoles("admin"), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid item payload", details: parsed.error }, 400);
  }

  const db = createDb(c.env.DB);
  const catalog = new ItemCatalog(db);

  try {
    const item = await catalog.registerItem(parsed.data);
    return c.json({ message: "Barang berhasil ditambahkan ke katalog", item }, 201);
  } catch (err: unknown) {
    if (err instanceof CatalogDomainError) {
      return c.json({ error: err.message }, err.statusCode as any);
    }
    return c.json({ error: "Gagal menyimpan barang ke katalog", message: String(err) }, 500);
  }
});

inventoryRouter.patch("/items/:id", requireRoles("admin"), async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid item update payload", details: parsed.error }, 400);
  }

  const db = createDb(c.env.DB);
  const catalog = new ItemCatalog(db);

  try {
    const updated = await catalog.updateItem(id, parsed.data);
    return c.json({
      message: "Barang berhasil diperbarui",
      item: updated,
    });
  } catch (err: unknown) {
    if (err instanceof CatalogDomainError) {
      return c.json({ error: err.message }, err.statusCode as any);
    }
    return c.json({ error: "Gagal memperbarui barang", message: String(err) }, 500);
  }
});

inventoryRouter.delete("/items/:id", requireRoles("admin"), async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);
  const catalog = new ItemCatalog(db);

  try {
    const result = await catalog.deleteItem(id);
    return c.json({ message: "Barang berhasil dihapus", id: result.id });
  } catch (err: unknown) {
    if (err instanceof CatalogDomainError) {
      return c.json({ error: err.message }, err.statusCode as any);
    }
    return c.json({ error: "Gagal menghapus barang", message: String(err) }, 500);
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

    if (units.length > 0) {
      const filtered = units.filter((u: { itemId: string; locationId: string; status: string }) => {
        if (itemId && u.itemId !== itemId) return false;
        if (locationId && u.locationId !== locationId) return false;
        if (status && u.status !== status) return false;
        return true;
      });
      return c.json({ units: filtered });
    }
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat unit aset", message: String(err) }, 500);
  }

  if (!(await isEmptyDatabase(db))) return c.json({ units: [] });

  const filteredDemo = demoSeedAssetUnits.filter((u) => {
    if (itemId && u.itemId !== itemId) return false;
    if (locationId && u.locationId !== locationId) return false;
    if (status && u.status !== status) return false;
    return true;
  });
  return c.json({ units: filteredDemo });
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
  if (
    data.locationId === undefined &&
    data.status === undefined &&
    data.condition === undefined &&
    data.serialNumber === undefined &&
    data.notes === undefined
  ) {
    return c.json({ error: "Tidak ada data unit aset yang diperbarui" }, 400);
  }

  const db = createDb(c.env.DB);
  try {
    const existing = await db
      .select()
      .from(inventoryAssetUnits)
      .where(eq(inventoryAssetUnits.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Unit aset tidak ditemukan" }, 404);
    }

    if (data.locationId && data.locationId !== existing[0].locationId) {
      const loc = await db
        .select({ id: inventoryLocations.id })
        .from(inventoryLocations)
        .where(eq(inventoryLocations.id, data.locationId))
        .limit(1);
      if (loc.length === 0) {
        return c.json({ error: "Lokasi tidak ditemukan" }, 400);
      }
    }

    const updates: Partial<{
      locationId: string;
      status: "available" | "loaned" | "maintenance" | "disposed";
      condition: "good" | "light_damage" | "heavy_damage" | "lost";
      serialNumber: string | null;
      notes: string | null;
    }> = {};

    if (data.locationId !== undefined) updates.locationId = data.locationId;
    if (data.status !== undefined) updates.status = data.status;
    if (data.condition !== undefined) updates.condition = data.condition;
    if (data.serialNumber !== undefined) updates.serialNumber = data.serialNumber;
    if (data.notes !== undefined) updates.notes = data.notes;

    await db
      .update(inventoryAssetUnits)
      .set(updates)
      .where(eq(inventoryAssetUnits.id, id));

    return c.json({
      message: "Unit aset berhasil diperbarui",
      unit: {
        ...existing[0],
        ...updates,
      },
    });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memperbarui unit aset", message: String(err) }, 500);
  }
});

inventoryRouter.delete("/asset-units/:id", requireRoles("admin"), async (c) => {
  const id = c.req.param("id");
  const db = createDb(c.env.DB);

  try {
    const existing = await db
      .select()
      .from(inventoryAssetUnits)
      .where(eq(inventoryAssetUnits.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: "Unit aset tidak ditemukan" }, 404);
    }

    if (existing[0].status === "loaned") {
      return c.json(
        { error: "Unit aset tidak dapat dihapus karena saat ini sedang dipinjam (status: loaned)" },
        400
      );
    }

    await db.delete(inventoryAssetUnits).where(eq(inventoryAssetUnits.id, id));
    return c.json({ message: "Unit aset berhasil dihapus", id });
  } catch (err: unknown) {
    return c.json({ error: "Gagal menghapus unit aset", message: String(err) }, 500);
  }
});

// Issue #3: Asset Loans & Circulation
inventoryRouter.get("/loans", async (c) => {
  const db = createDb(c.env.DB);
  const user = c.get("user" as never) as Actor | undefined;

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

    if (loans.length > 0) {
      const filtered = loans.filter((l) => {
        if (user?.role !== "admin_tu" && user?.role !== "admin" && l.borrowerId !== user?.sub) {
          return false;
        }
        return true;
      });
      const now = Date.now();
      return c.json({
        loans: filtered.map((loan) => ({
          ...loan,
          status:
            loan.status === "borrowed" &&
            new Date(loan.expectedReturnDate as unknown as string).getTime() < now
              ? "overdue"
              : loan.status,
        })),
      });
    }
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat data peminjaman", message: String(err) }, 500);
  }

  if (!(await isEmptyDatabase(db))) return c.json({ loans: [] });

  const now = Date.now();
  return c.json({
    loans: demoSeedLoans.map((loan) => ({
      ...loan,
      status:
        loan.status === "borrowed" &&
        new Date(loan.expectedReturnDate as unknown as string).getTime() < now
          ? "overdue"
          : loan.status,
    })),
  });
});

inventoryRouter.post("/loans", async (c) => {
  const user = c.get("user" as never) as Actor | undefined;
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => null);
  const parsed = createLoanSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid loan payload", details: parsed.error }, 400);
  }

  const data = parsed.data;
  const db = createDb(c.env.DB);
  const circulation = new AssetCirculation(db);

  try {
    const actor = await resolveActor(db, user);
    const loan = await circulation.requestLoan({
      unitId: data.unitId,
      borrowerId: actor.id,
      expectedReturnDate: new Date(data.expectedReturnDate),
      purpose: data.purpose,
    });
    return c.json({ message: "Pengajuan pinjaman berhasil dibuat", loan }, 201);
  } catch (err: unknown) {
    const message = String(err);
    const status = message.includes("tidak ditemukan") ? 404 : 400;
    return c.json({ error: "Gagal membuat permohonan pinjam", message }, status);
  }
});

inventoryRouter.post("/loans/:id/approval", requireRoles("admin"), async (c) => {
  const loanId = c.req.param("id");
  const user = c.get("user" as never) as Actor | undefined;
  const body = await c.req.json().catch(() => null);
  const parsed = approveLoanSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid approval payload", details: parsed.error }, 400);
  }

  const db = createDb(c.env.DB);
  const circulation = new AssetCirculation(db);

  try {
    const actor = await resolveActor(db, user);
    const result = await circulation.processApproval(
      loanId,
      actor.id,
      parsed.data.action
    );
    return c.json({ message: result.status === "borrowed" ? "Peminjaman disetujui" : "Peminjaman ditolak" });
  } catch (err: unknown) {
    const message = String(err);
    const status = message.includes("tidak ditemukan") ? 404 : 400;
    return c.json({ error: "Gagal memproses persetujuan", message }, status);
  }
});

inventoryRouter.post("/loans/:id/return", requireRoles("admin"), async (c) => {
  const loanId = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = returnLoanSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid return payload", details: parsed.error }, 400);
  }

  const db = createDb(c.env.DB);
  const circulation = new AssetCirculation(db);

  try {
    await circulation.processReturn({
      loanId,
      returnCondition: parsed.data.returnCondition,
      inspectionNotes: parsed.data.inspectionNotes,
    });
    return c.json({ message: "Aset berhasil dikembalikan dan diinspeksi" });
  } catch (err: unknown) {
    const message = String(err);
    const status = message.includes("tidak ditemukan") ? 404 : 400;
    return c.json({ error: "Gagal memproses pengembalian", message }, status);
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

    if (movements.length > 0) {
      const filtered = itemId ? movements.filter((m) => m.itemId === itemId) : movements;
      return c.json({ movements: filtered });
    }
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat mutasi stok", message: String(err) }, 500);
  }

  if (!(await isEmptyDatabase(db))) return c.json({ movements: [] });

  const filteredDemo = itemId ? demoSeedStockMovements.filter((m) => m.itemId === itemId) : demoSeedStockMovements;
  return c.json({ movements: filteredDemo });
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
  const ledger = new StockLedger(db);

  try {
    const movement = await ledger.recordMovement({
      itemId: data.itemId,
      type: data.type,
      quantity: data.quantity,
      notes: data.notes,
      referenceUser: user?.id,
    });
    return c.json({ message: "Mutasi persediaan berhasil dicatat", movement }, 201);
  } catch (err: unknown) {
    const message = String(err);
    const status = message.includes("tidak mencukupi") ? 400 : 500;
    return c.json({ error: "Gagal mencatat mutasi stok", message }, status);
  }
});

inventoryRouter.get("/requisitions", async (c) => {
  const db = createDb(c.env.DB);
  const user = c.get("user" as never) as Actor | undefined;

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
      if (user?.role !== "admin_tu" && user?.role !== "admin" && r.requesterId !== user?.sub) {
        return false;
      }
      return true;
    });

    return c.json({ requisitions: filtered });
  } catch (err: unknown) {
    return c.json({ error: "Gagal memuat permintaan barang", message: String(err) }, 500);
  }
});

inventoryRouter.post("/requisitions", async (c) => {
  const user = c.get("user" as never) as Actor | undefined;
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
    const actor = await resolveActor(db, user);
    const requisition = {
      id,
      itemId: data.itemId,
      requesterId: actor.id,
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

inventoryRouter.post("/requisitions/:id/approval", requireRoles("admin"), async (c) => {
  const requisitionId = c.req.param("id");
  const user = c.get("user" as never) as Actor | undefined;
  const body = await c.req.json().catch(() => null);
  const parsed = approveRequisitionSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid requisition approval payload", details: parsed.error }, 400);
  }

  const db = createDb(c.env.DB);
  const ledger = new StockLedger(db);

  try {
    const actor = await resolveActor(db, user);
    const result = await ledger.fulfillRequisition({
      requisitionId,
      approverId: actor.id,
      decision: parsed.data.action,
    });

    return c.json({
      message: result.status === "approved" ? "Permintaan ATK disetujui" : "Permintaan ATK ditolak",
      data: result,
    });
  } catch (err: unknown) {
    const message = String(err);
    const status = message.includes("tidak ditemukan") ? 404 : 400;
    return c.json({ error: "Gagal memproses permintaan ATK", message }, status);
  }
});
