import { Language } from '../types';
import { resolveVideoUrl } from '../utils/videoUrl';

/**
 * The help videos ("píndoles") and their catalogue, as the team delivers them:
 * videos_cafft/cataleg.json plus one file per video and language in
 * videos_cafft/ajuda/. They live on the server next to the exposure videos,
 * not in the repository, so the team can replace a file without a deploy.
 */

type Lang = `${Language}`;

export interface HelpVideoFiles {
  video: string;
  subtitols: string;
  poster: string;
  durada_s: number;
}

export interface HelpVideoEntry {
  id: string;
  variant: 'esquematica' | 'captures';
  rol: 'pacient' | 'terapeuta';
  titol: Partial<Record<Lang, string>>;
  obligatoria: boolean;
  llengues: Lang[];
  fitxers: Partial<Record<Lang, HelpVideoFiles>>;
  grup_versions?: string | null;
}

export type HelpVideoVariant = HelpVideoEntry['variant'];

export interface HelpVideoCatalog {
  versio: string;
  pindoles: HelpVideoEntry[];
  selector_versions?: { etiquetes?: Partial<Record<Lang, Record<HelpVideoVariant, string>>> };
}

/** A video ready to play in one language. */
export interface ResolvedHelpVideo {
  /** The version: P06, or P06c for the one with screenshots. */
  id: string;
  /** The video both versions belong to: P06. */
  videoId: string;
  title: string;
  /** The language of the audio; Catalan when the patient's is missing. */
  lang: Lang;
  src: string;
  subtitles: string;
  poster: string;
  durationS: number;
}

const CATALOG_PATH = 'videos_cafft/cataleg.json';
const FILES_DIR = 'videos_cafft/ajuda/';

let catalogPromise: Promise<HelpVideoCatalog> | null = null;

/** The catalogue, fetched once per page load. A failed fetch is retried on the next call. */
export function loadHelpVideoCatalog(): Promise<HelpVideoCatalog> {
  catalogPromise ??= fetch(resolveVideoUrl(CATALOG_PATH))
    .then((res) => {
      if (!res.ok) throw new Error(`help video catalogue: HTTP ${res.status}`);
      return res.json() as Promise<HelpVideoCatalog>;
    })
    .catch((err) => {
      catalogPromise = null;
      throw err;
    });
  return catalogPromise;
}

/**
 * The video `id` in `lang`. The catalogue's rule: when a language is missing,
 * the Catalan version plays (its subtitles are Catalan too, as there are no
 * others timed to it).
 */
export function resolveHelpVideo(catalog: HelpVideoCatalog, id: string, lang: Lang): ResolvedHelpVideo | null {
  const entry = catalog.pindoles.find((p) => p.id === id);
  if (!entry) return null;
  const playLang: Lang = entry.fitxers[lang] ? lang : 'ca';
  const files = entry.fitxers[playLang];
  if (!files) return null;
  return {
    id,
    videoId: entry.grup_versions ?? entry.id,
    title: entry.titol[lang] ?? entry.titol.ca ?? id,
    lang: playLang,
    src: resolveVideoUrl(FILES_DIR + files.video),
    subtitles: resolveVideoUrl(FILES_DIR + files.subtitols),
    poster: resolveVideoUrl(FILES_DIR + files.poster),
    durationS: files.durada_s,
  };
}

/**
 * The ids of both versions of video `id` when the patient can choose: only if
 * it has a screenshot version and both exist in their language.
 */
export function helpVideoVersions(catalog: HelpVideoCatalog, id: string, lang: Lang): Record<HelpVideoVariant, string> | null {
  const diagram = catalog.pindoles.find((p) => p.id === id);
  const screenshots = catalog.pindoles.find((p) => p.grup_versions === id && p.variant === 'captures');
  if (!diagram?.fitxers[lang] || !screenshots?.fitxers[lang]) return null;
  return { esquematica: diagram.id, captures: screenshots.id };
}

/** The spoken text of a WebVTT file, cue after cue, for the transcript. */
export function vttToText(vtt: string): string {
  return vtt
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .filter((block) => block.includes('-->'))
    .map((block) => {
      const lines = block.split('\n');
      const text = lines.slice(lines.findIndex((l) => l.includes('-->')) + 1).join(' ');
      return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    })
    .filter(Boolean)
    .join(' ');
}

/** «1:05» for 65 s. */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
