import React, { useState, useEffect } from 'react';
import {
  Moon,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Star,
  Search,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { SleepLog } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';

export const SleepPage: React.FC = () => {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<SleepLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    date: todayStr,
    sleepTime: '23:00',
    wakeTime: '06:30',
    durationHours: 7.5,
    quality: 4,
    notes: '',
  });

  const calculateDuration = (sleep: string, wake: string) => {
    try {
      const [sh, sm] = sleep.split(':').map(Number);
      const [wh, wm] = wake.split(':').map(Number);
      let sMinutes = sh * 60 + sm;
      let wMinutes = wh * 60 + wm;
      if (wMinutes < sMinutes) {
        wMinutes += 24 * 60; // crossed midnight
      }
      const diff = (wMinutes - sMinutes) / 60;
      return Number(diff.toFixed(2));
    } catch {
      return 7.5;
    }
  };

  const handleTimeChange = (sleep: string, wake: string) => {
    const dur = calculateDuration(sleep, wake);
    setFormData((prev) => ({
      ...prev,
      sleepTime: sleep,
      wakeTime: wake,
      durationHours: dur,
    }));
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<SleepLog[]>('/api/sleep');
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

  const openCreateModal = () => {
    setEditingLog(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      sleepTime: '23:00',
      wakeTime: '06:30',
      durationHours: 7.5,
      quality: 4,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (log: SleepLog) => {
    setEditingLog(log);
    setFormData({
      date: log.date,
      sleepTime: log.sleepTime,
      wakeTime: log.wakeTime,
      durationHours: log.durationHours,
      quality: log.quality,
      notes: log.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingLog) {
        await apiRequest(`/api/sleep/${editingLog.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setToastMessage('Catatan tidur berhasil diperbarui!');
      } else {
        await apiRequest('/api/sleep', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setToastMessage('Catatan tidur berhasil ditambahkan!');
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
      await apiRequest(`/api/sleep/${deletingId}`, { method: 'DELETE' });
      setToastMessage('Catatan tidur berhasil dihapus!');
      setDeletingId(null);
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  const filtered = logs.filter(
    (l) => l.date.includes(search) || (l.notes && l.notes.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
              <Moon className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Data Istirahat & Tidur</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau durasi dan kualitas deep sleep untuk perbaikan metabolisme sel.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Waktu Tidur</span>
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
              placeholder="Cari berdasarkan tanggal atau catatan..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total {filtered.length} Catatan
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat catatan tidur...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Moon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Belum ada catatan tidur</p>
            <p className="text-xs text-slate-400 mt-1">Rekam jam tidur dan bangun pagi Anda secara rutin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Tanggal Bangun</th>
                  <th className="py-3 px-4">Jam Tidur</th>
                  <th className="py-3 px-4">Jam Bangun</th>
                  <th className="py-3 px-4">Durasi Total</th>
                  <th className="py-3 px-4">Kualitas Tidur</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.date}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium">{item.sleepTime}</td>
                    <td className="py-3 px-4 font-mono font-medium">{item.wakeTime}</td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {item.durationHours} Jam
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= item.quality
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{item.notes || '-'}</td>

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
        title={editingLog ? 'Edit Catatan Tidur' : 'Catat Waktu Tidur'}
        subtitle="Pantau durasi istirahat dan kualitas kenyenyakan tidur Anda"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Bangun</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai Tidur</label>
              <input
                type="time"
                value={formData.sleepTime}
                onChange={(e) => handleTimeChange(e.target.value, formData.wakeTime)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Bangun Pagi</label>
              <input
                type="time"
                value={formData.wakeTime}
                onChange={(e) => handleTimeChange(formData.sleepTime, e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-900">Durasi Tidur Terhitung:</span>
            <span className="text-sm font-black text-indigo-700">{formData.durationHours} Jam</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kualitas Tidur: {formData.quality}/5 Bintang
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setFormData({ ...formData, quality: star })}
                  className={`p-2 rounded-xl border transition-all ${
                    formData.quality >= star
                      ? 'bg-amber-50 border-amber-300 text-amber-500'
                      : 'bg-white border-slate-200 text-slate-300'
                  }`}
                >
                  <Star className="w-5 h-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Contoh: Tidur sangat pulas tanpa terbangun di malam hari..."
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
              <span>{editingLog ? 'Simpan Perubahan' : 'Catat Tidur'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Catatan Tidur"
        message="Apakah Anda yakin ingin menghapus data tidur ini?"
      />
    </div>
  );
};
