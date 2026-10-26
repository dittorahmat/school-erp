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
  GraduationCap,
  Link as LinkIcon,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export interface LinkedStudent {
  id: string;
  name: string;
  relationship: string;
}

export interface Guardian {
  id: string;
  username: string;
  fullName: string;
  role: "guardian";
  email: string | null;
  phone: string | null;
  createdAt: string;
  students: LinkedStudent[];
}

export interface StudentOption {
  id: string;
  fullName: string;
  username: string;
}

export function GuardianManager() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Modal create/edit guardian state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);

  // Form fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Manage students modal state
  const [managingGuardian, setManagingGuardian] = useState<Guardian | null>(null);
  const [selectedStudentToLink, setSelectedStudentToLink] = useState("");
  const [linkRelationship, setLinkRelationship] = useState("Wali");
  const [linkingStudent, setLinkingStudent] = useState(false);
  const [unlinkingStudentId, setUnlinkingStudentId] = useState<string | null>(null);

  // Delete confirmation
  const [deletingGuardian, setDeletingGuardian] = useState<Guardian | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setError(null);
      const [guardiansRes, studentsRes] = await Promise.all([
        fetch("/api/guardians"),
        fetch("/api/academic/students"),
      ]);

      if (guardiansRes.ok) {
        const json = await guardiansRes.json();
        setGuardians(json.data || []);
      } else {
        const json = await guardiansRes.json().catch(() => null);
        setError(json?.error || "Gagal memuat data orang tua / wali");
      }

      if (studentsRes.ok) {
        const json = await studentsRes.json();
        setAvailableStudents(
          (json.data || []).map((s: { id: string; fullName: string; username: string }) => ({
            id: s.id,
            fullName: s.fullName,
            username: s.username,
          }))
        );
      }
    } catch {
      setError("Gagal memuat data dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingGuardian(null);
    setUsername("");
    setPassword("");
    setFullName("");
    setEmail("");
    setPhone("");
    setSelectedStudentIds([]);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (guardian: Guardian) => {
    setEditingGuardian(guardian);
    setUsername(guardian.username);
    setPassword("");
    setFullName(guardian.fullName);
    setEmail(guardian.email || "");
    setPhone(guardian.phone || "");
    setSelectedStudentIds([]);
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingGuardian(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (editingGuardian) {
        // PATCH
        const payload: Record<string, string> = {
          fullName: fullName.trim(),
        };
        if (email.trim()) payload.email = email.trim();
        else payload.email = "";
        if (phone.trim()) payload.phone = phone.trim();
        else payload.phone = "";
        if (password.trim()) payload.password = password.trim();

        const res = await fetch(`/api/guardians/${editingGuardian.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error || "Gagal memperbarui data orang tua / wali");
          return;
        }

        setMessage(`Data orang tua / wali "${fullName}" berhasil diperbarui`);
        closeModal();
        await loadData();
      } else {
        // POST
        const payload = {
          username: username.trim(),
          password: password.trim(),
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          studentIds: selectedStudentIds.length > 0 ? selectedStudentIds : undefined,
        };

        const res = await fetch("/api/guardians", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json().catch(() => null);
        if (!res.ok) {
          setError(json?.error || "Gagal menambahkan data orang tua / wali");
          return;
        }

        setMessage(`Wali murid "${fullName}" berhasil didaftarkan`);
        closeModal();
        await loadData();
      }
    } catch {
      setError("Terjadi kesalahan saat memproses data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingGuardian) return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/guardians/${deletingGuardian.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.error || "Gagal menghapus data wali");
        return;
      }

      setMessage(`Data wali murid "${deletingGuardian.fullName}" berhasil dihapus`);
      setDeletingGuardian(null);
      await loadData();
    } catch {
      setError("Gagal menghapus data wali");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingGuardian || !selectedStudentToLink) return;

    setLinkingStudent(true);
    setError(null);
    try {
      const res = await fetch(`/api/guardians/${managingGuardian.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentToLink,
          relationship: linkRelationship,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal menautkan siswa");
        return;
      }

      setMessage(`Siswa berhasil ditautkan ke ${managingGuardian.fullName}`);
      setSelectedStudentToLink("");
      setLinkRelationship("Wali");
      await loadData();

      // Update current managing guardian view
      setManagingGuardian((prev) => {
        if (!prev) return null;
        const targetStudent = availableStudents.find((s) => s.id === selectedStudentToLink);
        return {
          ...prev,
          students: [
            ...prev.students,
            {
              id: selectedStudentToLink,
              name: targetStudent?.fullName || "Siswa",
              relationship: linkRelationship,
            },
          ],
        };
      });
    } catch {
      setError("Gagal menautkan siswa");
    } finally {
      setLinkingStudent(false);
    }
  };

  const handleUnlinkStudent = async (studentId: string) => {
    if (!managingGuardian) return;
    setUnlinkingStudentId(studentId);
    setError(null);

    try {
      const res = await fetch(`/api/guardians/${managingGuardian.id}/students/${studentId}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error || "Gagal melepas tautan siswa");
        return;
      }

      setMessage("Tautan siswa berhasil dilepas");
      await loadData();

      setManagingGuardian((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          students: prev.students.filter((s) => s.id !== studentId),
        };
      });
    } catch {
      setError("Gagal melepas tautan siswa");
    } finally {
      setUnlinkingStudentId(null);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const filteredGuardians = guardians.filter((g) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      g.fullName.toLowerCase().includes(q) ||
      g.username.toLowerCase().includes(q) ||
      (g.phone && g.phone.toLowerCase().includes(q)) ||
      g.students.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6" data-ui>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-ink flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" /> Data Orang Tua / Wali Siswa
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Manajemen master akun orang tua/wali murid dan relasi penautan siswa asuhan
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-strong text-white text-xs font-medium px-3.5 py-2 rounded transition"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Orang Tua / Wali
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
            placeholder="Cari nama, username, nomor HP, atau anak asuh..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-ground rounded text-ink placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="text-xs text-muted">
          Total: <strong className="text-ink tabular-nums">{guardians.length}</strong> orang tua / wali
        </div>
      </div>

      {/* Table list */}
      {loading ? (
        <div className="p-8 text-center text-xs text-muted">Memuat data orang tua / wali...</div>
      ) : filteredGuardians.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted bg-white rounded-lg">
          {searchQuery ? "Tidak ada orang tua / wali yang sesuai dengan pencarian." : "Belum ada akun wali yang terdaftar."}
        </div>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-ground text-[11px] font-semibold text-muted">
              <tr>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Username Akun</th>
                <th className="py-3 px-4">Kontak</th>
                <th className="py-3 px-4">Siswa Asuhan Terkait</th>
                {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredGuardians.map((g) => (
                <tr key={g.id} className="hover:bg-ground transition">
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-ink">{g.fullName}</span>
                    <span className="block text-[11px] text-faint tabular-nums">{g.id}</span>
                  </td>

                  <td className="py-3.5 px-4 tabular-nums text-ink font-medium">
                    {g.username}
                  </td>

                  <td className="py-3.5 px-4 text-muted">
                    <div className="flex flex-col gap-0.5">
                      {g.email ? (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Mail className="w-3 h-3 text-faint" /> {g.email}
                        </span>
                      ) : null}
                      {g.phone ? (
                        <span className="flex items-center gap-1 text-[11px] tabular-nums">
                          <Phone className="w-3 h-3 text-faint" /> {g.phone}
                        </span>
                      ) : null}
                      {!g.email && !g.phone && (
                        <span className="text-[11px] text-faint">-</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {g.students && g.students.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {g.students.map((student) => (
                          <span
                            key={student.id}
                            className="inline-flex items-center gap-1 text-[11px] bg-accent-soft text-accent-ink px-2 py-0.5 rounded font-medium"
                          >
                            <GraduationCap className="w-3 h-3 text-accent" />
                            {student.name}
                            <span className="text-muted text-[10px]">({student.relationship})</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted text-[11px] italic">Belum ada siswa ditautkan</span>
                    )}
                  </td>

                  {isAdmin && (
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setManagingGuardian(g);
                            setSelectedStudentToLink("");
                            setLinkRelationship("Wali");
                          }}
                          title="Kelola Siswa Asuhan"
                          className="p-1.5 text-accent hover:bg-accent-soft rounded transition inline-flex items-center gap-1 text-[11px] font-medium"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                          <span>Relasi</span>
                        </button>
                        <button
                          onClick={() => openEditModal(g)}
                          title="Edit Biodata"
                          className="p-1.5 text-faint hover:text-ink hover:bg-subtle rounded transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingGuardian(g)}
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

      {/* Modal Tambah / Edit Orang Tua */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-1">
              <h4 className="font-semibold text-sm text-ink flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                {editingGuardian ? `Edit Wali: ${editingGuardian.fullName}` : "Pendaftaran Orang Tua / Wali Baru"}
              </h4>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-faint hover:text-ink rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Nama Lengkap Wali <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Misal: Ir. Bambang Subagyo"
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">
                  Username Login <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingGuardian}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Misal: wali_bambang"
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
                />
                {editingGuardian && (
                  <p className="text-[11px] text-faint mt-0.5">
                    Username akun tidak dapat diubah setelah dibuat.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-faint" />
                  {editingGuardian ? "Reset Password (Opsional)" : "Password Akun"}{" "}
                  {!editingGuardian && <span className="text-danger">*</span>}
                </label>
                <input
                  type="password"
                  required={!editingGuardian}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    editingGuardian
                      ? "Kosongkan bila tidak ingin mengubah password"
                      : "Minimal 6 karakter"
                  }
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="wali@example.com"
                    className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Nomor HP / WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="081234567890"
                    className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              {/* Multi-student picker for initial registration */}
              {!editingGuardian && (
                <div>
                  <label className="block text-xs font-medium text-ink mb-1 flex items-center justify-between">
                    <span>Tautkan Siswa Asuhan (Opsional)</span>
                    <span className="text-[11px] text-faint tabular-nums">
                      Terpilih: {selectedStudentIds.length} siswa
                    </span>
                  </label>
                  <div className="max-h-36 overflow-y-auto rounded p-2 space-y-1 bg-ground">
                    {availableStudents.length === 0 ? (
                      <div className="text-muted text-[11px] py-1 text-center">
                        Belum ada siswa terdaftar di sistem
                      </div>
                    ) : (
                      availableStudents.map((s) => {
                        const isSelected = selectedStudentIds.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition text-xs ${
                              isSelected ? "bg-accent-soft text-accent-ink" : "hover:bg-white text-ink"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleStudentSelection(s.id)}
                              className="rounded text-accent focus:ring-0"
                            />
                            <span className="font-medium">{s.fullName}</span>
                            <span className="text-muted text-[11px]">({s.username})</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

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
                    : editingGuardian
                    ? "Simpan Perubahan"
                    : "Daftarkan Wali"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kelola Relasi Siswa Asuhan */}
      {managingGuardian && (
        <div className="fixed inset-0 z-50 bg-ink/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h4 className="font-semibold text-sm text-ink flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-accent" /> Kelola Siswa Asuhan
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  Wali: <strong className="text-ink">{managingGuardian.fullName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingGuardian(null)}
                className="p-1 text-faint hover:text-ink rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of currently linked students */}
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-ink">Siswa yang Saat Ini Terhubung:</h5>
              {managingGuardian.students.length === 0 ? (
                <div className="p-3 bg-ground text-center text-xs text-muted rounded">
                  Belum ada siswa asuhan yang ditautkan ke wali ini.
                </div>
              ) : (
                <div className="space-y-1.5 rounded overflow-hidden">
                  {managingGuardian.students.map((student) => (
                    <div
                      key={student.id}
                      className="p-2.5 bg-ground rounded flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-accent shrink-0" />
                        <div>
                          <div className="font-medium text-ink">{student.name}</div>
                          <div className="text-[11px] text-muted">Status relasi: {student.relationship}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnlinkStudent(student.id)}
                        disabled={unlinkingStudentId === student.id}
                        className="text-danger hover:bg-danger-soft p-1.5 rounded transition text-[11px] font-medium inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Lepas</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form to link a new student */}
            <form onSubmit={handleLinkStudent} className="space-y-3 text-xs pt-2">
              <h5 className="font-semibold text-ink flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-accent" /> Tautkan Siswa Baru
              </h5>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Pilih Siswa</label>
                <select
                  required
                  value={selectedStudentToLink}
                  onChange={(e) => setSelectedStudentToLink(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {availableStudents
                    .filter((s) => !managingGuardian.students.some((linked) => linked.id === s.id))
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.username})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1">Hubungan Keluarga</label>
                <select
                  value={linkRelationship}
                  onChange={(e) => setLinkRelationship(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-ground rounded text-ink focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="Ayah">Ayah</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Wali">Wali</option>
                  <option value="Kakek/Nenek">Kakek/Nenek</option>
                  <option value="Saudara">Saudara</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={linkingStudent || !selectedStudentToLink}
                  className="bg-accent hover:bg-accent-strong text-white text-xs font-medium px-4 py-1.5 rounded transition disabled:opacity-50"
                >
                  {linkingStudent ? "Menautkan..." : "Tautkan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Konfirmasi Hapus Wali */}
      {deletingGuardian && (
        <div className="fixed inset-0 z-50 bg-ink/20 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 space-y-3">
            <h4 className="font-semibold text-sm text-danger flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" /> Konfirmasi Hapus Wali
            </h4>
            <p className="text-xs text-ink leading-relaxed">
              Apakah Anda yakin ingin menghapus data orang tua / wali{" "}
              <strong className="text-ink">{deletingGuardian.fullName}</strong> ({deletingGuardian.username})?
              Semua relasi siswa asuhan terkait juga akan dibatalkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingGuardian(null)}
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
