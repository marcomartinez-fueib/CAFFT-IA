import React, { useEffect, useRef, useState } from 'react';
import { useDialog } from '../hooks/useDialog';
import { useLocation } from 'react-router-dom';
import { Star, MessageSquare, AlertCircle, Lightbulb, Users, CheckCircle2, X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../hooks/useUI';
import { saveFeedback } from '../services/dataStore';
import { Feedback } from '../types';

interface FeedbackFormProps {
  /** Type preselected when the form opens. */
  defaultType?: Feedback['type'];
  /** Called after a successful submission. */
  onSubmitted?: () => void;
}

/**
 * The one feedback form: used on the /feedback page and in the launcher shown
 * on every page. Besides what the user writes it sends the page they were on,
 * the app language and the screen size; the server adds the browser and the
 * account.
 */
export const FeedbackForm: React.FC<FeedbackFormProps> = ({ defaultType = 'testimonial', onSubmitted }) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const { pathname } = useLocation();

  const [rating, setRating] = useState<number>(5);
  const [type, setType] = useState<Feedback['type']>(defaultType);
  const [comment, setComment] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // In the dialog on a phone the form scrolls; bring the outcome into view.
  useEffect(() => {
    if (success || error) statusRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [success, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Author and role are taken from the session on the server; the name is
    // only used for guests.
    const saved = await saveFeedback({
      id: crypto.randomUUID(),
      username: currentUser?.username || t('feedback.anonymousUser'),
      type,
      rating,
      comment,
      contact: contact.trim(),
      page: pathname,
      language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });

    if (saved) {
      setSuccess(true);
      setComment('');
      setContact('');
      setRating(5);
      setType(defaultType);
      setTimeout(() => setSuccess(false), 5000);
      onSubmitted?.();
    } else {
      setError(t('feedback.errorMessage'));
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4">
      <div ref={statusRef} className="scroll-mt-20 empty:hidden">
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
              aria-label={`${star}/5`}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-uib-blue rounded transition-transform hover:scale-110 active:scale-95"
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

      {/* Comment */}
      <div className="space-y-3">
        <label htmlFor="feedback-comment" className="block text-sm font-black text-slate-400 uppercase tracking-widest">
          {t('feedback.commentLabel')}
        </label>
        <textarea
          id="feedback-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('feedback.commentPlaceholder')}
          rows={4}
          maxLength={5000}
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-uib-blue focus:ring-0 transition-colors resize-none text-base text-slate-700 placeholder:text-slate-300"
          required
        />
      </div>

      {/* Contact (optional) */}
      <div className="space-y-3">
        <label htmlFor="feedback-contact" className="block text-sm font-black text-slate-400 uppercase tracking-widest">
          {t('feedback.contactLabel')}
        </label>
        <input
          id="feedback-contact"
          type="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={t('feedback.contactPlaceholder')}
          autoComplete="email"
          maxLength={254}
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-uib-blue focus:ring-0 transition-colors text-base text-slate-700 placeholder:text-slate-300"
        />
      </div>

      <p className="text-xs text-slate-400">{t('feedback.contextNotice')}</p>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-uib-blue text-white font-black py-4 rounded-xl uppercase tracking-widest shadow-lg shadow-uib-blue/20 hover:shadow-uib-blue/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        {t('feedback.submitButton')}
      </button>
    </form>
  );
};

/**
 * Tab on the left edge of every page that opens the feedback form in a
 * dialog. Kept on the left so it never covers the assistant button. Hidden on
 * the feedback page itself and, like the assistant, during exposure videos.
 */
export const FeedbackLauncher: React.FC = () => {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const { isAssistantHidden } = useUI();
  const [isOpen, setIsOpen] = useState(false);
  const feedbackDialog = useDialog(() => setIsOpen(false));

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (pathname === '/feedback' || isAssistantHidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        // Rotated half a turn so the text reads bottom to top; hence rounded-l
        // ends up on the visible (right) side. z-30 keeps it under menus,
        // the therapist sidebar and dialogs.
        className="fixed left-0 top-1/2 -translate-y-1/2 rotate-180 z-30 bg-uib-blue text-white px-1.5 py-3 rounded-l-xl shadow-lg hover:bg-uib-blue/90 transition-colors [writing-mode:vertical-rl]"
        aria-label={t('feedback.openButton')}
        title={t('feedback.openButton')}
      >
        <span className="text-[10px] font-black uppercase tracking-widest">{t('feedback.openButton')}</span>
      </button>

      {isOpen && (
        <div ref={feedbackDialog}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            className="bg-white w-full sm:max-w-xl max-h-[90dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 pt-5 pb-2 border-b border-slate-100">
              <h2 id="feedback-dialog-title" className="text-lg font-black text-slate-800 uppercase tracking-tight">
                {t('feedback.pageTitle')}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl"
                aria-label={t('feedback.closeButton')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FeedbackForm defaultType="improvement" />
          </div>
        </div>
      )}
    </>
  );
};
