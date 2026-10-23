import React, { useState, useEffect } from "react";
import { Package, Plus, Layers, Tag, Filter, CheckCircle2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface InventoryItem {
  id: string;
  categoryId: string;
  categoryName?: string;
  code: string;
  name: string;
  type: "fixed_asset" | "consumable";
  unit: string;
  minStockAlert: number;
  description?: string;
}

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "fixed_asset" | "consumable">("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"fixed_asset" | "consumable">("fixed_asset");
  const [unit, setUnit] = useState("unit");
  const [minStockAlert, setMinStockAlert] = useState(0);
  const [description, setDescription] = useState("");

  const loadData = async () => {
    try {
      const [resItems, resCategories] = await Promise.all([
        fetch("/api/inventory/items"),
        fetch("/api/inventory/categories"),
      ]);

      if (resItems.ok) {
        const json = await resItems.json();
        setItems(json.items || []);
      }
      if (resCategories.ok) {
        const json = await resCategories.json();
        setCategories(json.categories || []);
        if (json.categories?.length > 0 && !categoryId) {
          setCategoryId(json.categories[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !categoryId) return;

    try {
      const res = await fetch("/api/inventory/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          categoryId,
          type,
          unit,
          minStockAlert: Number(minStockAlert),
          description: description || undefined,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName("");
        setCode("");
        setDescription("");
        loadData();
      }
    } catch {
      // noop
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === "all") return true;
    return item.type === activeFilter;
  });

  return (
    <div className="space-y-6" data-ui>
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#b8336a]" /> Katalog Sarana & Persediaan
          </h2>
          <p className="text-xs text-[#5f6672] mt-0.5">
            Pencatatan master data Aset Tetap dan Bahan Habis Pakai (ATK) sekolah.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#b8336a] text-white text-xs font-semibold rounded shadow-xs hover:bg-[#a02b5b] transition"
        >
          <Plus className="w-3.5 h-3.5" /> Tambah Barang
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5f6672]">Total Master Barang</span>
            <Layers className="w-4 h-4 text-[#b8336a]" />
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-2 tabular-nums">
            {items.length}
          </p>
          <p className="text-[11px] text-[#5f6672] mt-1">{categories.length} Kategori terdaftar</p>
        </div>

        <div className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5f6672]">Aset Tetap / Modal</span>
            <Tag className="w-4 h-4 text-[#247b50]" />
          </div>
          <p className="text-2xl font-bold text-[#247b50] mt-2 tabular-nums">
            {items.filter((i) => i.type === "fixed_asset").length}
          </p>
          <p className="text-[11px] text-[#5f6672] mt-1">Dicatat per nomor unit fisik</p>
        </div>

        <div className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5f6672]">Barang Habis Pakai</span>
            <Package className="w-4 h-4 text-[#b8336a]" />
          </div>
          <p className="text-2xl font-bold text-[#b8336a] mt-2 tabular-nums">
            {items.filter((i) => i.type === "consumable").length}
          </p>
          <p className="text-[11px] text-[#5f6672] mt-1">Dicatat berbasis saldo stok agregat</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="p-4 flex items-center justify-between bg-[#fcfcfd]">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#9ca3af]" />
            <span className="text-xs font-semibold text-[#111827]">Filter Jenis:</span>
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                  activeFilter === "all"
                    ? "bg-[#fdf2f7] text-[#6b1d3e] font-semibold"
                    : "text-[#5f6672] hover:bg-[#f9fafb]"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setActiveFilter("fixed_asset")}
                className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                  activeFilter === "fixed_asset"
                    ? "bg-[#fdf2f7] text-[#6b1d3e] font-semibold"
                    : "text-[#5f6672] hover:bg-[#f9fafb]"
                }`}
              >
                Aset Tetap
              </button>
              <button
                onClick={() => setActiveFilter("consumable")}
                className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                  activeFilter === "consumable"
                    ? "bg-[#fdf2f7] text-[#6b1d3e] font-semibold"
                    : "text-[#5f6672] hover:bg-[#f9fafb]"
                }`}
              >
                Habis Pakai
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f9fafb] text-[#5f6672] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3">Kode Barang</th>
                <th className="px-5 py-3">Nama Barang</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3">Klasifikasi</th>
                <th className="px-5 py-3">Satuan</th>
                <th className="px-5 py-3">Ambang Min. Stok</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#5f6672]">
                    Memuat katalog inventaris...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[#5f6672]">
                    Belum ada barang pada katalog inventaris.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fbf7f8] transition">
                    <td className="px-5 py-3.5 text-[11px] font-semibold text-[#111827]">
                      {item.code}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#111827]">
                      {item.name}
                      {item.description && (
                        <p className="text-[11px] text-[#5f6672] mt-0.5">{item.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#5f6672]">
                      {item.categoryName || "-"}
                    </td>
                    <td className="px-5 py-3.5">
                      {item.type === "fixed_asset" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0fdf4] text-[#166534]">
                          <CheckCircle2 className="w-3 h-3" /> Aset Tetap
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#fdf2f8] text-[#831843]">
                          Habis Pakai
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#5f6672] uppercase">
                      {item.unit}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-[#111827]">
                      {item.type === "consumable" ? item.minStockAlert : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Item */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#111827]/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#111827]">Tambah Barang ke Katalog</h3>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                  required
                >
                  <option value="">Pilih Kategori...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                    Kode Barang (SKU)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. ELK-001"
                    className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                    Klasifikasi
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "fixed_asset" | "consumable")}
                    className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                  >
                    <option value="fixed_asset">Aset Tetap</option>
                    <option value="consumable">Habis Pakai (ATK)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Proyektor Epson EB-X500"
                  className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                    Satuan Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. unit, rim, kotak"
                    className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                    required
                  />
                </div>
                {type === "consumable" && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                      Ambang Min. Stok
                    </label>
                    <input
                      type="number"
                      value={minStockAlert}
                      onChange={(e) => setMinStockAlert(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                      min={0}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                  Keterangan / Spesifikasi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opsional rincian atau spesifikasi singkat..."
                  className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a] h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-[#5f6672] hover:bg-[#f3f4f6] rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-[#b8336a] text-white font-semibold rounded shadow-xs hover:bg-[#a02b5b] transition"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
