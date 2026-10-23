import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { users } from "./auth";

export const inventoryCategories = sqliteTable("inventory_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. "Elektronik & Multimedia", "ATK & Kertas", "Alat Olahraga"
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const inventoryLocations = sqliteTable("inventory_locations", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g. "Lab Komputer 1", "Ruang Guru", "Gudang Sarpras"
  code: text("code").notNull().unique(), // e.g. "LOC-LAB-1"
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

export const inventoryAssetUnits = sqliteTable("inventory_asset_units", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  assetTag: text("asset_tag").notNull().unique(), // e.g. "AST/ELK/2026/0001"
  serialNumber: text("serial_number"), // e.g. "SN-EP-998231"
  locationId: text("location_id")
    .notNull()
    .references(() => inventoryLocations.id, { onDelete: "restrict" }),
  status: text("status", {
    enum: ["available", "loaned", "maintenance", "disposed"],
  })
    .notNull()
    .default("available"),
  condition: text("condition", {
    enum: ["good", "light_damage", "heavy_damage", "lost"],
  })
    .notNull()
    .default("good"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Issue #3: Asset Loans & Circulation
export const inventoryLoans = sqliteTable("inventory_loans", {
  id: text("id").primaryKey(),
  unitId: text("unit_id")
    .notNull()
    .references(() => inventoryAssetUnits.id, { onDelete: "cascade" }),
  borrowerId: text("borrower_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  approverId: text("approver_id").references(() => users.id),
  loanDate: integer("loan_date", { mode: "timestamp" }).notNull(),
  expectedReturnDate: integer("expected_return_date", { mode: "timestamp" }).notNull(),
  actualReturnDate: integer("actual_return_date", { mode: "timestamp" }),
  purpose: text("purpose").notNull(),
  outCondition: text("out_condition", {
    enum: ["good", "light_damage", "heavy_damage", "lost"],
  })
    .notNull()
    .default("good"),
  returnCondition: text("return_condition", {
    enum: ["good", "light_damage", "heavy_damage", "lost"],
  }),
  status: text("status", {
    enum: ["pending", "borrowed", "returned", "overdue", "rejected"],
  })
    .notNull()
    .default("pending"),
  inspectionNotes: text("inspection_notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Issue #4: Consumables & Stock Movements
export const inventoryStockMovements = sqliteTable("inventory_stock_movements", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["in", "out", "adjustment"] }).notNull(),
  quantity: integer("quantity").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  referenceUser: text("reference_user").references(() => users.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const inventoryRequisitions = sqliteTable("inventory_requisitions", {
  id: text("id").primaryKey(),
  itemId: text("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  requesterId: text("requester_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  approverId: text("approver_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
