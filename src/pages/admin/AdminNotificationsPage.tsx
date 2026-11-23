import React, { useState, useEffect } from 'react';
import { BellRing, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { SystemNotification } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';

export const AdminNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotif, setEditingNotif] = useState<SystemNotification | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRole: 'ALL',
    type: 'INFO',
    isActive: true,
  });

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<SystemNotification[]>('/api/admin/notifications');
      setNotifications(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const openCreateModal = () => {
    setEditingNotif(null);
    setFormData({
      title: '',
      message: '',
      targetRole: 'ALL',
      type: 'INFO',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (notif: SystemNotification) => {
    setEditingNotif(notif);
    setFormData({
      title: notif.title,
      message: notif.message,
      targetRole: notif.targetRole,
      type: notif.type,
      isActive: notif.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Judul dan pesan notifikasi wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      if (editingNotif) {
        await apiRequest(`/api/admin/notifications/${editingNotif.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setToastMessage('Notifikasi berhasil diperbarui!');
      } else {
        await apiRequest('/api/admin/notifications', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setToastMessage('Notifikasi baru berhasil disiarkan!');
      }
      setIsModalOpen(false);
      fetchNotifs();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan notifikasi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiRequest(`/api/admin/notifications/${deletingId}`, { method: 'DELETE' });
      setToastMessage('Notifikasi berhasil dihapus!');
      setDeletingId(null);
      fetchNotifs();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus notifikasi');
    }
  };

  const filtered = notifications.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <BellRing className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Notifikasi & Pengumuman Sistem</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kirimkan broadcast tips kesehatan dan pengumuman kepada pengguna.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Notifikasi Baru</span>
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
              placeholder="Cari notifikasi..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">Total {filtered.length} Pesan</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat notifikasi...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Belum ada pengumuman disiarkan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Judul & Pesan</th>
                  <th className="py-3 px-4">Target Role</th>
                  <th className="py-3 px-4">Tipe</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{item.title}</span>
                      <span className="text-slate-500 text-[11px] block mt-0.5 line-clamp-2 max-w-md">{item.message}</span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{item.targetRole}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
        title={editingNotif ? 'Edit Notifikasi' : 'Buat Notifikasi Baru'}
        subtitle="Siarkan pengumuman atau tips kesehatan kepada pengguna"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Notifikasi *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Pengguna</label>
              <select
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              >
                <option value="ALL">Semua Pengguna (ALL)</option>
                <option value="USER">Hanya Pasien (USER)</option>
                <option value="ADMIN">Hanya Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Pesan</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              >
                <option value="INFO">Informasi Umum</option>
                <option value="TIP">Tips Kesehatan</option>
                <option value="ALERT">Peringatan / Alert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Pesan Siaran *</label>
            <textarea
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded text-rose-600"
              />
              <span className="font-semibold">Aktifkan pengumuman segera</span>
            </label>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{editingNotif ? 'Simpan Perubahan' : 'Siarkan Pesan'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Notifikasi"
        message="Apakah Anda yakin ingin menghapus notifikasi pengumuman ini?"
      />
    </div>
  );
};
