import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Users } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { fetchTestimonials } from '../services/dataStore';
import { Feedback } from '../types';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { FeedbackForm } from '../components/FeedbackForm';

export const FeedbackPage: React.FC = () => {
  const { t } = useLanguage();
  
  const [testimonials, setTestimonials] = useState<Feedback[]>([]);
  const [submissions, setSubmissions] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // The server returns the 5 latest testimonials, newest first.
    fetchTestimonials().then(list => { if (!cancelled) setTestimonials(list); });
    return () => { cancelled = true; };
  }, [submissions]);

  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle title={t('feedback.pageTitle')} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard>
            <FeedbackForm onSubmitted={() => setSubmissions(n => n + 1)} />
          </SectionCard>
        </div>

        {/* Testimonials Sidebar */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight ml-2">
            {t('feedback.recentTestimonialsTitle')}
          </h3>
          <div className="space-y-4">
            {testimonials.length > 0 ? (
              testimonials.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < item.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-slate-600 italic text-sm mb-4">"{item.comment}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      — {item.username}
                    </span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center">
                <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-medium">No hi ha testimonis encara.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
