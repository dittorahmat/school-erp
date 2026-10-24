import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./components/LoginPage";
import { AcademicManager } from "./components/AcademicManager";
import { AttendanceChecklist } from "./components/AttendanceChecklist";
import { FinanceManager } from "./components/FinanceManager";
import { GradebookManager } from "./components/GradebookManager";
import { ParentPortal } from "./components/ParentPortal";
import { InventoryManager } from "./components/InventoryManager";
import {
  GraduationCap,
  BookOpen,
  CreditCard,
  LogOut,
  CalendarCheck,
  Award,
  Users,
  LayoutDashboard,
  Search,
  Package,
} from "lucide-react";

const formatShortDate = (value?: string | null) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value}T00:00:00+07:00`));
};

const todayLabel = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
}).format(new Date());

interface ActiveYear {
  name: string;
  semester: "odd" | "even";
  startDate: string | null;
  endDate: string | null;
}

function MainDashboard() {
  const { user, logout } = useAuth();
  const [activeYear, setActiveYear] = useState<ActiveYear | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "academic" | "attendance" | "finance" | "gradebook" | "parent" | "inventory"
  >("overview");

  useEffect(() => {
    fetch("/api/academic/years?active=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) setActiveYear(json.data);
      })
      .catch(() => undefined);
  }, []);

  const navItems = [
    { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
    { id: "academic", label: "Struktur Akademik", icon: BookOpen },
    { id: "attendance", label: "Presensi Siswa", icon: CalendarCheck },
    { id: "finance", label: "Keuangan & SPP", icon: CreditCard },
    { id: "gradebook", label: "Buku Nilai & Rapor", icon: Award },
    { id: "parent", label: "Portal Orang Tua", icon: Users },
    { id: "inventory", label: "Katalog Inventaris", icon: Package },
  ] as const;

  return (
    <div className="min-h-dvh bg-[#f9fafb] flex" data-ui>
      {/* 230px Ruled Sidebar */}
      <aside className="w-[230px] shrink-0 bg-white flex flex-col justify-between shadow-xs">
        <div>
          {/* Brand Wordmark */}
          <div className="h-16 px-5 flex items-center gap-2.5">
            <GraduationCap className="w-5 h-5 text-[#b8336a]" />
            <span className="font-semibold text-sm tracking-tight text-[#111827]">
              School ERP
            </span>
          </div>

          {/* Navigation Items (34px pitch, DM Sans) */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-[#9ca3af]">
              Menu Utama
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition ${
                    isActive
                      ? "bg-[#fdf2f7] text-[#6b1d3e] font-semibold"
                      : "text-[#4b5563] hover:bg-[#f9fafb] hover:text-[#111827]"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[#b8336a]" : "text-[#9ca3af]"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* User Status in Sidebar Footer */}
        <div className="p-4 bg-[#fbf7f8]">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#111827] truncate">
                {user?.fullName}
              </p>
              <p className="text-[11px] text-[#6b7280] uppercase tracking-wider">
                {user?.role}
              </p>
            </div>
            <button
              onClick={() => logout()}
              title="Keluar"
              className="p-1.5 text-[#9ca3af] hover:text-[#c4242a] hover:bg-[#ffedea] rounded transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 64px Top Bar */}
        <header className="h-16 px-8 bg-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold text-[#111827]">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
            <span className="text-xs text-[#9ca3af]">&bull;</span>
            <span className="text-xs text-[#6b7280]">
              {activeYear
                ? `Tahun Ajaran ${activeYear.name} · Semester ${
                    activeYear.semester === "odd" ? "Ganjil" : "Genap"
                  }${
                    activeYear.startDate && activeYear.endDate
                      ? ` · ${formatShortDate(activeYear.startDate)} - ${formatShortDate(activeYear.endDate)}`
                      : ""
                  }`
                : "Memuat tahun ajaran..."}
            </span>
            <span className="text-xs text-[#9ca3af]">&bull;</span>
            <span className="text-xs text-[#6b7280]">{todayLabel}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9ca3af]" />
              <input
                type="text"
                placeholder="Cari siswa, kelas, NISN..."
                className="pl-8 pr-3 py-1.5 text-xs bg-[#f9fafb] rounded-md text-[#111827] focus:outline-none focus:ring-1 focus:ring-[#b8336a] w-56"
              />
            </div>
            <span className="text-[11px] font-medium text-[#247b50] bg-[#dcfce7] px-2.5 py-1 rounded">
              Cloudflare Edge
            </span>
          </div>
        </header>

        {/* Workspace Canvas (24px padding & gap) */}
        <main className="p-8 flex-1 max-w-7xl w-full mx-auto">
          {activeTab === "overview" ? (
            <div className="space-y-6">
              {/* Lead Metric Strip */}
              <div className="bg-white rounded-lg p-6 grid grid-cols-4 gap-6 shadow-xs">
                <div>
                  <span className="text-xs text-[#5f6672]">Total Siswa Aktif</span>
                  <p className="text-2xl font-bold text-[#111827] mt-1 tabular-nums">
                    480
                  </p>
                  <p className="text-[11px] text-[#5f6672] mt-0.5">15 Rombongan Belajar</p>
                </div>
                <div>
                  <span className="text-xs text-[#5f6672]">Presensi Hari Ini</span>
                  <p className="text-2xl font-bold text-[#247b50] mt-1 tabular-nums">
                    96.4%
                  </p>
                  <p className="text-[11px] text-[#5f6672] mt-0.5">463 dari 480 hadir</p>
                </div>
                <div>
                  <span className="text-xs text-[#5f6672]">Kolektibilitas SPP</span>
                  <p className="text-2xl font-bold text-[#111827] mt-1 tabular-nums">
                    84.2%
                  </p>
                  <p className="text-[11px] text-[#5f6672] mt-0.5">Periode Oktober 2026</p>
                </div>
                <div>
                  <span className="text-xs text-[#5f6672]">Verifikasi Tertunda</span>
                  <p className="text-2xl font-bold text-[#b8336a] mt-1 tabular-nums">
                    8
                  </p>
                  <p className="text-[11px] text-[#5f6672] mt-0.5">Bukti transfer di R2</p>
                </div>
              </div>

              {/* Sub-cards */}
              <div className="grid grid-cols-3 gap-6">
                <div
                  onClick={() => setActiveTab("academic")}
                  className="p-6 bg-white rounded-lg hover:bg-[#fbf7f8] transition cursor-pointer"
                >
                  <BookOpen className="w-5 h-5 text-[#b8336a] mb-2.5" />
                  <h3 className="font-semibold text-sm text-[#111827]">
                    Struktur Akademik
                  </h3>
                  <p className="text-xs text-[#5f6672] mt-1 leading-relaxed">
                    Konfigurasi tahun ajaran, kurikulum mata pelajaran, dan penempatan riwayat kelas siswa.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("attendance")}
                  className="p-6 bg-white rounded-lg hover:bg-[#fbf7f8] transition cursor-pointer"
                >
                  <CalendarCheck className="w-5 h-5 text-[#b8336a] mb-2.5" />
                  <h3 className="font-semibold text-sm text-[#111827]">
                    Presensi & Kehadiran
                  </h3>
                  <p className="text-xs text-[#5f6672] mt-1 leading-relaxed">
                    Pencatatan cepat presensi harian per jam pelajaran oleh wali kelas dan guru pengampu.
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("inventory")}
                  className="p-6 bg-white rounded-lg hover:bg-[#fbf7f8] transition cursor-pointer"
                >
                  <Package className="w-5 h-5 text-[#b8336a] mb-2.5" />
                  <h3 className="font-semibold text-sm text-[#111827]">
                    Katalog Sarana & Inventaris
                  </h3>
                  <p className="text-xs text-[#5f6672] mt-1 leading-relaxed">
                    Pencatatan master barang inventaris sekolah, pemilahan aset tetap dan barang habis pakai.
                  </p>
                </div>
              </div>
            </div>
          ) : activeTab === "academic" ? (
            <AcademicManager />
          ) : activeTab === "attendance" ? (
            <AttendanceChecklist />
          ) : activeTab === "finance" ? (
            <FinanceManager />
          ) : activeTab === "gradebook" ? (
            <GradebookManager />
          ) : activeTab === "inventory" ? (
            <InventoryManager />
          ) : (
            <ParentPortal />
          )}
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#f9fafb]">
        <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-[#b8336a]"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <MainDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
