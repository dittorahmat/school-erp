import { Hono } from "hono";
import { z } from "zod";
import {
  createDb,
  inventoryCategories,
  inventoryItems,
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

const createItemSchema = z.object({
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  code: z.string().min(1, "Kode barang wajib diisi"),
  name: z.string().min(1, "Nama barang wajib diisi"),
  type: z.enum(["fixed_asset", "consumable"]),
  unit: z.string().min(1, "Satuan unit wajib diisi"),
  minStockAlert: z.number().int().min(0).default(0),
  description: z.string().optional(),
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
