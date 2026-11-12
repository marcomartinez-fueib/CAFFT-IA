import React, { useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, PlayCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { getHelpVideoViewsForUser } from '../services/dataStore';
import { formatDuration, resolveHelpVideo } from '../services/helpVideos';
import { HelpVideoPlayer, useHelpVideoCatalog } from './HelpVideoPlayer';

/**
 * The videos by moment of the treatment. Only the diagram versions are
 * listed; the screenshot ones ("c") come with the version selector.
 * `more` marks the "to learn more" videos after P04: the plain P17 first.
 */
type Group = { key: string; items: { id: string; more?: boolean }[] };

const PATIENT_GROUPS: Group[] = [
  { key: 'welcome', items: [{ id: 'P01' }] },
  { key: 'assessment', items: [{ id: 'P03' }] },
  {
    key: 'training',
    items: [
      { id: 'P02' }, { id: 'P04' }, { id: 'P17', more: true }, { id: 'P16', more: true },
      { id: 'P05' }, { id: 'P06' }, { id: 'P07' }, { id: 'P08' }, { id: 'P09' }, { id: 'P10' }, { id: 'P12' },
    ],
  },
  { key: 'results', items: [{ id: 'P13' }] },
  { key: 'success', items: [{ id: 'P14' }, { id: 'P15' }] },
];

const THERAPIST_GROUP: Group = { key: 'therapist', items: [{ id: 'T01' }, { id: 'T02' }, { id: 'T03' }, { id: 'P16' }] };

/** The «Vídeos d'ajuda» library: one card per video, one open at a time. */
export const HelpVideoLibrary: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  const catalog = useHelpVideoCatalog();
  const [openId, setOpenId] = useState<string | null>(null);
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});
  const watched = new Set(
    currentUser ? getHelpVideoViewsForUser(currentUser.id).filter((v) => v.completedAt).map((v) => v.videoId) : [],
  );

  if (catalog === null) return <p className="text-slate-500" aria-busy="true">{t('auth.loading')}</p>;
  if (catalog === 'missing') return <p className="text-slate-500" role="status">{t('helpVideos.noVideos')}</p>;

  const isStaff = currentUser && currentUser.role !== 'patient';
  const groups = isStaff ? [THERAPIST_GROUP, ...PATIENT_GROUPS] : PATIENT_GROUPS;

  // When a video ends its card folds and the focus goes back to its button.
  const close = (id: string) => {
    setOpenId(null);
    buttons.current[id]?.focus();
  };

  return (
    <div className="space-y-10">
      {groups.map((group) => {
        const videos = group.items
          .map((item) => ({ ...item, video: resolveHelpVideo(catalog, item.id, language) }))
          .filter((item) => item.video);
        if (videos.length === 0) return null;
        return (
          <section key={group.key} aria-labelledby={`help-videos-${group.key}`}>
            <h3 id={`help-videos-${group.key}`} className="font-display font-bold text-xl text-uib-blue mb-4">
              {t(`helpVideos.groups.${group.key}`)}
            </h3>
            <ul className="space-y-3">
              {videos.map(({ id, more, video }) => {
                const open = openId === id;
                return (
                  <li key={id} className={`rounded-2xl border bg-white shadow-sm ${more ? 'ml-6 border-dashed border-slate-300' : 'border-slate-200'}`}>
                    <button
                      ref={(el) => { buttons.current[id] = el; }}
                      type="button"
                      aria-expanded={open}
                      aria-controls={`help-video-${id}`}
                      onClick={() => setOpenId(open ? null : id)}
                      className="w-full flex items-center gap-4 p-4 text-left rounded-2xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-uib-blue"
                    >
                      <PlayCircle className="w-8 h-8 flex-shrink-0 text-uib-accent" aria-hidden="true" />
                      <span className="flex-grow">
                        {more && <span className="block text-xs font-bold uppercase tracking-wider text-slate-500">{t('helpVideos.learnMore')}</span>}
                        <span className="font-display font-bold text-uib-blue">{video!.title}</span>
                      </span>
                      {watched.has(id) && (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {t('helpVideos.watched')}
                        </span>
                      )}
                      <span className="text-sm text-slate-500 tabular-nums">{formatDuration(video!.durationS)}</span>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    {open && (
                      <div id={`help-video-${id}`} className="px-4 pb-4">
                        <HelpVideoPlayer id={id} onEnded={() => close(id)} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
};
