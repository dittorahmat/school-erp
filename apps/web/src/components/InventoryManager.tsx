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
  RotateCcw,
  ClipboardList,
  Clock,
  Check,
  X,
  FileText,
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

interface Loan {
  id: string;
  unitId: string;
  assetTag?: string;
  itemName?: string;
  borrowerId: string;
  borrowerName?: string;
  loanDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  purpose: string;
  outCondition: string;
  returnCondition?: string;
  status: "pending" | "borrowed" | "returned" | "overdue" | "rejected";
  inspectionNotes?: string;
}

interface StockMovement {
  id: string;
  itemId: string;
  itemName?: string;
  itemCode?: string;
  unit?: string;
  type: "in" | "out" | "adjustment";
  quantity: number;
  balanceAfter: number;
  notes?: string;
  createdAt: string;
}

interface Requisition {
  id: string;
  itemId: string;
  itemName?: string;
  unit?: string;
  requesterId: string;
  requesterName?: string;
  quantity: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export function InventoryManager() {
  const [activeTab, setActiveTab] = useState<"catalog" | "assets" | "loans" | "consumables">("catalog");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [assetUnits, setAssetUnits] = useState<AssetUnit[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeFilter, setActiveFilter] = useState<"all" | "fixed_asset" | "consumable">("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Modals
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [showNewStockModal, setShowNewStockModal] = useState(false);
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);
  const [reqItemId, setReqItemId] = useState("");
  const [reqQty, setReqQty] = useState(1);
  const [reqReason, setReqReason] = useState("");
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState<Loan | null>(null);
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

  // Form Loan state
  const [loanUnitId, setLoanUnitId] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");

  // Form Return state
  const [returnCondition, setReturnCondition] = useState<"good" | "light_damage" | "heavy_damage" | "lost">("good");
  const [inspectionNotes, setInspectionNotes] = useState("");

  // Form Stock Movement state
  const [stockItemId, setStockItemId] = useState("");
  const [stockMvType, setStockMvType] = useState<"in" | "out" | "adjustment">("in");
  const [stockQty, setStockQty] = useState(1);
  const [stockNotes, setStockNotes] = useState("");

  const loadData = async () => {
    try {
      const [resItems, resCategories, resLocations, resUnits, resLoans, resMvs, resReqs] = await Promise.all([
        fetch("/api/inventory/items"),
        fetch("/api/inventory/categories"),
        fetch("/api/inventory/locations"),
        fetch("/api/inventory/asset-units"),
        fetch("/api/inventory/loans"),
        fetch("/api/inventory/stock-movements"),
        fetch("/api/inventory/requisitions"),
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
      if (resLoans.ok) {
        const json = await resLoans.json();
        setLoans(json.loans || []);
      }
      if (resMvs.ok) {
        const json = await resMvs.json();
        setStockMovements(json.movements || []);
      }
      if (resReqs.ok) {
        const json = await resReqs.json();
        setRequisitions(json.requisitions || []);
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

  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanUnitId || !expectedReturnDate || !loanPurpose) return;

    try {
      const res = await fetch("/api/inventory/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          unitId: loanUnitId,
          expectedReturnDate,
          purpose: loanPurpose,
        }),
      });

      if (res.ok) {
        setShowNewLoanModal(false);
        setLoanPurpose("");
        setExpectedReturnDate("");
        loadData();
      }
    } catch {
      // noop
    }
  };

  const handleApproveLoan = async (loanId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/inventory/loans/${loanId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) loadData();
    } catch {
      // noop
    }
  };

