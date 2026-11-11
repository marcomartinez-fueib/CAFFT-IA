import React, { useEffect, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { loadHelpVideoCatalog, resolveHelpVideo, ResolvedHelpVideo, vttToText } from '../services/helpVideos';

/** The help video `id` in the user's language: null while loading, 'missing' if unavailable. */
export function useHelpVideo(id: string): ResolvedHelpVideo | null | 'missing' {
  const { language } = useLanguage();
  const [video, setVideo] = useState<ResolvedHelpVideo | null | 'missing'>(null);
  useEffect(() => {
    let alive = true;
    loadHelpVideoCatalog()
      .then((catalog) => alive && setVideo(resolveHelpVideo(catalog, id, language) ?? 'missing'))
      .catch(() => alive && setVideo('missing'));
    return () => { alive = false; };
  }, [id, language]);
  return video;
}

// Subtitle tracks are labelled in their own language, as players usually do.
const LANGUAGE_NAMES = { ca: 'Català', es: 'Español', en: 'English' } as const;

interface Props {
  id: string;
  /** Called when the video plays to the end. */
  onEnded?: () => void;
  className?: string;
}

/**
 * The single player for the help videos: 16:9 inside the page, never starts
 * by itself, subtitles on by default and a transcript that can be unfolded.
 */
export const HelpVideoPlayer: React.FC<Props> = ({ id, onEnded, className = '' }) => {
  const { t } = useLanguage();
  const video = useHelpVideo(id);
  const [failed, setFailed] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);

  useEffect(() => {
    setFailed(false);
    setTranscript(null);
  }, [video]);

  const loadTranscript = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || transcript !== null || !video || video === 'missing') return;
    fetch(video.subtitles)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((vtt) => setTranscript(vttToText(vtt)))
      .catch(() => setTranscript(''));
  };

  if (video === null) {
    return <div className={`aspect-video w-full rounded-lg bg-slate-100 animate-pulse ${className}`} aria-busy="true" />;
  }
  if (video === 'missing' || failed) {
    return (
      <div className={`aspect-video w-full rounded-lg bg-slate-100 flex items-center justify-center p-6 text-center text-slate-600 ${className}`} role="status">
        {t('helpVideos.unavailable')}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow">
        {/* Informational video: unlike the exposure videos, the patient is
            free to pause and seek, so the native controls stay. */}
        <video
          key={video.src}
          className="w-full h-full"
          controls
          playsInline
          preload="metadata"
          src={video.src}
          poster={video.poster}
          title={video.title}
          onEnded={onEnded}
          onError={() => setFailed(true)}
          data-help-video={video.id}
        >
          <track kind="subtitles" src={video.subtitles} srcLang={video.lang} label={LANGUAGE_NAMES[video.lang]} default />
          {t('exposure.videoTagNotSupported')}
        </video>
      </div>
      <details className="mt-2 text-sm text-slate-700" onToggle={loadTranscript}>
        <summary className="cursor-pointer font-medium text-uib-blue hover:underline w-fit">{t('helpVideos.transcript')}</summary>
        <p className="mt-2 leading-relaxed" lang={video.lang}>
          {transcript === null ? t('auth.loading') : transcript || t('helpVideos.transcriptUnavailable')}
        </p>
      </details>
    </div>
  );
};
