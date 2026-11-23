import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, User, Search, Sparkles } from 'lucide-react';
import { apiRequest } from '../../lib/api.ts';
import { EducationArticle } from '../../types/index.ts';
import { Modal } from '../../components/ui/Modal.tsx';

export const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<EducationArticle | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const res = await apiRequest<EducationArticle[]>('/api/admin/articles');
        setArticles(res.filter((a) => a.isPublished));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.summary.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Edukasi & Wawasan Nutrisi</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Panduan medis terpercaya seputar kesehatan lambung, pola tidur, dan metabolisme harian.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari artikel kesehatan..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400">Memuat artikel edukasi...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">Belum ada artikel ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedArticle(item)}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100">
                    {item.category}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.readTime}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3">
                  {item.summary}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-600">
                  <User className="w-3.5 h-3.5" /> {item.author}
                </span>
                <span className="text-teal-600 font-bold group-hover:underline">Baca Selengkapnya →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reader Modal */}
      {selectedArticle && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedArticle(null)}
          title={selectedArticle.title}
          subtitle={`Ditulis oleh ${selectedArticle.author} • ${selectedArticle.readTime}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100">
              Kategori: {selectedArticle.category}
            </span>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700 italic">
              "{selectedArticle.summary}"
            </div>

            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-normal space-y-2">
              {selectedArticle.content}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
