import React, { useState, useEffect } from 'react';
import { Layers, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Category } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'MEAL',
    description: '',
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Category[]>('/api/admin/categories');
      setCategories(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      type: 'MEAL',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      type: cat.type,
      description: cat.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama kategori wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await apiRequest(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setToastMessage('Kategori berhasil diperbarui!');
      } else {
        await apiRequest('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setToastMessage('Kategori baru berhasil dibuat!');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kategori');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiRequest(`/api/admin/categories/${deletingId}`, { method: 'DELETE' });
      setToastMessage('Kategori berhasil dihapus!');
      setDeletingId(null);
      fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kategori');
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Manajemen Kategori</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola taksonomi pengelompokan makanan, gejala sakit, olahraga, dan artikel.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori Baru</span>
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
              placeholder="Cari kategori..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">Total {filtered.length} Kategori</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat kategori...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Tidak ada kategori ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Nama Kategori</th>
                  <th className="py-3 px-4">Tipe Modul</th>
                  <th className="py-3 px-4">Deskripsi</th>
                  <th className="py-3 px-4 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.description || '-'}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
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
        title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        subtitle="Atur taksonomi modul aplikasi"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kategori *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Modul *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            >
              <option value="MEAL">MEAL (Makanan)</option>
              <option value="SYMPTOM">SYMPTOM (Gejala Tubuh)</option>
              <option value="ACTIVITY">ACTIVITY (Aktivitas Olahraga)</option>
              <option value="ARTICLE">ARTICLE (Artikel Edukasi)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            />
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
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Kategori"
        message="Apakah Anda yakin ingin menghapus kategori ini?"
      />
    </div>
  );
};
