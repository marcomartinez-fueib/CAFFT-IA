import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../hooks/useAuth';
import { needsTreatmentConsent } from '../consent';
import { recordHelpVideoView } from '../services/dataStore';
import {
  helpVideoVersions,
  HelpVideoCatalog,
  HelpVideoVariant,
  loadHelpVideoCatalog,
  resolveHelpVideo,
  ResolvedHelpVideo,
  vttToText,
} from '../services/helpVideos';

/** The catalogue: null while loading, 'missing' if it could not be loaded. */
export function useHelpVideoCatalog(): HelpVideoCatalog | null | 'missing' {
  const [catalog, setCatalog] = useState<HelpVideoCatalog | null | 'missing'>(null);
  useEffect(() => {
    let alive = true;
    loadHelpVideoCatalog()
      .then((c) => alive && setCatalog(c))
      .catch(() => alive && setCatalog('missing'));
    return () => { alive = false; };
  }, []);
  return catalog;
}

/** The help video `id` in the user's language: null while loading, 'missing' if unavailable. */
export function useHelpVideo(id: string): ResolvedHelpVideo | null | 'missing' {
  const { language } = useLanguage();
  const catalog = useHelpVideoCatalog();
  if (catalog === null) return null;
  if (catalog === 'missing') return 'missing';
  return resolveHelpVideo(catalog, id, language) ?? 'missing';
}

// Subtitle tracks are labelled in their own language, as players usually do.
const LANGUAGE_NAMES = { ca: 'Català', es: 'Español', en: 'English' } as const;

interface Props {
  /** The video (P06); the player picks the version. */
  id: string;
  /** Called when the video plays to the end. */
  onEnded?: () => void;
  className?: string;
}

/**
 * The single player for the help videos: 16:9 inside the page, never starts
 * by itself, subtitles on by default and a transcript that can be unfolded.
 * Videos with a screenshot version get a «Diagram / Real screen» selector;
 * the choice is kept in the patient's profile and applies to all of them.
 * A patient's viewings are recorded (services/dataStore.ts).
 */
export const HelpVideoPlayer: React.FC<Props> = ({ id, onEnded, className = '' }) => {
  const { t, language } = useLanguage();
  const { currentUser, updateUser } = useAuth();
  const catalog = useHelpVideoCatalog();
  const [localVariant, setLocalVariant] = useState<HelpVideoVariant>('esquematica');
  const [failed, setFailed] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const wasPlaying = useRef(false);

  const isPatient = currentUser?.role === 'patient';
  const variant = (isPatient ? currentUser?.helpVideoVariant : localVariant) ?? 'esquematica';
  const versions = catalog && catalog !== 'missing' ? helpVideoVersions(catalog, id, language) : null;
  const video = catalog && catalog !== 'missing' ? resolveHelpVideo(catalog, versions ? versions[variant] : id, language) : null;

  useEffect(() => {
    setFailed(false);
    setTranscript(null);
  }, [video?.src]);

  if (catalog === null) {
    return <div className={`aspect-video w-full rounded-lg bg-slate-100 animate-pulse ${className}`} aria-busy="true" />;
  }
  if (!video || failed) {
    return (
      <div className={`aspect-video w-full rounded-lg bg-slate-100 flex items-center justify-center p-6 text-center text-slate-600 ${className}`} role="status">
        {t('helpVideos.unavailable')}
      </div>
    );
  }

  const chooseVariant = (next: HelpVideoVariant) => {
    if (next === variant) return;
    if (isPatient) void updateUser({ helpVideoVariant: next });
    else setLocalVariant(next);
  };

  const loadTranscript = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || transcript !== null) return;
    fetch(video.subtitles)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((vtt) => setTranscript(vttToText(vtt)))
      .catch(() => setTranscript(''));
  };

  const labels = (catalog !== 'missing' && catalog.selector_versions?.etiquetes?.[language]) || {
    esquematica: t('helpVideos.variants.esquematica'),
    captures: t('helpVideos.variants.captures'),
  };

  return (
    <div className={className}>
      {versions && (
        <div role="radiogroup" aria-label={t('helpVideos.versionLabel')} className="mb-2 inline-flex rounded-full border border-slate-300 bg-white p-1 text-sm">
          {(['esquematica', 'captures'] as const).map((v) => (
            <label key={v} className={`cursor-pointer rounded-full px-4 py-1.5 font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-uib-blue ${variant === v ? 'bg-uib-blue text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
              <input type="radio" name={`help-video-version-${id}`} value={v} checked={variant === v} onChange={() => chooseVariant(v)} className="sr-only" />
              {labels[v]}
            </label>
          ))}
        </div>
      )}
      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow">
        <TrackedVideo
          key={video.src}
          video={video}
          track={isPatient && !needsTreatmentConsent(currentUser) ? currentUser!.id : null}
          autoPlay={wasPlaying.current}
          onPlayingChange={(playing) => { wasPlaying.current = playing; }}
          onEnded={onEnded}
          onError={() => setFailed(true)}
        >
          {t('exposure.videoTagNotSupported')}
        </TrackedVideo>
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

interface TrackedVideoProps {
  video: ResolvedHelpVideo;
  /** The patient whose viewing is recorded, or null. */
  track: string | null;
  /** Only after switching versions while playing: the new one carries on. */
  autoPlay: boolean;
  onPlayingChange: (playing: boolean) => void;
  onEnded?: () => void;
  onError: () => void;
  children: React.ReactNode;
}

/**
 * One viewing of one version. It reports when it starts, when it ends, and,
 * if it is closed or swapped before the end, how far it got.
 */
const TrackedVideo: React.FC<TrackedVideoProps> = ({ video, track, autoPlay, onPlayingChange, onEnded, onError, children }) => {
  const viewing = useRef({ started: false, completed: false, percent: 0 });
  const report = (extra: { percent: number; completed: boolean; newView: boolean }) => {
    if (track) recordHelpVideoView(track, { videoId: video.videoId, versionId: video.id, ...extra });
  };
  const reportRef = useRef(report);
  reportRef.current = report;

  useEffect(() => () => {
    const v = viewing.current;
    if (v.started && !v.completed) reportRef.current({ percent: v.percent, completed: false, newView: false });
  }, []);

  return (
    // Informational video: unlike the exposure videos, the patient is free
    // to pause and seek, so the native controls stay.
    <video
      className="w-full h-full"
      controls
      playsInline
      autoPlay={autoPlay}
      preload="metadata"
      src={video.src}
      poster={video.poster}
      title={video.title}
      data-help-video={video.id}
      onPlay={() => {
        onPlayingChange(true);
        if (viewing.current.started) return;
        viewing.current.started = true;
        report({ percent: 0, completed: false, newView: true });
      }}
      onPause={() => onPlayingChange(false)}
      onTimeUpdate={(e) => {
        const el = e.currentTarget;
        if (el.duration > 0) viewing.current.percent = Math.max(viewing.current.percent, (el.currentTime / el.duration) * 100);
      }}
      onEnded={() => {
        onPlayingChange(false);
        viewing.current = { started: true, completed: true, percent: 100 };
        report({ percent: 100, completed: true, newView: false });
        onEnded?.();
      }}
      onError={onError}
    >
      <track kind="subtitles" src={video.subtitles} srcLang={video.lang} label={LANGUAGE_NAMES[video.lang]} default />
      {children}
    </video>
  );
};
