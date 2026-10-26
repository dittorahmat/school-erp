import {
  inventoryItems,
  inventoryCategories,
  inventoryAssetUnits,
  inventoryStockMovements,
  eq,
} from "@school-erp/db";

export interface CatalogDatabaseAdapter {
  select(fields?: any): any;
  insert(table: any): { values(val: any): Promise<any> };
  update(table: any): { set(val: any): { where(clause: any): Promise<any> } };
  delete(table: any): { where(clause: any): Promise<any> };
}

export interface CreateItemInput {
  categoryId: string;
  code: string;
  name: string;
  type: "fixed_asset" | "consumable";
  unit: string;
  minStockAlert?: number;
  description?: string | null;
}

export interface UpdateItemInput {
  name?: string;
  code?: string;
  categoryId?: string;
  minStockAlert?: number;
  description?: string | null;
}

export class CatalogDomainError extends Error {
  constructor(message: string, public statusCode: number = 400) {
    super(message);
    this.name = "CatalogDomainError";
  }
}

/**
 * Deep domain module: ItemCatalog
 * Encapsulates item master catalogue operations, integrity checks,
 * uniqueness invariants, and cascading deletion guards.
 */
export class ItemCatalog {
  constructor(private db: CatalogDatabaseAdapter) {}

  /**
   * Registers a new item into the catalogue.
   */
  async registerItem(input: CreateItemInput) {
    const id = `itm_${Date.now()}`;
    const item = {
      id,
      categoryId: input.categoryId,
      code: input.code,
      name: input.name,
      type: input.type,
      unit: input.unit,
      minStockAlert: input.minStockAlert ?? 0,
      description: input.description ?? null,
      createdAt: new Date(),
    };

    await this.db.insert(inventoryItems).values(item);
    return item;
  }

  /**
   * Updates an existing catalog item with uniqueness validation on code and category existence.
   */
  async updateItem(id: string, input: UpdateItemInput) {
    if (
      input.name === undefined &&
      input.code === undefined &&
      input.categoryId === undefined &&
      input.minStockAlert === undefined &&
      input.description === undefined
    ) {
      throw new CatalogDomainError("Tidak ada data barang yang diperbarui", 400);
    }

    const existing = await this.db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .limit(1);

    if (!existing || existing.length === 0) {
      throw new CatalogDomainError("Barang tidak ditemukan", 404);
    }

    if (input.code && input.code !== existing[0].code) {
      const dup = await this.db
        .select({ id: inventoryItems.id })
        .from(inventoryItems)
        .where(eq(inventoryItems.code, input.code))
        .limit(1);

      if (dup && dup.length > 0) {
        throw new CatalogDomainError("Kode barang sudah digunakan", 400);
      }
    }

    if (input.categoryId && input.categoryId !== existing[0].categoryId) {
      const cat = await this.db
        .select({ id: inventoryCategories.id })
        .from(inventoryCategories)
        .where(eq(inventoryCategories.id, input.categoryId))
        .limit(1);

      if (!cat || cat.length === 0) {
        throw new CatalogDomainError("Kategori tidak ditemukan", 400);
      }
    }

    const updates: Partial<{
      name: string;
      code: string;
      categoryId: string;
      minStockAlert: number;
      description: string | null;
    }> = {};

    if (input.name !== undefined) updates.name = input.name;
    if (input.code !== undefined) updates.code = input.code;
    if (input.categoryId !== undefined) updates.categoryId = input.categoryId;
    if (input.minStockAlert !== undefined) updates.minStockAlert = input.minStockAlert;
    if (input.description !== undefined) updates.description = input.description;

    await this.db.update(inventoryItems).set(updates).where(eq(inventoryItems.id, id));

    return {
      ...existing[0],
      ...updates,
    };
  }

  /**
   * Safely deletes a catalog item, enforcing deletion guards against physical units and stock movements.
   */
  async deleteItem(id: string) {
    const existing = await this.db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id))
      .limit(1);

    if (!existing || existing.length === 0) {
      throw new CatalogDomainError("Barang tidak ditemukan", 404);
    }

    const units = await this.db
      .select({ id: inventoryAssetUnits.id })
      .from(inventoryAssetUnits)
      .where(eq(inventoryAssetUnits.itemId, id))
      .limit(1);

    if (units && units.length > 0) {
      throw new CatalogDomainError(
        "Barang tidak dapat dihapus karena masih memiliki unit fisik aset terdaftar",
        400
      );
    }

    const movements = await this.db
      .select({ id: inventoryStockMovements.id })
      .from(inventoryStockMovements)
      .where(eq(inventoryStockMovements.itemId, id))
      .limit(1);

    if (movements && movements.length > 0) {
      throw new CatalogDomainError(
        "Barang tidak dapat dihapus karena memiliki riwayat mutasi persediaan",
        400
      );
    }

    await this.db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return { id };
  }
}
