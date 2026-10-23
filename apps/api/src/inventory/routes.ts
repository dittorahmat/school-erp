import { Hono } from "hono";
import { z } from "zod";
import {
  createDb,
  inventoryCategories,
  inventoryItems,
  inventoryLocations,
  inventoryAssetUnits,
  desc,
  eq,
} from "@school-erp/db";
import { authMiddleware, requireRoles } from "../auth/middleware";
import type { Bindings } from "../index";

export const inventoryRouter = new Hono<{ Bindings: Bindings }>();

// All inventory operations require authentication and admin/staff role
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

inventoryRouter.post(
  "/categories",
  requireRoles("admin"),
  async (c) => {
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
  }
);

// Locations / Facilities
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

inventoryRouter.post(
  "/locations",
  requireRoles("admin"),
  async (c) => {
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
  }
);

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

inventoryRouter.post(
  "/items",
  requireRoles("admin"),
  async (c) => {
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
  }
);

// Asset Units (Fixed Assets specific)
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

inventoryRouter.post(
  "/asset-units",
  requireRoles("admin"),
  async (c) => {
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
  }
);

inventoryRouter.patch(
  "/asset-units/:id",
  requireRoles("admin"),
  async (c) => {
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
  }
);
