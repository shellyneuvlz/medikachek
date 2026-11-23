import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  Shield,
  User as UserIcon,
  Eye,
  Utensils,
  HeartPulse,
  AlertCircle,
  Moon,
  Flame,
  Activity,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { User } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';

export const AdminUsersPage: React.FC = () => {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // User Summary Modal State
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    isActive: true,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<User[]>('/api/admin/users');
      setUsersList(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // leave empty unless changing
      role: user.role,
      isActive: user.isActive !== undefined ? user.isActive : true,
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await apiRequest(`/api/admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setToastMessage(`Status akun ${user.name} berhasil diubah!`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status pengguna');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        await apiRequest(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setToastMessage('Data pengguna berhasil diperbarui!');
      } else {
        if (!formData.password) {
          alert('Kata sandi wajib diisi untuk pengguna baru');
          setSubmitting(false);
          return;
        }
        await apiRequest('/api/admin/users', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setToastMessage('Pengguna baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses formulir pengguna');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiRequest(`/api/admin/users/${deletingId}`, { method: 'DELETE' });
      setToastMessage('Pengguna berhasil dihapus dari sistem!');
      setDeletingId(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengguna');
    }
  };

  const filtered = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Manajemen Pengguna</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola hak akses role, tambah akun baru, dan kontrol status aktif/nonaktif.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna Baru</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, role..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total {filtered.length} Pengguna
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat data pengguna...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Tidak ada data pengguna ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Pengguna</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4 text-center">Makanan</th>
                  <th className="py-3 px-4 text-center">Health</th>
                  <th className="py-3 px-4 text-center">Total Log</th>
                  <th className="py-3 px-4">Aksi Kontrol</th>
                  <th className="py-3 px-4 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{u.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.isActive ? 'Aktif' : 'Dinonaktifkan'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-teal-700">
                      {u.totalMeals ?? 0}
                    </td>

                    <td className="py-3 px-4 text-center font-bold text-rose-700">
                      {u.totalHealthChecks ?? 0}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                        {u.totalRecords ?? 0}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                          u.isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {u.isActive ? 'Nonaktifkan' : 'Aktifkan Akun'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingUser(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                          title="Lihat Rincian Rekam Medis"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                          title="Edit Pengguna"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(u.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
        subtitle="Kelola profil akun dan hak akses otoritas sistem"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {editingUser ? 'Kata Sandi Baru (Kosongkan jika tidak diubah)' : 'Kata Sandi Awal *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editingUser ? 'Biarkan kosong untuk mempertahankan sandi' : 'Minimal 6 karakter'}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required={!editingUser}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role Akun</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              >
                <option value="USER">USER (Pasien / Pengguna)</option>
                <option value="ADMIN">ADMIN (Pengelola Sistem)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Akun</label>
              <select
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif (Dibekukan)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* User Record Details Modal */}
      <Modal
        isOpen={viewingUser !== null}
        onClose={() => setViewingUser(null)}
        title="Ringkasan Data Masuk Pengguna"
        subtitle={`Rincian catatan dan aktivitas pasien ${viewingUser?.name}`}
        maxWidth="md"
      >
        {viewingUser && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{viewingUser.name}</h4>
                <p className="font-mono text-xs text-slate-500 mt-0.5">{viewingUser.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      viewingUser.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    Role: {viewingUser.role}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      viewingUser.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {viewingUser.isActive ? 'Akun Aktif' : 'Akun Dinonaktifkan'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Semua Data</span>
                <span className="text-3xl font-black text-purple-700 mt-0.5 block">
                  {viewingUser.totalRecords || 0}
                </span>
                <span className="text-[10px] text-slate-400">Record tersimpan</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-100">
                <div className="flex items-center gap-1.5 text-xs text-teal-800 font-semibold mb-1">
                  <Utensils className="w-3.5 h-3.5 text-teal-600" />
                  <span>Catatan Makanan</span>
                </div>
                <p className="text-2xl font-black text-teal-900">{viewingUser.totalMeals || 0}</p>
                <span className="text-[10px] text-teal-700">Porsi menu makan</span>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100">
                <div className="flex items-center gap-1.5 text-xs text-rose-800 font-semibold mb-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                  <span>Health Check</span>
                </div>
                <p className="text-2xl font-black text-rose-900">{viewingUser.totalHealthChecks || 0}</p>
                <span className="text-[10px] text-rose-700">Evaluasi energi & perut</span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Catatan Gejala</span>
                </div>
                <p className="text-2xl font-black text-amber-900">{viewingUser.totalSymptoms || 0}</p>
                <span className="text-[10px] text-amber-700">Laporan keluhan fisik</span>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-1.5 text-xs text-indigo-800 font-semibold mb-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pencatatan Tidur</span>
                </div>
                <p className="text-2xl font-black text-indigo-900">{viewingUser.totalSleep || 0}</p>
                <span className="text-[10px] text-indigo-700">Sesi tidur & kualitas</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span>Aktivitas Fisik: <strong>{viewingUser.totalActivity || 0} sesi</strong></span>
              <span className="text-[11px] text-slate-400">
                Terdaftar: {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString('id-ID') : '-'}
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingUser(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Pengguna"
        message="Apakah Anda yakin ingin menghapus akun pengguna ini secara permanen dari basis data PostgreSQL?"
      />
    </div>
  );
};
