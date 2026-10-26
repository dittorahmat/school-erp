import React, { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  Check,
  X,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export interface Staff {
  id: string;
  username: string;
  fullName: string;
  role: "teacher" | "admin";
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export function StaffManager() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"teacher" | "admin">("teacher");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStaff = async () => {
    try {
      setError(null);
      const res = await fetch("/api/staff");
      if (res.ok) {
        const json = await res.json();
        setStaffList(json.data || []);
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal memuat data staf");
      }
    } catch {
      setError("Gagal memuat data staf");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const openCreateModal = () => {
    setEditingStaff(null);
    setUsername("");
    setPassword("");
    setFullName("");
    setRole("teacher");
    setEmail("");
    setPhone("");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (staff: Staff) => {
    setEditingStaff(staff);
    setUsername(staff.username);
    setPassword("");
    setFullName(staff.fullName);
    setRole(staff.role);
    setEmail(staff.email || "");
    setPhone(staff.phone || "");
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (editingStaff) {
        // PATCH
        const payload: Record<string, string> = {
          fullName: fullName.trim(),
          role,
        };
        if (email.trim()) payload.email = email.trim();
        else payload.email = "";
        if (phone.trim()) payload.phone = phone.trim();
        else payload.phone = "";
        if (password.trim()) payload.password = password.trim();

        const res = await fetch(`/api/staff/${editingStaff.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error || "Gagal memperbarui data staf");
          return;
        }

        setMessage(`Data staf "${fullName}" berhasil diperbarui`);
        closeModal();
        await loadStaff();
      } else {
        // POST
        const payload = {
          username: username.trim(),
          password: password.trim(),
          fullName: fullName.trim(),
          role,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        };

        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error || "Gagal menambahkan data staf");
          return;
        }

        setMessage(`Staf "${fullName}" berhasil didaftarkan`);
        closeModal();
        await loadStaff();
      }
    } catch {
      setError("Terjadi kesalahan saat memproses data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStaff) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/${deletingStaff.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Gagal menghapus staf");
        return;
      }

      setMessage(`Staf "${deletingStaff.fullName}" berhasil dihapus`);
      setDeletingStaff(null);
      await loadStaff();
    } catch {
      setError("Gagal menghapus staf");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      s.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6" data-ui>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" /> Master Pengguna Guru & Staf
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Daftar akun dan biodata dewan guru serta tenaga pendidik di sistem ERP sekolah
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-3.5 py-2 rounded transition"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Guru & Staf
          </button>
        )}
      </div>

      {message && (
        <div className="p-3 bg-success-soft text-success-ink text-xs rounded flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" /> {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-danger-soft text-danger-ink text-xs rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Filter and stats strip */}
      <div className="p-4 bg-white rounded-lg flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-faint" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama guru, NIP/Username, atau peran..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="text-xs text-muted tabular-nums">
          Menampilkan <strong className="text-ink">{filteredStaff.length}</strong> dari{" "}
          <strong className="text-ink">{staffList.length}</strong> pegawai
        </div>
      </div>

      {/* Table view */}
      {loading ? (
        <div className="p-8 text-center text-xs text-muted">Memuat data staf...</div>
      ) : filteredStaff.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted bg-white rounded-lg">
          {searchQuery ? "Tidak ada staf yang sesuai dengan kata kunci pencarian." : "Belum ada data staf."}
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-ground text-[11px] font-semibold text-muted">
              <tr>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">NIP / Username</th>
                <th className="py-3 px-4">Peran / Jabatan</th>
                <th className="py-3 px-4">Kontak</th>
                {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-ground transition">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-ink">{staff.fullName}</span>
                    <span className="block text-[11px] text-faint tabular-nums">{staff.id}</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums text-ink font-medium">
                    {staff.username}
                  </td>
                  <td className="py-3.5 px-4">
                    {staff.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-accent-soft text-accent-ink">
                        <ShieldCheck className="w-3 h-3" /> Administrator TU
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-subtle text-ink">
                        Guru Pengampu / Wali Kelas
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    <div className="flex flex-col gap-0.5">
                      {staff.email ? (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-faint" /> {staff.email}
                        </span>
                      ) : null}
                      {staff.phone ? (
                        <span className="flex items-center gap-1 text-[11px] tabular-nums">
                          <Phone className="w-3 h-3 text-faint" /> {staff.phone}
                        </span>
                      ) : null}
                      {!staff.email && !staff.phone && (
                        <span className="text-[11px] text-faint">-</span>
                      )}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(staff)}
                          title="Edit Biodata"
                          className="p-1.5 text-faint hover:text-ink hover:bg-subtle rounded transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {user?.id !== staff.id && (
                          <button
                            onClick={() => setDeletingStaff(staff)}
                            title="Hapus Akun"
                            className="p-1.5 text-faint hover:text-danger hover:bg-danger-soft rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Form Tambah / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-1">
              <h4 className="font-semibold text-sm text-ink flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                {editingStaff ? `Edit Guru & Staf: ${editingStaff.fullName}` : "Pendaftaran Guru & Staf Baru"}
              </h4>
              <button
                onClick={closeModal}
                className="p-1 text-faint hover:text-ink rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Nama Lengkap & Gelar <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Misal: Budi Purnomo, S.Pd."
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  NIP / Username Login <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingStaff}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Misal: guru_budi atau 198501012010011001"
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
                />
                {editingStaff && (
                  <p className="text-[11px] text-faint mt-0.5">
                    Username akun tidak dapat diubah setelah dibuat.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Peran Akun <span className="text-danger">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "teacher" | "admin")}
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="teacher">Guru Pengampu / Wali Kelas</option>
                  <option value="admin">Administrator Tata Usaha (TU)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-faint" />
                  {editingStaff ? "Reset Password (Opsional)" : "Password Akun"}{" "}
                  {!editingStaff && <span className="text-danger">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingStaff}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    editingStaff
                      ? "Kosongkan bila tidak ingin mengubah password"
                      : "Minimal 6 karakter"
                  }
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Email Pegawai
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="guru@sekolah.sch.id"
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="081234567891"
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-3 py-1.5 text-xs font-medium text-muted hover:text-ink rounded transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-accent hover:bg-accent-strong text-white text-xs font-medium px-4 py-1.5 rounded transition disabled:opacity-50"
                >
                  {submitting
                    ? "Menyimpan..."
                    : editingStaff
                    ? "Simpan Perubahan"
                    : "Daftarkan Staf"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 bg-ink/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-3">
            <h4 className="font-semibold text-sm text-danger flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> Konfirmasi Hapus Staf
            </h4>
            <p className="text-xs text-ink leading-relaxed">
              Apakah Anda yakin ingin menghapus staf{" "}
              <strong className="text-ink">{deletingStaff.fullName}</strong> ({deletingStaff.username})? Tindakan ini akan menghapus data akun secara permanen.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-medium text-muted hover:text-ink rounded transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-danger hover:bg-danger-ink text-white text-xs font-medium px-3.5 py-1.5 rounded transition disabled:opacity-50"
              >
                {isDeleting ? "Menghapus..." : "Ya, Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
