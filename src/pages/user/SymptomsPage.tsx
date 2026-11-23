import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Symptom } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';

export const SymptomsPage: React.FC = () => {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSymptom, setEditingSymptom] = useState<Symptom | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toTimeString().substring(0, 5);
  const [formData, setFormData] = useState({
    name: '',
    intensity: 5,
    date: todayStr,
    time: nowTimeStr,
    duration: '30 Menit',
    notes: '',
  });

  const fetchSymptoms = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Symptom[]>('/api/symptoms');
      setSymptoms(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSymptoms();
  }, []);

  const openCreateModal = () => {
    setEditingSymptom(null);
    setFormData({
      name: '',
      intensity: 5,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().substring(0, 5),
      duration: '30 Menit',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (symptom: Symptom) => {
    setEditingSymptom(symptom);
    setFormData({
      name: symptom.name,
      intensity: symptom.intensity,
      date: symptom.date,
      time: symptom.time,
      duration: symptom.duration,
      notes: symptom.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama gejala wajib diisi');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSymptom) {
        await apiRequest(`/api/symptoms/${editingSymptom.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
        setToastMessage('Catatan gejala berhasil diperbarui!');
      } else {
        await apiRequest('/api/symptoms', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setToastMessage('Gejala baru berhasil dicatat!');
      }
      setIsModalOpen(false);
      fetchSymptoms();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiRequest(`/api/symptoms/${deletingId}`, { method: 'DELETE' });
      setToastMessage('Catatan gejala berhasil dihapus!');
      setDeletingId(null);
      fetchSymptoms();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  const filtered = symptoms.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(search.toLowerCase())) ||
      s.date.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Catatan Gejala Tubuh</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Rekam keluhan fisik dan intensitas rasa sakit secara objektif.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Gejala</span>
        </button>
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Penting: Disclaimer Medis</span>
          <p className="text-slate-600 leading-relaxed">
            Data dalam laporan ini berasal dari catatan pengguna dan bukan merupakan diagnosis medis atau pengganti pemeriksaan tenaga kesehatan. Jika Anda mengalami nyeri dada hebat atau sesak nafas mendadak, segera hubungi layanan gawat darurat.
          </p>
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
              placeholder="Cari nama gejala atau catatan..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total {filtered.length} Catatan
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Memuat catatan gejala...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Tidak ada catatan gejala</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol di atas jika Anda merasakan keluhan fisik tertentu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Waktu Kejadian</th>
                  <th className="py-3 px-4">Nama Gejala</th>
                  <th className="py-3 px-4">Intensitas</th>
                  <th className="py-3 px-4">Durasi</th>
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

                    <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.intensity >= 7
                          ? 'bg-rose-100 text-rose-800'
                          : item.intensity >= 4
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        Tingkat {item.intensity}/10
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium">{item.duration}</td>

                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {item.notes || '-'}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Edit Gejala"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Gejala"
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
        title={editingSymptom ? 'Edit Catatan Gejala' : 'Tambah Catatan Gejala'}
        subtitle="Deskripsikan keluhan tubuh yang dirasakan"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Gejala / Keluhan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Perut Kembung, Sakit Kepala Tegang, Mual Ringan"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Kejadian</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Intensitas Keluhan (1-10): <span className="text-rose-600 font-bold">{formData.intensity}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.intensity}
              onChange={(e) => setFormData({ ...formData, intensity: Number(e.target.value) })}
              className="w-full accent-rose-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>1: Ringan / Sekadar terasa</span>
              <span>5: Mengganggu fokus</span>
              <span>10: Nyeri parah</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi Gejala</label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
            >
              <option value="Kurang dari 15 Menit">Kurang dari 15 Menit</option>
              <option value="30 Menit">30 Menit</option>
              <option value="1 Jam">1 Jam</option>
              <option value="2 - 4 Jam">2 - 4 Jam</option>
              <option value="Sepanjang Hari">Sepanjang Hari</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Pemicu / Gejala Tambahan</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Contoh: Mulai terasa 40 menit setelah minum kopi hitam perut kosong..."
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
              <span>{editingSymptom ? 'Simpan Perubahan' : 'Catat Gejala'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Catatan Gejala"
        message="Apakah Anda yakin ingin menghapus catatan gejala ini?"
      />
    </div>
  );
};
