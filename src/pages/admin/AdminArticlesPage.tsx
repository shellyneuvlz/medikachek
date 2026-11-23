import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { EducationArticle } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';

export const AdminArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<EducationArticle | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Gaya Hidup & Nutrisi',
    summary: '',
    content: '',
    author: 'Tim MedikaCheck',
    readTime: '3 min read',
    isPublished: true,
  });

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<EducationArticle[]>('/api/admin/articles');
      setArticles(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      category: 'Gaya Hidup & Nutrisi',
      summary: '',
      content: '',
      author: 'Tim Dokter MedikaCheck',
      readTime: '3 min read',
      isPublished: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (art: EducationArticle) => {
    setEditingArticle(art);
    setFormData({
      title: art.title,
      category: art.category,
      summary: art.summary,
      content: art.content,
      author: art.author,
      readTime: art.readTime,
      isPublished: art.isPublished,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Judul dan isi artikel wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      if (editingArticle) {
        await apiRequest(`/api/admin/articles/${editingArticle.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setToastMessage('Artikel berhasil diperbarui!');
      } else {
        await apiRequest('/api/admin/articles', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setToastMessage('Artikel baru berhasil diterbitkan!');
      }
      setIsModalOpen(false);
      fetchArticles();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan artikel');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiRequest(`/api/admin/articles/${deletingId}`, { method: 'DELETE' });
      setToastMessage('Artikel berhasil dihapus!');
      setDeletingId(null);
      fetchArticles();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus artikel');
    }
  };

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Artikel Edukasi Kesehatan</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tulis dan publikasikan konten panduan nutrisi medis bagi pengguna.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Artikel Baru</span>
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
              placeholder="Cari judul artikel..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">Total {filtered.length} Artikel</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat artikel...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Belum ada artikel edukasi</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Judul Artikel</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Penulis</th>
                  <th className="py-3 px-4">Status Publikasi</th>
                  <th className="py-3 px-4 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{item.title}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-md block mt-0.5">{item.summary}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{item.author}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        item.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.isPublished ? 'Tayang (Published)' : 'Draft (Disembunyikan)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
        title={editingArticle ? 'Edit Artikel Edukasi' : 'Tulis Artikel Edukasi Baru'}
        subtitle="Susun panduan kesehatan untuk dibaca oleh seluruh pasien"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Artikel *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: 5 Pola Makan Ramah Lambung untuk Penderita Maag"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Penulis</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ringkasan Singkat (Lead)</label>
            <textarea
              rows={2}
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Isi Konten Lengkap</label>
            <textarea
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-sans"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="rounded text-blue-600"
              />
              <span className="font-semibold">Terbitkan langsung ke beranda edukasi pengguna</span>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{editingArticle ? 'Simpan Perubahan' : 'Terbitkan Artikel'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Artikel"
        message="Apakah Anda yakin ingin menghapus artikel edukasi ini secara permanen?"
      />
    </div>
  );
};
