import { describe, expect, it } from "vitest";
import { ItemCatalog, CatalogDomainError } from "./catalog";

class InMemoryCatalogAdapter {
  items: any[] = [];
  categories: any[] = [];
  assetUnits: any[] = [];
  stockMovements: any[] = [];

  select(fields?: any) {
    const self = this;
    return {
      from(table: any) {
        return {
          where(clause: any) {
            return {
              async limit(n: number) {
                const tableName = table?.[Symbol.for("drizzle:Name")] || "";
                if (tableName.includes("inventory_items")) return self.items.slice(0, n);
                if (tableName.includes("inventory_categories")) return self.categories.slice(0, n);
                if (tableName.includes("inventory_asset_units")) return self.assetUnits.slice(0, n);
                if (tableName.includes("inventory_stock_movements")) return self.stockMovements.slice(0, n);
                return [];
              },
            };
          },
        };
      },
    };
  }

  insert(table: any) {
    const self = this;
    return {
      async values(val: any) {
        self.items.push(val);
        return val;
      },
    };
  }

  update(table: any) {
    const self = this;
    return {
      set(val: any) {
        return {
          async where(clause: any) {
            for (const item of self.items) {
              Object.assign(item, val);
            }
            return self.items;
          },
        };
      },
    };
  }

  delete(table: any) {
    const self = this;
    return {
      async where(clause: any) {
        self.items = [];
        return [];
      },
    };
  }
}

describe("ItemCatalog Domain Module (Unit Tests)", () => {
  it("registers a new catalog item", async () => {
    const adapter = new InMemoryCatalogAdapter();
    const catalog = new ItemCatalog(adapter as any);

    const item = await catalog.registerItem({
      categoryId: "cat_1",
      code: "BRG-001",
      name: "Laptop Asus",
      type: "fixed_asset",
      unit: "unit",
      minStockAlert: 2,
    });

    expect(item.code).toBe("BRG-001");
    expect(adapter.items.length).toBe(1);
  });

  it("prevents deletion if physical asset units exist", async () => {
    const adapter = new InMemoryCatalogAdapter();
    adapter.items = [{ id: "itm_1", code: "BRG-001", name: "Laptop" }];
    adapter.assetUnits = [{ id: "unt_1", itemId: "itm_1" }];

    const catalog = new ItemCatalog(adapter as any);
    await expect(catalog.deleteItem("itm_1")).rejects.toThrow(
      "Barang tidak dapat dihapus karena masih memiliki unit fisik aset terdaftar"
    );
  });

  it("prevents deletion if stock movements exist", async () => {
    const adapter = new InMemoryCatalogAdapter();
    adapter.items = [{ id: "itm_2", code: "ATK-001", name: "Kertas A4" }];
    adapter.stockMovements = [{ id: "mov_1", itemId: "itm_2" }];

    const catalog = new ItemCatalog(adapter as any);
    await expect(catalog.deleteItem("itm_2")).rejects.toThrow(
      "Barang tidak dapat dihapus karena memiliki riwayat mutasi persediaan"
    );
  });

  it("deletes item when clean", async () => {
    const adapter = new InMemoryCatalogAdapter();
    adapter.items = [{ id: "itm_clean", code: "CLEAN", name: "Clean Item" }];

    const catalog = new ItemCatalog(adapter as any);
    const result = await catalog.deleteItem("itm_clean");
    expect(result.id).toBe("itm_clean");
  });
});
