import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  CupSoda,
  Search,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { HydrationLog } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';

export const HydrationPage: React.FC = () => {
  const [logs, setLogs] = useState<HydrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<HydrationLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toTimeString().substring(0, 5);
  const [formData, setFormData] = useState({
    amountMl: 250,
    date: todayStr,
    time: nowTimeStr,
    notes: '',
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<HydrationLog[]>('/api/hydration');
      setLogs(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const openCreateModal = (presetMl?: number) => {
    setEditingLog(null);
    setFormData({
      amountMl: presetMl || 250,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().substring(0, 5),
      notes: presetMl ? `Minum ${presetMl} ml air mineral` : '',
    });
    setIsModalOpen(true);
  };

  const handleQuickAdd = async (amount: number, label: string) => {
    try {
      await apiRequest('/api/hydration', {
        method: 'POST',
        body: JSON.stringify({
          amountMl: amount,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().substring(0, 5),
          notes: label,
        }),
      });
      setToastMessage(`Berhasil menambahkan ${amount} ml air!`);
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan hidrasi');
    }
  };

  const openEditModal = (log: HydrationLog) => {
    setEditingLog(log);
    setFormData({
      amountMl: log.amountMl,
      date: log.date,
      time: log.time,
      notes: log.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amountMl || formData.amountMl <= 0) {
      alert('Jumlah air (ml) harus lebih dari 0');
      return;
    }

    setSubmitting(true);
    try {
      if (editingLog) {
        await apiRequest(`/api/hydration/${editingLog.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setToastMessage('Catatan hidrasi berhasil diperbarui!');
      } else {
        await apiRequest('/api/hydration', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setToastMessage('Catatan hidrasi berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiRequest(`/api/hydration/${deletingId}`, { method: 'DELETE' });
      setToastMessage('Catatan hidrasi berhasil dihapus!');
      setDeletingId(null);
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  // Compute Today's Total
  const todayLogs = logs.filter((l) => l.date === todayStr);
  const todayTotalMl = todayLogs.reduce((acc, l) => acc + l.amountMl, 0);
  const targetMl = 2000;
  const progressPercent = Math.min(100, Math.round((todayTotalMl / targetMl) * 100));

  const filtered = logs.filter(
    (l) => l.date.includes(search) || (l.notes && l.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
              <Droplets className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Data Hidrasi & Asupan Air</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Jaga asupan cairan harian untuk melancarkan saluran cerna dan detoksifikasi alami.
          </p>
        </div>

        <button
          onClick={() => openCreateModal()}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Asupan Kustom</span>
        </button>
      </div>

      {/* Progress & Quick Log Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Progress Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Progres Hari Ini</span>
              <span className="text-xs font-black text-sky-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-400 to-teal-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between text-xs">
            <span className="text-2xl font-black text-slate-900">{todayTotalMl} ml</span>
            <span className="text-slate-400 font-medium">Target: {targetMl} ml</span>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="md:col-span-2 p-6 rounded-2xl bg-sky-50/60 border border-sky-100 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-sky-900 uppercase tracking-wider block mb-1">
              Pintasan Tambah Cepat
            </span>
            <p className="text-xs text-slate-500">Klik untuk langsung mencatat asupan tanpa membuka form:</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5 mt-3">
            <button
              onClick={() => handleQuickAdd(250, 'Segelas air putih')}
              className="p-3 rounded-xl bg-white hover:bg-sky-100/80 border border-sky-200/80 text-center transition-all cursor-pointer shadow-2xs group"
            >
              <CupSoda className="w-5 h-5 text-sky-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-slate-800">+250 ml</p>
              <p className="text-[10px] text-slate-400">1 Gelas</p>
            </button>

            <button
              onClick={() => handleQuickAdd(600, 'Botol minum sedang')}
              className="p-3 rounded-xl bg-white hover:bg-sky-100/80 border border-sky-200/80 text-center transition-all cursor-pointer shadow-2xs group"
            >
              <Droplets className="w-5 h-5 text-sky-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-slate-800">+600 ml</p>
              <p className="text-[10px] text-slate-400">Botol Sedang</p>
            </button>

            <button
              onClick={() => handleQuickAdd(1000, 'Botol tumbler besar')}
              className="p-3 rounded-xl bg-white hover:bg-sky-100/80 border border-sky-200/80 text-center transition-all cursor-pointer shadow-2xs group"
            >
              <Droplets className="w-5 h-5 text-teal-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-slate-800">+1000 ml</p>
              <p className="text-[10px] text-slate-400">Tumbler Besar</p>
            </button>
          </div>
        </div>
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
              placeholder="Cari berdasarkan tanggal atau catatan..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total {filtered.length} Catatan
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat catatan hidrasi...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Droplets className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Belum ada catatan hidrasi</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan pintasan di atas untuk mulai mencatat air minum Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Tanggal & Jam</th>
                  <th className="py-3 px-4">Jumlah Air</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.date}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{item.time}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-sky-700">
                      {item.amountMl} ml
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {item.notes || '-'}
                    </td>

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
        title={editingLog ? 'Edit Catatan Hidrasi' : 'Tambah Asupan Hidrasi'}
        subtitle="Catat jumlah volume cairan yang Anda minum"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Air (ml) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="50"
              max="5000"
              step="50"
              value={formData.amountMl}
              onChange={(e) => setFormData({ ...formData, amountMl: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Contoh: Air mineral dingin, teh hangat tanpa gula..."
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
              <span>{editingLog ? 'Simpan Perubahan' : 'Catat Hidrasi'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Catatan Hidrasi"
        message="Apakah Anda yakin ingin menghapus data hidrasi ini?"
      />
    </div>
  );
};
