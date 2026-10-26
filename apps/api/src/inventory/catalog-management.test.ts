import { describe, expect, it } from "vitest";
import { app } from "../index";
import { signJwt } from "../auth/crypto";
import { createFakeD1 } from "../testing/fake-d1";

const SECRET = "inventory-catalog-test-secret";

async function tokenFor(role: string, username = `${role}_test`, sub = `usr_${role}_test`) {
  return signJwt(
    {
      sub,
      username,
      fullName: `Test ${role}`,
      role,
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    SECRET
  );
}

function envWith(db: D1Database) {
  return {
    DB: db,
    STORAGE: undefined,
    JWT_SECRET: SECRET,
    ENVIRONMENT: "test",
  };
}

describe("Inventory Catalog, Asset Units, Categories, & Locations Management API", () => {
  describe("PATCH & DELETE /api/inventory/categories/:id", () => {
    it("updates category name and description for admin", async () => {
      const existingCategory = {
        id: "cat_1",
        name: "Elektronik Lama",
        description: "Deskripsi lama",
        createdAt: new Date(),
      };
      let updated = false;

      const db = createFakeD1((sql) => {
        if (/from "inventory_categories"/i.test(sql) && /where/i.test(sql)) {
          // Check existing or duplicate
          if (/where.*"id" = \?/i.test(sql)) {
            return [existingCategory];
          }
          if (/where.*"name" = \?/i.test(sql)) {
            return []; // no duplicate
          }
        }
        if (/update "inventory_categories"/i.test(sql)) {
          updated = true;
          return [];
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/categories/cat_1",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: "Elektronik Baru",
            description: "Deskripsi baru",
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { message: string; category: { name: string; description: string } };
      expect(body.message).toContain("berhasil diperbarui");
      expect(body.category.name).toBe("Elektronik Baru");
      expect(body.category.description).toBe("Deskripsi baru");
      expect(updated).toBe(true);
    });

    it("rejects category update if new name duplicates another category", async () => {
      const existingCategory = {
        id: "cat_1",
        name: "Elektronik Lama",
        description: "Deskripsi lama",
        createdAt: new Date(),
      };

      const db = createFakeD1((sql) => {
        if (/from "inventory_categories"/i.test(sql)) {
          if (/where.*"id" = \?/i.test(sql)) {
            return [existingCategory];
          }
          if (/where.*"name" = \?/i.test(sql)) {
            return [{ id: "cat_2" }]; // duplicate exists!
          }
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/categories/cat_1",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: "ATK Terpakai" }),
        },
        envWith(db)
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("Nama kategori sudah digunakan");
    });

    it("prevents deleting category if items still reference it", async () => {
      const db = createFakeD1((sql) => {
        if (/from "inventory_categories"/i.test(sql)) {
          return [{ id: "cat_1", name: "Elektronik" }];
        }
        if (/from "inventory_items"/i.test(sql)) {
          return [{ id: "itm_1" }]; // referenced!
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/categories/cat_1",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
        envWith(db)
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("masih digunakan oleh barang inventaris");
    });

    it("successfully deletes category if no items reference it", async () => {
      const executedSqls: string[] = [];
      const db = createFakeD1((sql) => {
        executedSqls.push(sql);
        if (/from "inventory_categories"/i.test(sql)) {
          return [{ id: "cat_empty", name: "Kategori Kosong", description: null, createdAt: new Date() }];
        }
        if (/from "inventory_items"/i.test(sql)) {
          return [];
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/categories/cat_empty",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
        envWith(db)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { message: string };
      expect(body.message).toContain("berhasil dihapus");
      expect(executedSqls.some((sql) => /delete from "inventory_categories"/i.test(sql))).toBe(true);
    });
  });

  describe("PATCH & DELETE /api/inventory/locations/:id", () => {
    it("updates location code, name, and description", async () => {
      const existingLocation = {
        id: "loc_1",
        code: "LOC-OLD",
        name: "Lab Lama",
        description: "Gedung A",
        createdAt: new Date(),
      };
      let updated = false;

      const db = createFakeD1((sql) => {
        if (/from "inventory_locations"/i.test(sql)) {
          if (/where.*"id" = \?/i.test(sql)) {
            return [existingLocation];
          }
          return [];
        }
        if (/update "inventory_locations"/i.test(sql)) {
          updated = true;
          return [];
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/locations/loc_1",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: "LOC-NEW",
            name: "Lab Baru",
            description: "Gedung B",
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { message: string; location: { code: string; name: string } };
      expect(body.message).toContain("berhasil diperbarui");
      expect(body.location.code).toBe("LOC-NEW");
      expect(body.location.name).toBe("Lab Baru");
      expect(updated).toBe(true);
    });

    it("prevents deleting location if asset units are placed there", async () => {
      const db = createFakeD1((sql) => {
        if (/from "inventory_locations"/i.test(sql)) {
          return [{ id: "loc_1", code: "LOC-1", name: "Lab 1" }];
        }
        if (/from "inventory_asset_units"/i.test(sql)) {
          return [{ id: "ast_1" }]; // units exist
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/locations/loc_1",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
        envWith(db)
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("masih ada unit aset di lokasi ini");
    });

    it("successfully deletes empty location", async () => {
      const executedSqls: string[] = [];
      const db = createFakeD1((sql) => {
        executedSqls.push(sql);
        if (/from "inventory_locations"/i.test(sql)) {
          return [{ id: "loc_empty", code: "LOC-EMP", name: "Gudang Kosong", description: null, createdAt: new Date() }];
        }
        if (/from "inventory_asset_units"/i.test(sql)) {
          return [];
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/locations/loc_empty",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
        envWith(db)
      );

      expect(res.status).toBe(200);
      expect(executedSqls.some((sql) => /delete from "inventory_locations"/i.test(sql))).toBe(true);
    });
  });

  describe("PATCH & DELETE /api/inventory/items/:id", () => {
    it("updates item attributes and validates unique code", async () => {
      const existingItem = {
        id: "itm_1",
        code: "BRG-001",
        name: "Proyektor Lama",
        categoryId: "cat_1",
        type: "fixed_asset",
        unit: "unit",
        minStockAlert: 0,
        description: "Lama",
        createdAt: new Date(),
      };
      let updated = false;

      const db = createFakeD1((sql) => {
        if (/from "inventory_items"/i.test(sql)) {
          if (/where.*"id" = \?/i.test(sql)) {
            return [existingItem];
          }
          if (/where.*"code" = \?/i.test(sql)) {
            return []; // no duplicate code
          }
        }
        if (/from "inventory_categories"/i.test(sql)) {
          return [{ id: "cat_2" }]; // category exists
        }
        if (/update "inventory_items"/i.test(sql)) {
          updated = true;
          return [];
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/items/itm_1",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: "BRG-001-MOD",
            name: "Proyektor Baru",
            categoryId: "cat_2",
            minStockAlert: 2,
            description: "Diperbarui",
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { message: string; item: { code: string; name: string } };
      expect(body.message).toContain("berhasil diperbarui");
      expect(body.item.code).toBe("BRG-001-MOD");
      expect(body.item.name).toBe("Proyektor Baru");
      expect(updated).toBe(true);
    });

    it("rejects item update when code duplicates another item", async () => {
      const existingItem = {
        id: "itm_1",
        code: "BRG-001",
        name: "Barang 1",
        categoryId: "cat_1",
        createdAt: new Date(),
      };

      const db = createFakeD1((sql) => {
        if (/from "inventory_items"/i.test(sql)) {
          if (/where.*"id" = \?/i.test(sql)) {
            return [existingItem];
          }
          if (/where.*"code" = \?/i.test(sql)) {
            return [{ id: "itm_2" }]; // duplicate!
          }
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/items/itm_1",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code: "BRG-DUPLICATE" }),
        },
        envWith(db)
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("Kode barang sudah digunakan");
    });

    it("prevents deleting item if asset units are linked to it", async () => {
      const db = createFakeD1((sql) => {
        if (/from "inventory_items"/i.test(sql)) {
          return [{ id: "itm_1", code: "BRG-1" }];
        }
        if (/from "inventory_asset_units"/i.test(sql)) {
          return [{ id: "ast_unit_1" }]; // asset unit linked
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/items/itm_1",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
        envWith(db)
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("masih memiliki unit fisik aset terdaftar");
    });

    it("prevents deleting item if stock movements are linked to it", async () => {
      const db = createFakeD1((sql) => {
        if (/from "inventory_items"/i.test(sql)) {
          return [{ id: "itm_atk", code: "BRG-ATK" }];
        }
        if (/from "inventory_asset_units"/i.test(sql)) {
          return [];
        }
        if (/from "inventory_stock_movements"/i.test(sql)) {
          return [{ id: "sm_1" }]; // stock movements exist
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/items/itm_atk",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
        envWith(db)
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("memiliki riwayat mutasi persediaan");
    });

    it("successfully deletes item when no units or movements exist", async () => {
      const executedSqls: string[] = [];
      const db = createFakeD1((sql) => {
        executedSqls.push(sql);
        if (/from "inventory_items"/i.test(sql)) {
          return [{
            id: "itm_unused",
            code: "BRG-UNUSED",
            categoryId: "cat_1",
            name: "Barang Unused",
            type: "fixed_asset",
            unit: "unit",
            minStockAlert: 0,
            description: null,
            createdAt: new Date(),
          }];
        }
        if (/from "inventory_asset_units"/i.test(sql)) return [];
        if (/from "inventory_stock_movements"/i.test(sql)) return [];
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/items/itm_unused",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
        envWith(db)
      );

      expect(res.status).toBe(200);
      expect(executedSqls.some((sql) => /delete from "inventory_items"/i.test(sql))).toBe(true);
    });
  });

  describe("PATCH & DELETE /api/inventory/asset-units/:id", () => {
    it("updates locationId, status, condition, serialNumber, and notes", async () => {
      const existingUnit = {
        id: "ast_1",
        itemId: "itm_1",
        assetTag: "AST/2026/001",
        serialNumber: "SN-OLD",
        locationId: "loc_1",
        status: "available",
        condition: "good",
        notes: "Lama",
        createdAt: new Date(),
      };
      let updated = false;

      const db = createFakeD1((sql) => {
        if (/from "inventory_asset_units"/i.test(sql)) {
          return [existingUnit];
        }
        if (/from "inventory_locations"/i.test(sql)) {
          return [{ id: "loc_2" }]; // target location exists
        }
        if (/update "inventory_asset_units"/i.test(sql)) {
          updated = true;
          return [];
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/asset-units/ast_1",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locationId: "loc_2",
            status: "maintenance",
            condition: "light_damage",
            serialNumber: "SN-NEW",
            notes: "Perlu ganti kabel",
          }),
        },
        envWith(db)
      );

      expect(res.status).toBe(200);
      const body = (await res.json()) as { message: string; unit: { status: string; condition: string } };
      expect(body.message).toContain("berhasil diperbarui");
      expect(body.unit.status).toBe("maintenance");
      expect(body.unit.condition).toBe("light_damage");
      expect(updated).toBe(true);
    });

    it("prevents deleting asset unit when status is loaned", async () => {
      const db = createFakeD1((sql) => {
        if (/from "inventory_asset_units"/i.test(sql)) {
          return [
            {
              id: "ast_loaned",
              itemId: "itm_1",
              assetTag: "AST/2026/001",
              serialNumber: null,
              locationId: "loc_1",
              status: "loaned",
              condition: "good",
              notes: null,
              createdAt: new Date(),
            },
          ];
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/asset-units/ast_loaned",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
        envWith(db)
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(body.error).toContain("saat ini sedang dipinjam");
    });

    it("successfully deletes asset unit when status is available or maintenance", async () => {
      const executedSqls: string[] = [];
      const db = createFakeD1((sql) => {
        executedSqls.push(sql);
        if (/from "inventory_asset_units"/i.test(sql)) {
          return [
            {
              id: "ast_avail",
              itemId: "itm_1",
              assetTag: "AST/2026/002",
              serialNumber: null,
              locationId: "loc_1",
              status: "available",
              condition: "good",
              notes: null,
              createdAt: new Date(),
            },
          ];
        }
        return [];
      });

      const token = await tokenFor("admin");
      const res = await app.request(
        "/api/inventory/asset-units/ast_avail",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
        envWith(db)
      );

      expect(res.status).toBe(200);
      expect(executedSqls.some((sql) => /delete from "inventory_asset_units"/i.test(sql))).toBe(true);
    });
  });
});
