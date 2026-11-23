import React, { useState, useEffect } from 'react';
import {
  Flame,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Timer,
  Search,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { ActivityLog } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';

export const ActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toTimeString().substring(0, 5);
  const [formData, setFormData] = useState({
    activityName: '',
    durationMinutes: 30,
    intensity: 'Sedang',
    date: todayStr,
    time: nowTimeStr,
    notes: '',
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<ActivityLog[]>('/api/activity');
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
      activityName: '',
      durationMinutes: 30,
      intensity: 'Sedang',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().substring(0, 5),
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (log: ActivityLog) => {
    setEditingLog(log);
    setFormData({
      activityName: log.activityName,
      durationMinutes: log.durationMinutes,
      intensity: log.intensity,
      date: log.date,
      time: log.time,
      notes: log.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activityName.trim()) {
      alert('Nama aktivitas wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      if (editingLog) {
        await apiRequest(`/api/activity/${editingLog.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setToastMessage('Catatan aktivitas berhasil diperbarui!');
      } else {
        await apiRequest('/api/activity', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setToastMessage('Aktivitas fisik baru berhasil dicatat!');
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
      await apiRequest(`/api/activity/${deletingId}`, { method: 'DELETE' });
      setToastMessage('Catatan aktivitas berhasil dihapus!');
      setDeletingId(null);
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  const filtered = logs.filter(
    (l) =>
      l.activityName.toLowerCase().includes(search.toLowerCase()) ||
      l.intensity.toLowerCase().includes(search.toLowerCase()) ||
      l.date.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-700">
              <Flame className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Aktivitas Fisik & Olahraga</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekam durasi kardio, angkat beban, atau jalan kaki harian Anda.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Aktivitas Baru</span>
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
              placeholder="Cari aktivitas atau intensitas..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total {filtered.length} Catatan
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat catatan aktivitas...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Flame className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Belum ada aktivitas yang dicatat</p>
            <p className="text-xs text-slate-400 mt-1">Mulai rekam sesi gerak atau olahraga Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Tanggal & Jam</th>
                  <th className="py-3 px-4">Nama Aktivitas</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4">Intensitas</th>
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

                    <td className="py-3 px-4 font-bold text-slate-900">{item.activityName}</td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <Timer className="w-3.5 h-3.5 text-teal-600" />
                        <span>{item.durationMinutes} Menit</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.intensity === 'Tinggi'
                          ? 'bg-rose-100 text-rose-800'
                          : item.intensity === 'Sedang'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {item.intensity}
                      </span>
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
        title={editingLog ? 'Edit Catatan Aktivitas' : 'Catat Aktivitas Baru'}
        subtitle="Simpan data sesi olahraga dan durasi waktu aktivitas Anda"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Aktivitas / Olahraga <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.activityName}
              onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
              placeholder="Contoh: Jogging, Bersepeda, Senam Pagi, Gym"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi (Menit)</label>
              <input
                type="number"
                min="1"
                max="600"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Intensitas</label>
              <select
                value={formData.intensity}
                onChange={(e) => setFormData({ ...formData, intensity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              >
                <option value="Rendah">Rendah (Santai)</option>
                <option value="Sedang">Sedang (Bakar Keringat)</option>
                <option value="Tinggi">Tinggi (Denyut Cepat/Berat)</option>
              </select>
            </div>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Contoh: Menempuh 5 km, badan terasa sangat enteng..."
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
              <span>{editingLog ? 'Simpan Perubahan' : 'Catat Aktivitas'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Catatan Aktivitas"
        message="Apakah Anda yakin ingin menghapus catatan aktivitas fisik ini?"
      />
    </div>
  );
};
