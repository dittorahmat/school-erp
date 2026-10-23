import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const inventoryCategories = sqliteTable("inventory_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. "Elektronik & Multimedia", "ATK & Kertas", "Alat Olahraga"
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const inventoryItems = sqliteTable("inventory_items", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => inventoryCategories.id, { onDelete: "restrict" }),
  code: text("code").notNull().unique(), // e.g. "BRG-ELK-001"
  name: text("name").notNull(), // e.g. "Proyektor Epson EB-X500"
  type: text("type", { enum: ["fixed_asset", "consumable"] }).notNull(),
  unit: text("unit").notNull(), // e.g. "unit", "buah", "rim", "kotak"
  minStockAlert: integer("min_stock_alert").notNull().default(0), // Reorder threshold for consumables
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
