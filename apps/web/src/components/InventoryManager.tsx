import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Layers,
  Tag,
  Filter,
  CheckCircle2,
  MapPin,
  QrCode,
  Wrench,
  AlertTriangle,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Location {
  id: string;
  code: string;
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

interface AssetUnit {
  id: string;
  itemId: string;
  itemName?: string;
  itemCode?: string;
  assetTag: string;
  serialNumber?: string;
  locationId: string;
  locationName?: string;
  locationCode?: string;
  status: "available" | "loaned" | "maintenance" | "disposed";
  condition: "good" | "light_damage" | "heavy_damage" | "lost";
  notes?: string;
  createdAt: string;
}

export function InventoryManager() {
  const [activeTab, setActiveTab] = useState<"catalog" | "assets">("catalog");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetUnits, setAssetUnits] = useState<AssetUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "fixed_asset" | "consumable">("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [selectedUnitForLabel, setSelectedUnitForLabel] = useState<AssetUnit | null>(null);

  // Form Item state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"fixed_asset" | "consumable">("fixed_asset");
  const [unit, setUnit] = useState("unit");
  const [minStockAlert, setMinStockAlert] = useState(0);
  const [description, setDescription] = useState("");

  // Form Asset Unit state
  const [selectedItemId, setSelectedItemId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [condition, setCondition] = useState<"good" | "light_damage" | "heavy_damage" | "lost">("good");
  const [unitNotes, setUnitNotes] = useState("");

  const loadData = async () => {
    try {
      const [resItems, resCategories, resLocations, resUnits] = await Promise.all([
        fetch("/api/inventory/items"),
        fetch("/api/inventory/categories"),
        fetch("/api/inventory/locations"),
        fetch("/api/inventory/asset-units"),
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
      if (resLocations.ok) {
        const json = await resLocations.json();
        setLocations(json.locations || []);
        if (json.locations?.length > 0 && !selectedLocationId) {
          setSelectedLocationId(json.locations[0].id);
        }
      }
      if (resUnits.ok) {
        const json = await resUnits.json();
        setAssetUnits(json.units || []);
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
        setShowAddItemModal(false);
        setName("");
        setCode("");
        setDescription("");
        loadData();
      }
    } catch {
      // noop
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !selectedLocationId) return;

    try {
      const res = await fetch("/api/inventory/asset-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItemId,
          locationId: selectedLocationId,
          serialNumber: serialNumber || undefined,
          condition,
          notes: unitNotes || undefined,
        }),
      });

      if (res.ok) {
        setShowAddUnitModal(false);
        setSerialNumber("");
        setUnitNotes("");
        loadData();
      }
    } catch {
      // noop
    }
  };

  const fixedAssetItems = items.filter((i) => i.type === "fixed_asset");

  const filteredItems = items.filter((item) => {
    if (activeFilter === "all") return true;
    return item.type === activeFilter;
  });

  const filteredAssetUnits = assetUnits.filter((unit) => {
    if (locationFilter === "all") return true;
    return unit.locationId === locationFilter;
  });

  return (
    <div className="space-y-6" data-ui>
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#b8336a]" /> Sarana & Inventaris Sekolah
          </h2>
          <p className="text-xs text-[#5f6672] mt-0.5">
            Manajemen katalog barang, nomor barcode unit fisik aset, dan ruangan penempatan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "catalog" ? (
            <button
              onClick={() => setShowAddItemModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#b8336a] text-white text-xs font-semibold rounded shadow-xs hover:bg-[#a02b5b] transition"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Barang
            </button>
          ) : (
            <button
              onClick={() => {
                if (fixedAssetItems.length > 0 && !selectedItemId) {
                  setSelectedItemId(fixedAssetItems[0].id);
                }
                setShowAddUnitModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#b8336a] text-white text-xs font-semibold rounded shadow-xs hover:bg-[#a02b5b] transition"
            >
              <Plus className="w-3.5 h-3.5" /> Registrasi Unit Aset
            </button>
          )}
        </div>
      </div>

      {/* Primary Sub-Navigation */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition ${
            activeTab === "catalog"
              ? "bg-[#fdf2f7] text-[#6b1d3e]"
              : "text-[#5f6672] hover:bg-[#f9fafb]"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Katalog Barang
        </button>
        <button
          onClick={() => setActiveTab("assets")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition ${
            activeTab === "assets"
              ? "bg-[#fdf2f7] text-[#6b1d3e]"
              : "text-[#5f6672] hover:bg-[#f9fafb]"
          }`}
        >
          <Tag className="w-3.5 h-3.5" /> Unit Fisik Aset Tetap ({assetUnits.length})
        </button>
      </div>

      {/* Lead Metrics */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5f6672]">Master Katalog Barang</span>
            <Layers className="w-4 h-4 text-[#b8336a]" />
          </div>
          <p className="text-2xl font-bold text-[#111827] mt-2 tabular-nums">
            {items.length}
          </p>
          <p className="text-[11px] text-[#5f6672] mt-1">{categories.length} Kategori terdaftar</p>
        </div>

        <div className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5f6672]">Unit Fisik Terdaftar</span>
            <Tag className="w-4 h-4 text-[#247b50]" />
          </div>
          <p className="text-2xl font-bold text-[#247b50] mt-2 tabular-nums">
            {assetUnits.length}
          </p>
          <p className="text-[11px] text-[#5f6672] mt-1">{locations.length} Ruangan penempatan</p>
        </div>

        <div className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#5f6672]">Kondisi Layak Pakai</span>
            <CheckCircle2 className="w-4 h-4 text-[#b8336a]" />
          </div>
          <p className="text-2xl font-bold text-[#b8336a] mt-2 tabular-nums">
            {assetUnits.filter((u) => u.condition === "good").length}
          </p>
          <p className="text-[11px] text-[#5f6672] mt-1">Siap dipinjam/digunakan</p>
        </div>
      </div>

      {activeTab === "catalog" ? (
        /* Catalog Table View */
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
      ) : (
        /* Asset Units Table View */
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-4 flex items-center justify-between bg-[#fcfcfd]">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#9ca3af]" />
              <span className="text-xs font-semibold text-[#111827]">Lokasi Penempatan:</span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="text-xs p-1.5 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
              >
                <option value="all">Semua Ruangan</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f9fafb] text-[#5f6672] font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Tag Registrasi</th>
                  <th className="px-5 py-3">Nama Aset</th>
                  <th className="px-5 py-3">Serial Pabrik</th>
                  <th className="px-5 py-3">Lokasi Fisik</th>
                  <th className="px-5 py-3">Status Sirkulasi</th>
                  <th className="px-5 py-3">Kondisi Fisik</th>
                  <th className="px-5 py-3 text-right">Label Tag</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#5f6672]">
                      Memuat daftar unit aset...
                    </td>
                  </tr>
                ) : filteredAssetUnits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#5f6672]">
                      Belum ada unit fisik aset yang terdaftar pada lokasi ini.
                    </td>
                  </tr>
                ) : (
                  filteredAssetUnits.map((unit) => (
                    <tr key={unit.id} className="hover:bg-[#fbf7f8] transition">
                      <td className="px-5 py-3.5 text-[11px] font-semibold text-[#111827]">
                        {unit.assetTag}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-[#111827]">
                        {unit.itemName}
                        <p className="text-[11px] text-[#5f6672] mt-0.5">{unit.itemCode}</p>
                      </td>
                      <td className="px-5 py-3.5 text-[#5f6672]">
                        {unit.serialNumber || "-"}
                      </td>
                      <td className="px-5 py-3.5 text-[#111827]">
                        <span className="font-medium">{unit.locationName || "-"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {unit.status === "available" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0fdf4] text-[#166534]">
                            Tersedia
                          </span>
                        ) : unit.status === "loaned" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#eff6ff] text-[#1e40af]">
                            Dipinjam
                          </span>
                        ) : unit.status === "maintenance" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#fffbeb] text-[#92400e]">
                            <Wrench className="w-3 h-3" /> Pemeliharaan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#f3f4f6] text-[#374151]">
                            Dihapuskan
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {unit.condition === "good" ? (
                          <span className="text-[#166534] font-medium">Baik</span>
                        ) : unit.condition === "light_damage" ? (
                          <span className="text-[#b45309] font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Rusak Ringan
                          </span>
                        ) : (
                          <span className="text-[#991b1b] font-medium">Rusak Berat/Hilang</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedUnitForLabel(unit)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-[#f9fafb] hover:bg-[#f3f4f6] text-[#111827] rounded transition font-medium"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#b8336a]" /> Preview Tag
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add Item Master */}
      {showAddItemModal && (
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
                  onClick={() => setShowAddItemModal(false)}
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

      {/* Modal Add Asset Unit */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-[#111827]/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#111827]">Registrasi Unit Fisik Aset</h3>

            <form onSubmit={handleAddUnit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                  Pilih Aset Modal
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                  required
                >
                  <option value="">Pilih Barang...</option>
                  {fixedAssetItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                    Serial Pabrikan
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-88921"
                    className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                    Kondisi Fisik
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as "good" | "light_damage" | "heavy_damage" | "lost")}
                    className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                  >
                    <option value="good">Baik / Prima</option>
                    <option value="light_damage">Rusak Ringan</option>
                    <option value="heavy_damage">Rusak Berat</option>
                    <option value="lost">Hilang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                  Ruangan / Lokasi Penempatan
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                  required
                >
                  <option value="">Pilih Lokasi...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-[#5f6672] mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={unitNotes}
                  onChange={(e) => setUnitNotes(e.target.value)}
                  placeholder="e.g. Terpasang di plafon lab, kabel HDMI include"
                  className="w-full text-xs p-2 rounded bg-[#f9fafb] text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="px-3 py-1.5 text-xs text-[#5f6672] hover:bg-[#f3f4f6] rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-[#b8336a] text-white font-semibold rounded shadow-xs hover:bg-[#a02b5b] transition"
                >
                  Registrasikan Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tag Preview */}
      {selectedUnitForLabel && (
        <div className="fixed inset-0 bg-[#111827]/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4 text-center">
            <h3 className="text-sm font-bold text-[#111827]">Label Tag Aset</h3>

            <div className="p-4 bg-[#f9fafb] rounded border border-[#e5e7eb] inline-block w-full">
              <div className="flex justify-center mb-2">
                <QrCode className="w-16 h-16 text-[#111827]" />
              </div>
              <p className="text-sm font-bold text-[#111827]">{selectedUnitForLabel.assetTag}</p>
              <p className="text-xs font-semibold text-[#b8336a] mt-1">{selectedUnitForLabel.itemName}</p>
              <p className="text-[11px] text-[#5f6672] mt-0.5">
                Lokasi: {selectedUnitForLabel.locationName} ({selectedUnitForLabel.locationCode})
              </p>
              {selectedUnitForLabel.serialNumber && (
                <p className="text-[10px] text-[#9ca3af] mt-1">S/N: {selectedUnitForLabel.serialNumber}</p>
              )}
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUnitForLabel(null)}
                className="px-4 py-1.5 text-xs bg-[#b8336a] text-white font-semibold rounded shadow-xs hover:bg-[#a02b5b] transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
