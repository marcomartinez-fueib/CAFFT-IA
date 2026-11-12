import React, { useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, PlayCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { getHelpVideoView } from '../services/dataStore';
import { formatDuration } from '../services/helpVideos';
import { HelpVideoPlayer, useHelpVideo } from './HelpVideoPlayer';

interface Props {
  /** The video, e.g. P05. */
  id: string;
  /** Shown under the title, e.g. why the video must be watched. */
  note?: string;
  /** Called when the video plays to the end. */
  onCompleted?: () => void;
  /** Overrides the default: open for a patient who has never started it. */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * A help video on the screen it explains: open the first time, folded
 * afterwards with its length and «Vist» once it has been watched to the end.
 * At the end of the video the card folds and the focus returns to its button.
 */
export const HelpVideoCard: React.FC<Props> = ({ id, note, onCompleted, defaultOpen, className = '' }) => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const video = useHelpVideo(id);
  const view = currentUser ? getHelpVideoView(currentUser.id, id) : null;
  // Staff viewings are not recorded, so for them every visit would be «the first».
  const [open, setOpen] = useState(defaultOpen ?? (currentUser?.role === 'patient' && !view));
  const [watched, setWatched] = useState(!!view?.completedAt);
  const button = useRef<HTMLButtonElement>(null);

  // A card for a video that is not on the server would only be noise.
  if (video === 'missing') return null;

  const handleEnded = () => {
    setWatched(true);
    setOpen(false);
    button.current?.focus();
    onCompleted?.();
  };

  return (
    <div className={`rounded-2xl border border-sky-200 bg-sky-50/60 text-left ${className}`} data-help-video-card={id}>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={`help-video-card-${id}`}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 p-4 sm:px-6 text-left hover:bg-sky-100/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-uib-blue ${open ? 'rounded-t-2xl' : 'rounded-2xl'}`}
      >
        <PlayCircle className="w-7 h-7 flex-shrink-0 text-uib-accent" aria-hidden="true" />
        <span className="flex-grow">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">{t('helpVideos.cardLabel')}</span>
          <span className="font-display font-bold text-uib-blue">{video ? video.title : t('auth.loading')}</span>
          {note && <span className="block text-sm text-slate-600 mt-0.5">{note}</span>}
        </span>
        {watched && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {t('helpVideos.watched')}
          </span>
        )}
        {video && <span className="text-sm text-slate-500 tabular-nums">{formatDuration(video.durationS)}</span>}
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div id={`help-video-card-${id}`} className="px-4 pb-5 pt-1 sm:px-6 sm:pb-6">
          <HelpVideoPlayer id={id} onEnded={handleEnded} />
        </div>
      )}
    </div>
  );
};
