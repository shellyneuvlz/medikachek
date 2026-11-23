import React, { useState, useEffect } from 'react';
import { Database, Plus, Pencil, Trash2, Search, Flame } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { FoodItem } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';

export const AdminFoodsPage: React.FC = () => {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Makan Siang',
    calories: 250,
    protein: 10,
    carbs: 35,
    fat: 5,
    standardPortion: '1 Porsi',
    description: '',
  });

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<FoodItem[]>('/api/admin/foods');
      setFoods(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const openCreateModal = () => {
    setEditingFood(null);
    setFormData({
      name: '',
      category: 'Makan Siang',
      calories: 250,
      protein: 10,
      carbs: 35,
      fat: 5,
      standardPortion: '1 Porsi',
      description: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (food: FoodItem) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      category: food.category,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      standardPortion: food.standardPortion,
      description: food.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama makanan wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      if (editingFood) {
        await apiRequest(`/api/admin/foods/${editingFood.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setToastMessage('Item database makanan berhasil diperbarui!');
      } else {
        await apiRequest('/api/admin/foods', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setToastMessage('Makanan baru berhasil ditambahkan ke database!');
      }
      setIsModalOpen(false);
      fetchFoods();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan makanan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiRequest(`/api/admin/foods/${deletingId}`, { method: 'DELETE' });
      setToastMessage('Makanan berhasil dihapus dari database!');
      setDeletingId(null);
      fetchFoods();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus makanan');
    }
  };

  const filtered = foods.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Database Makanan Global</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Master pustaka nutrisi, kandungan kalori, makronutrisi, dan porsi standar.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Makanan Baru</span>
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
              placeholder="Cari makanan..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">Total {filtered.length} Menu</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat database makanan...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Tidak ada data makanan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Nama Makanan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Kalori</th>
                  <th className="py-3 px-4">Makronutrisi (P/C/F)</th>
                  <th className="py-3 px-4">Porsi Acuan</th>
                  <th className="py-3 px-4 text-right">Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-teal-700">{item.calories} kkal</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {item.protein}g / {item.carbs}g / {item.fat}g
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{item.standardPortion}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
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
        title={editingFood ? 'Edit Master Makanan' : 'Tambah Makanan Baru'}
        subtitle="Kelola data gizi dan porsi standar makanan"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Makanan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              >
                <option value="Sarapan">Sarapan</option>
                <option value="Makan Siang">Makan Siang</option>
                <option value="Makan Malam">Makan Malam</option>
                <option value="Snack / Camilan">Snack / Camilan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Porsi Standar</label>
              <input
                type="text"
                value={formData.standardPortion}
                onChange={(e) => setFormData({ ...formData, standardPortion: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kalori (kkal)</label>
              <input
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Protein (g)</label>
              <input
                type="number"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: Number(e.target.value) })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Karbo (g)</label>
              <input
                type="number"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: Number(e.target.value) })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Lemak (g)</label>
              <input
                type="number"
                value={formData.fat}
                onChange={(e) => setFormData({ ...formData, fat: Number(e.target.value) })}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Tambahan</label>
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
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{editingFood ? 'Simpan Perubahan' : 'Tambahkan'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Makanan dari Database"
        message="Apakah Anda yakin ingin menghapus data makanan ini dari database referensi global?"
      />
    </div>
  );
};
