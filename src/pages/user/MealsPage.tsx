import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  Search,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { Meal } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.tsx';

export const MealsPage: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedMealId, setExpandedMealId] = useState<number | null>(null);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toTimeString().substring(0, 5);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Makan Siang',
    portion: 'Sedang (1 Porsi)',
    date: todayStr,
    time: nowTimeStr,
    imageUrl: '',
    notes: '',
    // Pre-meal
    preMeal: {
      hungerLevel: 7,
      energy: 6,
      mood: 'Baik',
      stomachCondition: 'Normal',
      bodyCondition: 'Segar',
      notes: '',
    },
    // Post-meal
    postMeal: {
      energy: 8,
      mood: 'Baik',
      fullnessLevel: 7,
      stomachCondition: 'Nyaman',
      isSleepy: false,
      isNauseous: false,
      isBloated: false,
      discomfortLevel: 0,
      notes: '',
    },
  });

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<Meal[]>('/api/meals');
      setMeals(res || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const openCreateModal = () => {
    setEditingMeal(null);
    setFormData({
      name: '',
      category: 'Makan Siang',
      portion: 'Sedang (1 Porsi)',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().substring(0, 5),
      imageUrl: '',
      notes: '',
      preMeal: {
        hungerLevel: 7,
        energy: 6,
        mood: 'Baik',
        stomachCondition: 'Normal',
        bodyCondition: 'Segar',
        notes: '',
      },
      postMeal: {
        energy: 8,
        mood: 'Baik',
        fullnessLevel: 7,
        stomachCondition: 'Nyaman',
        isSleepy: false,
        isNauseous: false,
        isBloated: false,
        discomfortLevel: 0,
        notes: '',
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      name: meal.name,
      category: meal.category,
      portion: meal.portion,
      date: meal.date,
      time: meal.time,
      imageUrl: meal.imageUrl || '',
      notes: meal.notes || '',
      preMeal: meal.preMeal
        ? {
            hungerLevel: meal.preMeal.hungerLevel,
            energy: meal.preMeal.energy,
            mood: meal.preMeal.mood,
            stomachCondition: meal.preMeal.stomachCondition,
            bodyCondition: meal.preMeal.bodyCondition,
            notes: meal.preMeal.notes || '',
          }
        : {
            hungerLevel: 7,
            energy: 6,
            mood: 'Baik',
            stomachCondition: 'Normal',
            bodyCondition: 'Segar',
            notes: '',
          },
      postMeal: meal.postMeal
        ? {
            energy: meal.postMeal.energy,
            mood: meal.postMeal.mood,
            fullnessLevel: meal.postMeal.fullnessLevel,
            stomachCondition: meal.postMeal.stomachCondition,
            isSleepy: meal.postMeal.isSleepy,
            isNauseous: meal.postMeal.isNauseous,
            isBloated: meal.postMeal.isBloated,
            discomfortLevel: meal.postMeal.discomfortLevel,
            notes: meal.postMeal.notes || '',
          }
        : {
            energy: 8,
            mood: 'Baik',
            fullnessLevel: 7,
            stomachCondition: 'Nyaman',
            isSleepy: false,
            isNauseous: false,
            isBloated: false,
            discomfortLevel: 0,
            notes: '',
          },
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingMeal) {
        await apiRequest(`/api/meals/${editingMeal.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });

        // Update pre-meal if exists
        if (editingMeal.preMeal) {
          await apiRequest(`/api/pre-meal/${editingMeal.preMeal.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              ...formData.preMeal,
              date: formData.date,
              time: formData.time,
            }),
          });
        }
        // Update post-meal if exists
        if (editingMeal.postMeal) {
          await apiRequest(`/api/post-meal/${editingMeal.postMeal.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              ...formData.postMeal,
              date: formData.date,
              time: formData.time,
            }),
          });
        }

        setToastMessage('Catatan makanan dan respon pencernaan berhasil diperbarui!');
      } else {
        await apiRequest('/api/meals', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        setToastMessage('Makanan & evaluasi respon tubuh berhasil dicatat!');
      }
      setIsModalOpen(false);
      fetchMeals();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan catatan makanan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await apiRequest(`/api/meals/${deletingId}`, { method: 'DELETE' });
      setToastMessage('Catatan makanan berhasil dihapus!');
      setDeletingId(null);
      fetchMeals();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus makanan');
    }
  };

  // Quick Food Effect Checker Modal State
  const [isEffectModalOpen, setIsEffectModalOpen] = useState(false);
  const [effectFoodName, setEffectFoodName] = useState('');
  const [effectPortion, setEffectPortion] = useState('Sedang (1 Porsi)');
  const [effectDrink, setEffectDrink] = useState('Air Putih Hangat');
  const [effectResult, setEffectResult] = useState<any | null>(null);
  const [effectLoading, setEffectLoading] = useState(false);

  const handleCheckFoodEffect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectFoodName.trim()) return;
    setEffectLoading(true);
    try {
      const res = await apiRequest('/api/public/food-effect', {
        method: 'POST',
        body: JSON.stringify({
          foodName: effectFoodName,
          portion: effectPortion,
          drinkNotes: effectDrink,
        }),
      });
      setEffectResult(res);
    } catch (err: any) {
      alert(err.message || 'Gagal menganalisis makanan');
    } finally {
      setEffectLoading(false);
    }
  };

  const filteredMeals = meals.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      m.date.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <Utensils className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Data Makanan & Efek Nutrisi</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Catat porsi makan, kondisi lapar sebelum makan, dan respons perut setelah makan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEffectResult(null);
              setEffectFoodName('');
              setIsEffectModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Cek Efek Makanan</span>
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Menu Makanan</span>
          </button>
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

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari makanan atau kategori..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">
          Total {filteredMeals.length} Makanan
        </span>
      </div>

      {/* Meals List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Memuat catatan makanan...</div>
      ) : filteredMeals.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80">
          <Utensils className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Belum ada makanan yang dicatat</p>
          <p className="text-xs text-slate-400 mt-1">Mulai catat makanan Anda untuk melihat korelasi terhadap kenyang & kembung.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeals.map((meal) => {
            const isExpanded = expandedMealId === meal.id;
            return (
              <div
                key={meal.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all hover:border-slate-300"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold shrink-0">
                      {meal.imageUrl ? (
                        <img src={meal.imageUrl} alt={meal.name} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <Utensils className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{meal.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {meal.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {meal.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {meal.time}
                        </span>
                        <span>• Porsi: {meal.portion}</span>
                      </div>
                      {meal.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic font-normal">"{meal.notes}"</p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Expand */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      onClick={() => setExpandedMealId(isExpanded ? null : meal.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Respon Tubuh</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => openEditModal(meal)}
                      className="p-2 rounded-xl text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                      title="Edit Makanan"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingId(meal.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus Makanan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pre & Post Meal Condition Accordion Details */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-100 p-5 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                    {/* Pre-meal Card */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          Kondisi Sebelum Makan
                        </span>
                        {meal.preMeal && (
                          <span className="text-[10px] text-slate-400">Tercatat</span>
                        )}
                      </div>
                      {meal.preMeal ? (
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p>
                            <span className="text-slate-400">Tingkat Lapar:</span>{' '}
                            <span className="font-bold text-amber-600">{meal.preMeal.hungerLevel}/10</span>
                          </p>
                          <p>
                            <span className="text-slate-400">Energi Awal:</span>{' '}
                            <span className="font-semibold">{meal.preMeal.energy}/10</span>
                          </p>
                          <p>
                            <span className="text-slate-400">Mood:</span>{' '}
                            <span className="font-semibold">{meal.preMeal.mood}</span>
                          </p>
                          <p>
                            <span className="text-slate-400">Kondisi Perut:</span>{' '}
                            <span className="font-semibold">{meal.preMeal.stomachCondition}</span>
                          </p>
                          {meal.preMeal.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-1">"{meal.preMeal.notes}"</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Tidak ada catatan sebelum makan</p>
                      )}
                    </div>

                    {/* Post-meal Card */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-teal-500" />
                          Kondisi Setelah Makan (Respon)
                        </span>
                        {meal.postMeal && (
                          <span className="text-[10px] text-slate-400">Tercatat</span>
                        )}
                      </div>
                      {meal.postMeal ? (
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p>
                            <span className="text-slate-400">Rasa Kenyang:</span>{' '}
                            <span className="font-bold text-teal-600">{meal.postMeal.fullnessLevel}/10</span>
                          </p>
                          <p>
                            <span className="text-slate-400">Energi Pasca Makan:</span>{' '}
                            <span className="font-semibold">{meal.postMeal.energy}/10</span>
                          </p>
                          <p>
                            <span className="text-slate-400">Kondisi Perut:</span>{' '}
                            <span className="font-semibold">{meal.postMeal.stomachCondition}</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {meal.postMeal.isBloated && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Perut Kembung
                              </span>
                            )}
                            {meal.postMeal.isNauseous && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                Mual
                              </span>
                            )}
                            {meal.postMeal.isSleepy && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                Mengantuk Berat
                              </span>
                            )}
                            {!meal.postMeal.isBloated && !meal.postMeal.isNauseous && !meal.postMeal.isSleepy && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Nyaman Tanpa Keluhan
                              </span>
                            )}
                          </div>
                          {meal.postMeal.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-1">"{meal.postMeal.notes}"</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Tidak ada catatan respon setelah makan</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMeal ? 'Edit Data Makanan & Respon' : 'Catat Makanan Baru'}
        subtitle="Pantau makanan dan efek pencernaannya pada tubuh Anda"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section 1: Data Makanan Utama */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">1. Informasi Menu Makanan</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Makanan / Minuman <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Nasi Merah + Ayam Bakar + Tumis Kangkung"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Sarapan">Sarapan</option>
                    <option value="Makan Siang">Makan Siang</option>
                    <option value="Makan Malam">Makan Malam</option>
                    <option value="Snack / Camilan">Snack / Camilan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Porsi</label>
                  <select
                    value={formData.portion}
                    onChange={(e) => setFormData({ ...formData, portion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Kecil (Setengah Porsi)">Kecil (Setengah Porsi)</option>
                    <option value="Sedang (1 Porsi)">Sedang (1 Porsi)</option>
                    <option value="Besar (Porsi Banyak)">Besar (Porsi Banyak)</option>
                    <option value="Camilan Ringan">Camilan Ringan</option>
                  </select>
                </div>

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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Waktu Makan</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Menu / Bahan</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Menggunakan minyak zaitun sedikit, agak pedas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Kondisi Sebelum Makan */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100">
            <h4 className="text-xs font-bold text-amber-900 mb-3">2. Kondisi Sebelum Makan</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Rasa Lapar: <span className="text-amber-700 font-bold">{formData.preMeal.hungerLevel}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.preMeal.hungerLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preMeal: { ...formData.preMeal, hungerLevel: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-amber-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Energi Awal: <span className="font-bold">{formData.preMeal.energy}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.preMeal.energy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preMeal: { ...formData.preMeal, energy: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-slate-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mood Sebelum Makan</label>
                <select
                  value={formData.preMeal.mood}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preMeal: { ...formData.preMeal, mood: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="Baik">Baik</option>
                  <option value="Netral">Netral</option>
                  <option value="Lelah">Lelah</option>
                  <option value="Cemas">Cemas</option>
                  <option value="Sangat Lapar">Sangat Lapar</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kondisi Perut</label>
                <select
                  value={formData.preMeal.stomachCondition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      preMeal: { ...formData.preMeal, stomachCondition: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="Sedikit Perih">Sedikit Perih</option>
                  <option value="Begah">Begah</option>
                  <option value="Kosong Keroncongan">Kosong Keroncongan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Kondisi Setelah Makan */}
          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100">
            <h4 className="text-xs font-bold text-teal-900 mb-3">3. Respon Tubuh Setelah Makan</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Rasa Kenyang: <span className="text-teal-700 font-bold">{formData.postMeal.fullnessLevel}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.postMeal.fullnessLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      postMeal: { ...formData.postMeal, fullnessLevel: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Energi Pasca: <span className="font-bold">{formData.postMeal.energy}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.postMeal.energy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      postMeal: { ...formData.postMeal, energy: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-teal-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Kondisi Perut</label>
                <select
                  value={formData.postMeal.stomachCondition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      postMeal: { ...formData.postMeal, stomachCondition: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="Nyaman">Nyaman</option>
                  <option value="Begah Sedang">Begah Sedang</option>
                  <option value="Kembung">Kembung</option>
                  <option value="Mual">Mual</option>
                  <option value="Perih">Perih</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mood Setelah Makan</label>
                <select
                  value={formData.postMeal.mood}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      postMeal: { ...formData.postMeal, mood: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="Sangat Puas">Sangat Puas</option>
                  <option value="Baik">Baik</option>
                  <option value="Netral">Netral</option>
                  <option value="Tidak Nyaman">Tidak Nyaman</option>
                </select>
              </div>
            </div>

            {/* Checkbox Keluhan */}
            <div className="flex flex-wrap gap-4 pt-2 border-t border-teal-100">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.postMeal.isBloated}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      postMeal: { ...formData.postMeal, isBloated: e.target.checked },
                    })
                  }
                  className="rounded text-teal-600"
                />
                <span>Perut Kembung</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.postMeal.isNauseous}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      postMeal: { ...formData.postMeal, isNauseous: e.target.checked },
                    })
                  }
                  className="rounded text-teal-600"
                />
                <span>Mual</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.postMeal.isSleepy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      postMeal: { ...formData.postMeal, isSleepy: e.target.checked },
                    })
                  }
                  className="rounded text-teal-600"
                />
                <span>Mengantuk Berat (Food Coma)</span>
              </label>
            </div>
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
              <span>{editingMeal ? 'Simpan Perubahan' : 'Simpan Catatan Makanan'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Hapus Catatan Makanan"
        message="Apakah Anda yakin ingin menghapus catatan makanan ini beserta riwayat respon tubuhnya?"
      />

      {/* Quick Food Effect Analysis Modal */}
      <Modal
        isOpen={isEffectModalOpen}
        onClose={() => setIsEffectModalOpen(false)}
        title="Cek Efek & Keterangan Kesehatan Makanan"
        subtitle="Analisis prediktif beban lambung, waktu cerna, dan respon gula darah"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <form onSubmit={handleCheckFoodEffect} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Makanan apa yang Anda makan / ingin Anda makan? *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={effectFoodName}
                  onChange={(e) => setEffectFoodName(e.target.value)}
                  placeholder="Contoh: Nasi Padang Rendang, Mie Instan Pedas, Oatmeal..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  required
                />
                <button
                  type="submit"
                  disabled={effectLoading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors shrink-0 disabled:opacity-60"
                >
                  {effectLoading ? 'Menganalisis...' : 'Analisis Efek'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Porsi</label>
                <select
                  value={effectPortion}
                  onChange={(e) => setEffectPortion(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="Kecil (Setengah Porsi)">Kecil</option>
                  <option value="Sedang (1 Porsi)">Sedang (1 Porsi)</option>
                  <option value="Besar (Porsi Banyak)">Besar / Jumbo</option>
                  <option value="Camilan">Camilan</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Minuman</label>
                <select
                  value={effectDrink}
                  onChange={(e) => setEffectDrink(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                >
                  <option value="Air Putih Hangat">Air Putih Hangat</option>
                  <option value="Air Es Dingin">Air Es Dingin</option>
                  <option value="Es Teh Manis">Es Teh Manis</option>
                  <option value="Kopi">Kopi</option>
                  <option value="Soda / Manis">Soda / Manis</option>
                </select>
              </div>
            </div>
          </form>

          {/* Results display */}
          {effectResult && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-900">{effectResult.foodName}</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  effectResult.stomachImpactType === 'ALERT'
                    ? 'bg-rose-100 text-rose-800'
                    : effectResult.stomachImpactType === 'WARNING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {effectResult.stomachImpact}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Waktu Pencernaan</span>
                  <span className="font-bold text-slate-800">{effectResult.digestionTime}</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block">Dampak Glikemik</span>
                  <span className="font-bold text-amber-700">{effectResult.glycemicImpact}</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">
                  Efek yang Akan Terjadi pada Tubuh:
                </span>
                <ul className="space-y-1 text-xs text-slate-600">
                  {effectResult.effects.map((eff: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{eff}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-[11px] font-bold text-teal-800 block mb-1">
                  Keterangan Kesehatan & Tindakan Disarankan:
                </span>
                <ul className="space-y-1 text-xs text-teal-950">
                  {effectResult.healthAdvice.map((adv: string, i: number) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    // pre-fill create modal with this food
                    setIsEffectModalOpen(false);
                    setFormData((prev) => ({
                      ...prev,
                      name: effectResult.foodName,
                      portion: effectPortion,
                    }));
                    setIsModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors"
                >
                  Catat Makanan Ini ke Jurnal Saya →
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
