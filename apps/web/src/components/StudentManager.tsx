import React, { useEffect, useState } from "react";
import {
  GraduationCap,
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
  School,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export interface Student {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  currentClassroom: string | null;
}

export function StudentManager() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Modal create/edit state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadStudents = async () => {
    try {
      setError(null);
      const res = await fetch("/api/academic/students");
      if (res.ok) {
        const json = await res.json();
        setStudents(json.data || []);
      } else {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Gagal memuat data siswa");
      }
    } catch {
      setError("Gagal memuat data siswa");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const openCreateModal = () => {
    setEditingStudent(null);
    setUsername("");
    setPassword("");
    setFullName("");
    setEmail("");
    setPhone("");
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setUsername(student.username);
    setPassword("");
    setFullName(student.fullName);
    setEmail(student.email || "");
    setPhone(student.phone || "");
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (editingStudent) {
        // PATCH
        const payload: Record<string, string> = {
          fullName: fullName.trim(),
        };
        if (email.trim()) payload.email = email.trim();
        else payload.email = "";
        if (phone.trim()) payload.phone = phone.trim();
        else payload.phone = "";
        if (password.trim()) payload.password = password.trim();

        const res = await fetch(`/api/academic/students/${editingStudent.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error || "Gagal memperbarui data siswa");
          return;
        }

        setMessage(`Data siswa "${fullName}" berhasil diperbarui`);
        closeModal();
        await loadStudents();
      } else {
        // POST
        const payload = {
          username: username.trim(),
          password: password.trim(),
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        };

        const res = await fetch("/api/academic/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error || "Gagal menambahkan data siswa");
          return;
        }

        setMessage(`Siswa "${fullName}" berhasil didaftarkan`);
        closeModal();
        await loadStudents();
      }
    } catch {
      setError("Terjadi kesalahan saat memproses data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/academic/students/${deletingStudent.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Gagal menghapus siswa");
        return;
      }

      setMessage(`Siswa "${deletingStudent.fullName}" berhasil dihapus`);
      setDeletingStudent(null);
      await loadStudents();
    } catch {
      setError("Gagal menghapus siswa");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.fullName.toLowerCase().includes(q) ||
      s.username.toLowerCase().includes(q) ||
      (s.currentClassroom && s.currentClassroom.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6" data-ui>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-accent" /> Master Pengguna Siswa
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Daftar akun dan biodata siswa yang terdaftar di sistem ERP sekolah
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-3.5 py-2 rounded transition"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Siswa Baru
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
            placeholder="Cari nama siswa, NIS/Username, atau kelas..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div className="text-xs text-muted tabular-nums">
          Menampilkan <strong className="text-ink">{filteredStudents.length}</strong> dari{" "}
          <strong className="text-ink">{students.length}</strong> siswa
        </div>
      </div>

      {/* Table view */}
      {loading ? (
        <div className="p-8 text-center text-xs text-muted">Memuat data siswa...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted bg-white rounded-lg">
          {searchQuery ? "Tidak ada siswa yang sesuai dengan kata kunci pencarian." : "Belum ada data siswa."}
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-ground text-[11px] font-semibold text-muted">
              <tr>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">NIS / Username</th>
                <th className="py-3 px-4">Rombel Aktif</th>
                <th className="py-3 px-4">Kontak</th>
                {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-ground transition">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-ink">{student.fullName}</span>
                    <span className="block text-[11px] text-faint tabular-nums">{student.id}</span>
                  </td>
                  <td className="py-3.5 px-4 tabular-nums text-ink font-medium">
                    {student.username}
                  </td>
                  <td className="py-3.5 px-4">
                    {student.currentClassroom ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-accent-soft text-accent-ink">
                        <School className="w-3 h-3" /> {student.currentClassroom}
                      </span>
                    ) : (
                      <span className="text-[11px] text-faint">Belum ditempatkan</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-muted">
                    <div className="flex flex-col gap-0.5">
                      {student.email ? (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-faint" /> {student.email}
                        </span>
                      ) : null}
                      {student.phone ? (
                        <span className="flex items-center gap-1 text-[11px] tabular-nums">
                          <Phone className="w-3 h-3 text-faint" /> {student.phone}
                        </span>
                      ) : null}
                      {!student.email && !student.phone && (
                        <span className="text-[11px] text-faint">-</span>
                      )}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(student)}
                          title="Edit Biodata"
                          className="p-1.5 text-faint hover:text-ink hover:bg-subtle rounded transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(student)}
                          title="Hapus Akun"
                          className="p-1.5 text-faint hover:text-danger hover:bg-danger-soft rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                <GraduationCap className="w-4 h-4 text-accent" />
                {editingStudent ? `Edit Siswa: ${editingStudent.fullName}` : "Pendaftaran Siswa Baru"}
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
                  Nama Lengkap Siswa <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Misal: Ahmad Dahlan"
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  NIS / Username Login <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingStudent}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Misal: siswa_ahmad atau 20261001"
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
                />
                {editingStudent && (
                  <p className="text-[11px] text-faint mt-0.5">
                    Username akun tidak dapat diubah setelah dibuat.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-faint" />
                  {editingStudent ? "Reset Password (Opsional)" : "Password Akun"}{" "}
                  {!editingStudent && <span className="text-danger">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingStudent}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    editingStudent
                      ? "Kosongkan bila tidak ingin mengubah password"
                      : "Minimal 6 karakter"
                  }
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Email Siswa
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="siswa@student.sekolah.sch.id"
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
                  placeholder="081234567890"
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
                    : editingStudent
                    ? "Simpan Perubahan"
                    : "Daftarkan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-ink/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-3">
            <h4 className="font-semibold text-sm text-danger flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> Konfirmasi Hapus Siswa
            </h4>
            <p className="text-xs text-ink leading-relaxed">
              Apakah Anda yakin ingin menghapus siswa{" "}
              <strong className="text-ink">{deletingStudent.fullName}</strong> ({deletingStudent.username})? Tindakan ini akan menghapus data akun siswa secara permanen.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
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
