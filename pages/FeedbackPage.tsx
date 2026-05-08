import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, MessageSquare, AlertCircle, Lightbulb, Users, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { saveFeedback, getAllFeedback } from '../utils/localStorageDB';
import { Feedback } from '../types';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';

export const FeedbackPage: React.FC = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  
  const [rating, setRating] = useState<number>(5);
  const [type, setType] = useState<Feedback['type']>('testimonial');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testimonials, setTestimonials] = useState<Feedback[]>([]);

  useEffect(() => {
    const feedback = getAllFeedback();
    const sortedTestimonials = feedback
      .filter(f => f.type === 'testimonial')
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
    setTestimonials(sortedTestimonials);
  }, [success]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const feedback: Feedback = {
      id: Math.random().toString(36).substring(2, 9),
      userId: currentUser?.id || 'guest',
      username: currentUser?.username || t('feedback.anonymousUser'),
      userType: currentUser ? (currentUser.role === 'therapist' ? 'therapist' : 'patient') : 'guest',
      type,
      rating,
      comment,
      timestamp: Date.now(),
      status: 'new'
    };

    const saved = saveFeedback(feedback);
    
    if (saved) {
      setSuccess(true);
      setComment('');
      setRating(5);
      setType('testimonial');
      setTimeout(() => setSuccess(false), 5000);
    } else {
      setError(t('feedback.errorMessage'));
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageTitle title={t('feedback.pageTitle')} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard>
            <form onSubmit={handleSubmit} className="space-y-6 p-4">
              {success && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-3 border border-green-200 animate-in fade-in slide-in-from-top-4 duration-300">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{t('feedback.successMessage')}</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-3 border border-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Rating */}
              <div className="space-y-3">
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">
                  {t('feedback.ratingLabel')}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div className="space-y-3">
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">
                  {t('feedback.typeLabel')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { val: 'testimonial', icon: Users, label: t('feedback.types.testimonial') },
                    { val: 'improvement', icon: Lightbulb, label: t('feedback.types.improvement') },
                    { val: 'bug', icon: AlertCircle, label: t('feedback.types.bug') },
                    { val: 'other', icon: MessageSquare, label: t('feedback.types.other') },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setType(item.val as Feedback['type'])}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2 ${
                        type === item.val
                          ? 'border-uib-blue bg-uib-blue/5 text-uib-blue'
                          : 'border-slate-100 hover:border-slate-200 text-slate-500'
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-center">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="space-y-3">
                <label htmlFor="comment" className="block text-sm font-black text-slate-400 uppercase tracking-widest">
                  {t('feedback.commentLabel')}
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t('feedback.commentPlaceholder')}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-uib-blue focus:ring-0 transition-colors resize-none text-slate-700 placeholder:text-slate-300"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-uib-blue text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-uib-blue/20 hover:shadow-uib-blue/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {t('feedback.submitButton')}
              </button>
            </form>
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
