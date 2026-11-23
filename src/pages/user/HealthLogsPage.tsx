import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { HealthLog } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';

export const HealthLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<HealthLog | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toTimeString().substring(0, 5);
  const [formData, setFormData] = useState({
    date: todayStr,
    time: nowTimeStr,
    energy: 7,
    mood: 'Baik',
    bodyCondition: 'Segar',
    stomachCondition: 'Nyaman',
    stressLevel: 3,
    notes: '',
  });

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<HealthLog[]>('/api/health');
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
      time: new Date().toTimeString().substring(0, 5),
      energy: 7,
      mood: 'Baik',
      bodyCondition: 'Segar',
      stomachCondition: 'Nyaman',
      stressLevel: 3,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (log: HealthLog) => {
    setEditingLog(log);
    setFormData({
      date: log.date,
      time: log.time,
      energy: log.energy,
      mood: log.mood,
      bodyCondition: log.bodyCondition,
      stomachCondition: log.stomachCondition,
      stressLevel: log.stressLevel,
      notes: log.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingLog) {
        await apiRequest(`/api/health/${editingLog.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setToastMessage('Catatan kesehatan berhasil diperbarui!');
      } else {
        await apiRequest('/api/health', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setToastMessage('Catatan kesehatan baru berhasil ditambahkan!');
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
      await apiRequest(`/api/health/${deletingId}`, { method: 'DELETE' });
      setToastMessage('Catatan kesehatan berhasil dihapus!');
      setDeletingId(null);
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.mood.toLowerCase().includes(search.toLowerCase()) ||
      l.bodyCondition.toLowerCase().includes(search.toLowerCase()) ||
      l.stomachCondition.toLowerCase().includes(search.toLowerCase()) ||
      (l.notes && l.notes.toLowerCase().includes(search.toLowerCase())) ||
      l.date.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Data Kesehatan</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pantau tingkat energi, kondisi perut, dan stres tubuh secara real-time.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Data Kesehatan</span>
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

      {/* Search and Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan tanggal, mood, kondisi..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total {filteredLogs.length} Catatan
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat data kesehatan dari PostgreSQL...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <HeartPulse className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Belum ada catatan kesehatan</p>
            <p className="text-xs text-slate-400 mt-1">Klik tombol di atas untuk menambahkan catatan pertama Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Energi</th>
                  <th className="py-3 px-4">Mood</th>
                  <th className="py-3 px-4">Kondisi Tubuh</th>
                  <th className="py-3 px-4">Kondisi Perut</th>
                  <th className="py-3 px-4">Stres</th>
                  <th className="py-3 px-4">Catatan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.date}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{log.time}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{log.energy}/10</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                        {log.mood}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium">{log.bodyCondition}</td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        log.stomachCondition.toLowerCase().includes('begah') || log.stomachCondition.toLowerCase().includes('kembung') || log.stomachCondition.toLowerCase().includes('perih')
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {log.stomachCondition}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{log.stressLevel}/10</span>
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {log.notes || '-'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Edit Catatan"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(log.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Catatan"
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

      {/* Modal CRUD Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLog ? 'Edit Data Kesehatan' : 'Tambah Data Kesehatan'}
        subtitle="Simpan data kondisi fisik dan psikologis harian Anda"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Energi: <span className="text-teal-600 font-bold">{formData.energy}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.energy}
                onChange={(e) => setFormData({ ...formData, energy: Number(e.target.value) })}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tingkat Stres: <span className="text-amber-600 font-bold">{formData.stressLevel}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.stressLevel}
                onChange={(e) => setFormData({ ...formData, stressLevel: Number(e.target.value) })}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mood</label>
              <select
                value={formData.mood}
                onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="Sangat Baik">Sangat Baik</option>
                <option value="Baik">Baik</option>
                <option value="Netral">Netral</option>
                <option value="Cemas">Cemas</option>
                <option value="Buruk">Buruk</option>
                <option value="Sangat Buruk">Sangat Buruk</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi Tubuh</label>
              <select
                value={formData.bodyCondition}
                onChange={(e) => setFormData({ ...formData, bodyCondition: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="Sangat Segar">Sangat Segar</option>
                <option value="Segar">Segar</option>
                <option value="Biasa / Normal">Biasa / Normal</option>
                <option value="Sedikit Lemas">Sedikit Lemas</option>
                <option value="Pegal-Pegal">Pegal-Pegal</option>
                <option value="Nyeri Tubuh">Nyeri Tubuh</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kondisi Perut</label>
              <select
                value={formData.stomachCondition}
                onChange={(e) => setFormData({ ...formData, stomachCondition: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="Sangat Nyaman">Sangat Nyaman</option>
                <option value="Nyaman">Nyaman</option>
                <option value="Sedikit Begah">Sedikit Begah</option>
                <option value="Perut Kembung">Perut Kembung</option>
                <option value="Mual">Mual</option>
                <option value="Perih Lambung">Perih Lambung</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Contoh: Merasa segar setelah tidur 8 jam, pekerjaan kantor lancar..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              <span>{editingLog ? 'Simpan Perubahan' : 'Tambah Catatan'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Catatan Kesehatan"
        message="Apakah Anda yakin ingin menghapus data kesehatan ini? Tindakan ini akan menghapus data permanen dari database."
      />
    </div>
  );
};
