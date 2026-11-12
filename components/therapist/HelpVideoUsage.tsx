import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { getHelpVideoViewsForUser } from '../../services/dataStore';
import { resolveHelpVideo } from '../../services/helpVideos';
import { useHelpVideoCatalog } from '../HelpVideoPlayer';

const DATE_LOCALES = { ca: 'ca-ES', es: 'es-ES', en: 'en-US' } as const;

/** The help videos a patient has opened, newest first: how far, and whether to the end. */
export const HelpVideoUsage: React.FC<{ patientId: string }> = ({ patientId }) => {
  const { t, language } = useLanguage();
  const catalog = useHelpVideoCatalog();
  const views = getHelpVideoViewsForUser(patientId).sort((a, b) => b.lastAt - a.lastAt);

  if (views.length === 0) {
    return <p className="text-gray-500 text-center py-4 text-sm">{t('patientDetail.helpVideosNone')}</p>;
  }

  const title = (versionId: string) =>
    (catalog && catalog !== 'missing' && resolveHelpVideo(catalog, versionId, language)?.title) || versionId;

  return (
    <ul className="divide-y divide-slate-100">
      {views.map((v) => (
        <li key={v.videoId} className="flex items-center gap-3 py-2 text-sm">
          <span className="w-10 font-mono text-xs text-slate-400">{v.videoId}</span>
          <span className="flex-grow text-slate-800">
            {title(v.versionId)}
            {v.versionId !== v.videoId && <span className="ml-2 text-xs text-slate-500">({t('helpVideos.variants.captures')})</span>}
          </span>
          {v.completedAt ? (
            <span className="inline-flex items-center gap-1 text-green-700 font-medium">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {t('helpVideos.watched')}
            </span>
          ) : (
            <span className="text-amber-700">{t('patientDetail.helpVideosPartial', { percent: v.maxPercent })}</span>
          )}
          <span className="w-24 text-right text-xs text-slate-400">{new Date(v.lastAt).toLocaleDateString(DATE_LOCALES[language])}</span>
        </li>
      ))}
    </ul>
  );
};