  const handleReturnLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showReturnModal) return;

    try {
      const res = await fetch(`/api/inventory/loans/${showReturnModal.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnCondition,
          inspectionNotes: inspectionNotes || undefined,
        }),
      });

      if (res.ok) {
        setShowReturnModal(null);
        setInspectionNotes("");
        loadData();
      }
    } catch {
      // noop
    }
  };

  const handleCreateStockMv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockItemId) return;

    try {
      const res = await fetch("/api/inventory/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: stockItemId,
          type: stockMvType,
          quantity: Number(stockQty),
          notes: stockNotes || undefined,
        }),
      });

      if (res.ok) {
        setShowNewStockModal(false);
        setStockNotes("");
        loadData();
      }
    } catch {
      // noop
    }
  };

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqItemId || reqQty <= 0 || !reqReason.trim()) return;

    setReqSubmitting(true);
    try {
      const res = await fetch("/api/inventory/requisitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: reqItemId,
          quantity: Number(reqQty),
          reason: reqReason.trim(),
        }),
      });

      if (res.ok) {
        setShowRequisitionModal(false);
        setReqQty(1);
        setReqReason("");
        loadData();
      }
    } catch {
      // noop
    } finally {
      setReqSubmitting(false);
    }
  };

    const handleApproveRequisition = async (requisitionId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/inventory/requisitions/${requisitionId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) loadData();
    } catch {
      // noop
    }
  };

  const fixedAssetItems = items.filter((i) => i.type === "fixed_asset");
  const consumableItems = items.filter((i) => i.type === "consumable");
  const availableAssetUnits = assetUnits.filter((u) => u.status === "available");

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
          <h2 className="text-base font-bold text-ink flex items-center gap-2">
            <Package className="w-4 h-4 text-accent" /> Sarana & Inventaris Terpadu
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Manajemen siklus hidup aset tetap, lokasi penempatan, peminjaman barang, dan stok persediaan ATK.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "catalog" && (
            <button
              onClick={() => setShowAddItemModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded shadow-xs hover:bg-accent-strong transition"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Barang
            </button>
          )}
          {activeTab === "assets" && (
            <button
              onClick={() => {
                if (fixedAssetItems.length > 0 && !selectedItemId) {
                  setSelectedItemId(fixedAssetItems[0].id);
                }
                setShowAddUnitModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded shadow-xs hover:bg-accent-strong transition"
            >
              <Plus className="w-3.5 h-3.5" /> Registrasi Unit Aset
            </button>
          )}
          {activeTab === "loans" && (
            <button
              onClick={() => {
                if (availableAssetUnits.length > 0 && !loanUnitId) {
                  setLoanUnitId(availableAssetUnits[0].id);
                }
                setShowNewLoanModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded shadow-xs hover:bg-accent-strong transition"
            >
              <Plus className="w-3.5 h-3.5" /> Ajukan Peminjaman
            </button>
          )}
          {activeTab === "consumables" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (consumableItems.length > 0 && !reqItemId) {
                    setReqItemId(consumableItems[0].id);
                  }
                  setShowRequisitionModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-semibold rounded shadow-xs hover:bg-accent-strong transition"
              >
                <Plus className="w-3.5 h-3.5" /> Ajukan Permintaan ATK
              </button>
              <button
                onClick={() => {
                  if (consumableItems.length > 0 && !stockItemId) {
                    setStockItemId(consumableItems[0].id);
                  }
                  setShowNewStockModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-subtle text-ink text-xs font-semibold rounded shadow-xs hover:bg-ground transition"
              >
                <Plus className="w-3.5 h-3.5" /> Catat Mutasi Persediaan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Sub-Navigation */}
      <div className="flex items-center gap-2 bg-white p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition ${
            activeTab === "catalog"
              ? "bg-accent-soft text-accent-ink"
              : "text-muted hover:bg-ground"
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Katalog Barang
        </button>
        <button
          onClick={() => setActiveTab("assets")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition ${
            activeTab === "assets"
              ? "bg-accent-soft text-accent-ink"
              : "text-muted hover:bg-ground"
          }`}
        >
          <Tag className="w-3.5 h-3.5" /> Unit Fisik ({assetUnits.length})
        </button>
        <button
          onClick={() => setActiveTab("loans")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition ${
            activeTab === "loans"
              ? "bg-accent-soft text-accent-ink"
              : "text-muted hover:bg-ground"
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Sirkulasi Pinjam ({loans.filter((l) => l.status === "borrowed" || l.status === "pending").length})
        </button>
        <button
          onClick={() => setActiveTab("consumables")}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded transition ${
            activeTab === "consumables"
              ? "bg-accent-soft text-accent-ink"
              : "text-muted hover:bg-ground"
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" /> Persediaan ATK ({consumableItems.length})
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Katalog Terdaftar</span>
            <Layers className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-bold text-ink mt-2 tabular-nums">
            {items.length}
          </p>
          <p className="text-[11px] text-muted mt-1">{categories.length} Kategori terdaftar</p>
        </div>

        <div className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Aset Tersedia</span>
            <Tag className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-success mt-2 tabular-nums">
            {assetUnits.filter((u) => u.status === "available").length}
          </p>
          <p className="text-[11px] text-muted mt-1">Siap dipinjam/digunakan</p>
        </div>

        <div className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Sedang Dipinjam</span>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-bold text-accent mt-2 tabular-nums">
            {loans.filter((l) => l.status === "borrowed").length}
          </p>
          <p className="text-[11px] text-muted mt-1">Sirkulasi guru & staf</p>
        </div>

        <div className="bg-white rounded-lg p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Mutasi Persediaan</span>
            <ClipboardList className="w-4 h-4 text-ink" />
          </div>
          <p className="text-2xl font-bold text-ink mt-2 tabular-nums">
            {stockMovements.length}
          </p>
          <p className="text-[11px] text-muted mt-1">Audit log stok & opname</p>
        </div>
      </div>

      {activeTab === "catalog" ? (
        /* Catalog Table View */
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-4 flex items-center justify-between bg-raised">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-faint" />
              <span className="text-xs font-semibold text-ink">Filter Jenis:</span>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                    activeFilter === "all"
                      ? "bg-accent-soft text-accent-ink font-semibold"
                      : "text-muted hover:bg-ground"
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setActiveFilter("fixed_asset")}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                    activeFilter === "fixed_asset"
                      ? "bg-accent-soft text-accent-ink font-semibold"
                      : "text-muted hover:bg-ground"
                  }`}
                >
                  Aset Tetap
                </button>
                <button
                  onClick={() => setActiveFilter("consumable")}
                  className={`px-2.5 py-1 text-xs rounded font-medium transition ${
                    activeFilter === "consumable"
                      ? "bg-accent-soft text-accent-ink font-semibold"
                      : "text-muted hover:bg-ground"
                  }`}
                >
                  Habis Pakai
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ground text-muted font-semibold uppercase tracking-wider text-[11px]">
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
                    <td colSpan={6} className="px-5 py-8 text-center text-muted">
                      Memuat katalog inventaris...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted">
                      Belum ada barang pada katalog inventaris.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-subtle-warm transition">
                      <td className="px-5 py-3.5 text-[11px] font-semibold text-ink">
                        {item.code}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-ink">
                        {item.name}
                        {item.description && (
                          <p className="text-[11px] text-muted mt-0.5">{item.description}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {item.categoryName || "-"}
                      </td>
                      <td className="px-5 py-3.5">
                        {item.type === "fixed_asset" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-success-tint text-success-ink-soft">
                            <CheckCircle2 className="w-3 h-3" /> Aset Tetap
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-accent-soft text-accent-deep">
                            Habis Pakai
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted uppercase">
                        {item.unit}
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-ink">
                        {item.type === "consumable" ? item.minStockAlert : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "assets" ? (
        /* Asset Units Table View */
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-4 flex items-center justify-between bg-raised">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-faint" />
              <span className="text-xs font-semibold text-ink">Lokasi Penempatan:</span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="text-xs p-1.5 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
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
              <thead className="bg-ground text-muted font-semibold uppercase tracking-wider text-[11px]">
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
                    <td colSpan={7} className="px-5 py-8 text-center text-muted">
                      Memuat daftar unit aset...
                    </td>
                  </tr>
                ) : filteredAssetUnits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-muted">
                      Belum ada unit fisik aset yang terdaftar pada lokasi ini.
                    </td>
                  </tr>
                ) : (
                  filteredAssetUnits.map((unit) => (
                    <tr key={unit.id} className="hover:bg-subtle-warm transition">
                      <td className="px-5 py-3.5 text-[11px] font-semibold text-ink">
                        {unit.assetTag}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-ink">
                        {unit.itemName}
                        <p className="text-[11px] text-muted mt-0.5">{unit.itemCode}</p>
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {unit.serialNumber || "-"}
                      </td>
                      <td className="px-5 py-3.5 text-ink">
                        <span className="font-medium">{unit.locationName || "-"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {unit.status === "available" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-success-tint text-success-ink-soft">
                            Tersedia
                          </span>
                        ) : unit.status === "loaned" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-info-soft text-info-ink">
                            Dipinjam
                          </span>
                        ) : unit.status === "maintenance" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-warning-soft text-warning-ink">
                            <Wrench className="w-3 h-3" /> Pemeliharaan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-subtle text-ink-soft">
                            Dihapuskan
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {unit.condition === "good" ? (
                          <span className="text-success-ink-soft font-medium">Baik</span>
                        ) : unit.condition === "light_damage" ? (
                          <span className="text-warning font-medium flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Rusak Ringan
                          </span>
                        ) : (
                          <span className="text-danger-ink-soft font-medium">Rusak Berat/Hilang</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedUnitForLabel(unit)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-ground hover:bg-subtle text-ink rounded transition font-medium"
                        >
                          <QrCode className="w-3.5 h-3.5 text-accent" /> Preview Tag
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "loans" ? (
        /* Loans & Circulation Table View */
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="p-4 flex items-center justify-between bg-raised">
            <span className="text-xs font-semibold text-ink">Riwayat Peminjaman & Serah Terima</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-ground text-muted font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3">Tag Aset</th>
                  <th className="px-5 py-3">Nama Barang</th>
                  <th className="px-5 py-3">Peminjam</th>
                  <th className="px-5 py-3">Keperluan</th>
                  <th className="px-5 py-3">Tgl Estimasi Kembali</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-muted">
                      Belum ada catatan sirkulasi peminjaman aset.
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-subtle-warm transition">
                      <td className="px-5 py-3.5 text-[11px] font-semibold text-ink">
                        {loan.assetTag}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-ink">
                        {loan.itemName}
                      </td>
                      <td className="px-5 py-3.5 text-ink">
                        {loan.borrowerName || "Staff"}
                      </td>
                      <td className="px-5 py-3.5 text-muted">
                        {loan.purpose}
                      </td>
                      <td className="px-5 py-3.5 text-ink">
                        {new Date(loan.expectedReturnDate).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-5 py-3.5">
                        {loan.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-warning-soft text-warning-ink">
                            Menunggu Persetujuan
                          </span>
                        ) : loan.status === "overdue" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-danger-soft text-danger-ink">
                            Terlambat
                          </span>
                        ) : loan.status === "borrowed" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-info-soft text-info-ink">
                            Sedang Dipinjam
                          </span>
                        ) : loan.status === "returned" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-success-tint text-success-ink-soft">
                            Sudah Kembali
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-danger-tint text-danger-ink-soft">
                            Ditolak
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {loan.status === "pending" && (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveLoan(loan.id, "approve")}
                              title="Setujui"
                              className="p-1 bg-success-soft text-success-ink-soft hover:bg-success-chip rounded transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleApproveLoan(loan.id, "reject")}
                              title="Tolak"
                              className="p-1 bg-danger-chip-soft text-danger-ink-soft hover:bg-danger-chip rounded transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {(loan.status === "borrowed" || loan.status === "overdue") && (
                          <button
                            onClick={() => setShowReturnModal(loan)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-accent text-white rounded font-medium shadow-xs hover:bg-accent-strong transition"
                          >
                            <RotateCcw className="w-3 h-3" /> Terima & Cek
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Consumables & Stock Movements View */
        <div className="space-y-6">
          <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-4 flex items-center justify-between bg-raised">
              <span className="text-xs font-semibold text-ink">Kartu Kendali Mutasi Persediaan ATK</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ground text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3">Nama Barang Habis Pakai</th>
                    <th className="px-5 py-3">Jenis Mutasi</th>
                    <th className="px-5 py-3">Jumlah Unit</th>
                    <th className="px-5 py-3">Sisa Saldo Stok</th>
                    <th className="px-5 py-3">Keterangan / Alasan</th>
                    <th className="px-5 py-3">Waktu Pencatatan</th>
                  </tr>
                </thead>
                <tbody>
                  {stockMovements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted">
                        Belum ada riwayat mutasi persediaan ATK.
                      </td>
                    </tr>
                  ) : (
                    stockMovements.map((mv) => (
                      <tr key={mv.id} className="hover:bg-subtle-warm transition">
                        <td className="px-5 py-3.5 font-medium text-ink">
                          {mv.itemName}
                        </td>
                        <td className="px-5 py-3.5">
                          {mv.type === "in" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-success-tint text-success-ink-soft">
                              + Masuk (Restock)
                            </span>
                          ) : mv.type === "out" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-danger-tint text-danger-ink-soft">
                              - Keluar (Requisition)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-accent-soft text-accent-deep">
                              Koreksi / Opname
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums font-semibold text-ink">
                          {mv.quantity} {mv.unit}
                        </td>
                        <td className="px-5 py-3.5 tabular-nums font-bold text-accent">
                          {mv.balanceAfter} {mv.unit}
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {mv.notes || "-"}
                        </td>
                        <td className="px-5 py-3.5 text-muted">
                          {new Date(mv.createdAt).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-lg overflow-hidden">
            <div className="p-4 flex items-center justify-between bg-raised">
              <span className="text-xs font-semibold text-ink">Permintaan Barang Habis Pakai</span>
              <span className="text-[11px] text-muted">
                {requisitions.filter((req) => req.status === "pending").length} menunggu persetujuan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-ground text-muted font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3">Barang</th>
                    <th className="px-5 py-3">Pemohon</th>
                    <th className="px-5 py-3 text-center">Jumlah</th>
                    <th className="px-5 py-3">Alasan</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {requisitions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-muted">
                        Belum ada permintaan barang habis pakai.
                      </td>
                    </tr>
                  ) : (
                    requisitions.map((req) => (
                      <tr key={req.id} className="hover:bg-subtle-warm transition">
                        <td className="px-5 py-3.5 font-medium text-ink">{req.itemName}</td>
                        <td className="px-5 py-3.5 text-ink">{req.requesterName || "Staf"}</td>
                        <td className="px-5 py-3.5 text-center tabular-nums text-ink">
                          {req.quantity} {req.unit}
                        </td>
                        <td className="px-5 py-3.5 text-muted">{req.reason}</td>
                        <td className="px-5 py-3.5">
                          {req.status === "pending" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-warning-soft text-warning-ink">
                              Menunggu
                            </span>
                          ) : req.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-success-tint text-success-ink-soft">
                              Disetujui
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-danger-tint text-danger-ink-soft">
                              Ditolak
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {req.status === "pending" && (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveRequisition(req.id, "approve")}
                                title="Setujui"
                                className="p-1 bg-success-soft text-success-ink-soft hover:bg-success-chip rounded transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleApproveRequisition(req.id, "reject")}
                                title="Tolak"
                                className="p-1 bg-danger-chip-soft text-danger-ink-soft hover:bg-danger-chip rounded transition"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Item Master */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink">Tambah Barang ke Katalog</h3>

            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
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
                  <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                    Kode Barang (SKU)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. ELK-001"
                    className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                    Klasifikasi
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "fixed_asset" | "consumable")}
                    className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="fixed_asset">Aset Tetap</option>
                    <option value="consumable">Habis Pakai (ATK)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Proyektor Epson EB-X500"
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                    Satuan Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="e.g. unit, rim, kotak"
                    className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>
                {type === "consumable" && (
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                      Ambang Min. Stok
                    </label>
                    <input
                      type="number"
                      value={minStockAlert}
                      onChange={(e) => setMinStockAlert(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                      min={0}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Keterangan / Spesifikasi
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Opsional rincian atau spesifikasi singkat..."
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-3 py-1.5 text-xs text-muted hover:bg-subtle rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-accent text-white font-semibold rounded shadow-xs hover:bg-accent-strong transition"
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
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink">Registrasi Unit Fisik Aset</h3>

            <form onSubmit={handleAddUnit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Pilih Aset Modal
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
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
                  <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                    Serial Pabrikan
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="e.g. SN-88921"
                    className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                    Kondisi Fisik
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as "good" | "light_damage" | "heavy_damage" | "lost")}
                    className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="good">Baik / Prima</option>
                    <option value="light_damage">Rusak Ringan</option>
                    <option value="heavy_damage">Rusak Berat</option>
                    <option value="lost">Hilang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Ruangan / Lokasi Penempatan
                </label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
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
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={unitNotes}
                  onChange={(e) => setUnitNotes(e.target.value)}
                  placeholder="e.g. Terpasang di plafon lab, kabel HDMI include"
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="px-3 py-1.5 text-xs text-muted hover:bg-subtle rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-accent text-white font-semibold rounded shadow-xs hover:bg-accent-strong transition"
                >
                  Registrasikan Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal New Loan Request */}
      {showNewLoanModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink">Formulir Peminjaman Aset</h3>

            <form onSubmit={handleCreateLoan} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Pilih Unit Aset Tersedia
                </label>
                <select
                  value={loanUnitId}
                  onChange={(e) => setLoanUnitId(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                >
                  <option value="">Pilih Unit...</option>
                  {availableAssetUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.assetTag} - {u.itemName} ({u.locationName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Estimasi Tanggal Pengembalian
                </label>
                <input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Keperluan / Lokasi Penggunaan
                </label>
                <textarea
                  value={loanPurpose}
                  onChange={(e) => setLoanPurpose(e.target.value)}
                  placeholder="e.g. Presentasi ujian kelas XII di Aula Sekolah"
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent h-16 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewLoanModal(false)}
                  className="px-3 py-1.5 text-xs text-muted hover:bg-subtle rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-accent text-white font-semibold rounded shadow-xs hover:bg-accent-strong transition"
                >
                  Ajukan Peminjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Return Inspection */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink">Inspeksi Serah Terima Pengembalian</h3>
            <p className="text-xs text-muted">
              Unit: <strong className="text-ink">{showReturnModal.assetTag} - {showReturnModal.itemName}</strong>
            </p>

            <form onSubmit={handleReturnLoan} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Kondisi Fisik Saat Kembali
                </label>
                <select
                  value={returnCondition}
                  onChange={(e) => setReturnCondition(e.target.value as "good" | "light_damage" | "heavy_damage" | "lost")}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="good">Baik / Lengkap</option>
                  <option value="light_damage">Rusak Ringan (Lecet/Fungsi Sebagian)</option>
                  <option value="heavy_damage">Rusak Berat (Tidak Berfungsi)</option>
                  <option value="lost">Hilang / Tidak Kembali</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Catatan Hasil Inspeksi
                </label>
                <textarea
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="Catatan verifikator saat serah terima..."
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(null)}
                  className="px-3 py-1.5 text-xs text-muted hover:bg-subtle rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-accent text-white font-semibold rounded shadow-xs hover:bg-accent-strong transition"
                >
                  Konfirmasi Pengembalian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal New Consumable Requisition */}
      {showRequisitionModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink">Formulir Permintaan Barang Habis Pakai (ATK)</h3>

            <form onSubmit={handleCreateRequisition} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Pilih Barang Habis Pakai
                </label>
                <select
                  value={reqItemId}
                  onChange={(e) => setReqItemId(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                >
                  <option value="">Pilih Barang...</option>
                  {consumableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Jumlah yang Diajukan
                </label>
                <input
                  type="number"
                  value={reqQty}
                  onChange={(e) => setReqQty(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Alasan / Kebutuhan
                </label>
                <textarea
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="e.g. Kebutuhan papan tulis kelas X-MIPA-1"
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent h-16 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequisitionModal(false)}
                  className="px-3 py-1.5 text-xs text-muted hover:bg-subtle rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={reqSubmitting}
                  className="px-3 py-1.5 text-xs bg-accent text-white font-semibold rounded shadow-xs hover:bg-accent-strong transition disabled:opacity-50"
                >
                  {reqSubmitting ? "Mengajukan..." : "Kirim Permintaan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal New Stock Movement */}
      {showNewStockModal && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-ink">Catat Mutasi Persediaan ATK</h3>

            <form onSubmit={handleCreateStockMv} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Barang Habis Pakai
                </label>
                <select
                  value={stockItemId}
                  onChange={(e) => setStockItemId(e.target.value)}
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  required
                >
                  <option value="">Pilih Barang...</option>
                  {consumableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                    Jenis Mutasi
                  </label>
                  <select
                    value={stockMvType}
                    onChange={(e) => setStockMvType(e.target.value as "in" | "out" | "adjustment")}
                    className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="in">Barang Masuk (Restock)</option>
                    <option value="out">Barang Keluar (Pakai)</option>
                    <option value="adjustment">Koreksi / Opname Fisik</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                    Jumlah ({stockMvType === "adjustment" ? "Saldo Riil" : "Qty"})
                  </label>
                  <input
                    type="number"
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-muted mb-1">
                  Keterangan / Alasan
                </label>
                <input
                  type="text"
                  value={stockNotes}
                  onChange={(e) => setStockNotes(e.target.value)}
                  placeholder="e.g. Pembelian batch kantor TU atau alokasi ujian"
                  className="w-full text-xs p-2 rounded bg-ground text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewStockModal(false)}
                  className="px-3 py-1.5 text-xs text-muted hover:bg-subtle rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs bg-accent text-white font-semibold rounded shadow-xs hover:bg-accent-strong transition"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tag Preview */}
      {selectedUnitForLabel && (
        <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 space-y-4 text-center">
            <h3 className="text-sm font-bold text-ink">Label Tag Aset</h3>

            <div className="p-4 bg-ground rounded border border-border inline-block w-full">
              <div className="flex justify-center mb-2">
                <QrCode className="w-16 h-16 text-ink" />
              </div>
              <p className="text-sm font-bold text-ink">{selectedUnitForLabel.assetTag}</p>
              <p className="text-xs font-semibold text-accent mt-1">{selectedUnitForLabel.itemName}</p>
              <p className="text-[11px] text-muted mt-0.5">
                Lokasi: {selectedUnitForLabel.locationName} ({selectedUnitForLabel.locationCode})
              </p>
              {selectedUnitForLabel.serialNumber && (
                <p className="text-[10px] text-faint mt-1">S/N: {selectedUnitForLabel.serialNumber}</p>
              )}
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUnitForLabel(null)}
                className="px-4 py-1.5 text-xs bg-accent text-white font-semibold rounded shadow-xs hover:bg-accent-strong transition"
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
