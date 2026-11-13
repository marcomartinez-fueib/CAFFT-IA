// Every text of the interface in the three languages: Spanish and English
// start as a copy of Catalan (`...caTranslations`), so a text nobody
// translated silently shows in Catalan. This lists, for each language, the
// texts still identical to the Catalan ones, apart from those that are the
// same in every language (names, abbreviations), kept in the list below.
//
//   node --experimental-transform-types scripts/check-translations.ts
//
// Exits with 1 if any is left; CI runs it (see .github/workflows/tests.yml).
import { translations } from '../data/translations.ts';
import { Language } from '../types.ts';

// Texts that are the same as in Catalan on purpose: names, abbreviations,
// and words both languages share. Anything else identical is untranslated.
const SAME_EVERYWHERE = ['appName', 'appNameShort', 'nav.feedback', 'feedback.openButton', 'therapistDashboard.table.rci'];
const SAME_ON_PURPOSE: Record<string, string[]> = {
  es: [
    'common.time.month', 'common.time.hour', 'informedConsent.occupationPTGAS', 'informedConsent.occupationPDI',
    'nav.cafftProgram', 'nav.profile', 'nav.managerDashboard', 'nav.superadminDashboard', 'nav.save', 'home.title.3',
    'cafftProgram.title', 'userGuide.beforeUse.mostFrequent.1', 'helpVideos.variants.esquematica', 'helpVideos.variants.captures',
    'helpVideos.groups.success', 'exposure.videoProgress', 'exposure.ratingHistory', 'evolution.malestarGeneralEvolution',
    'evolution.totalVideos', 'evolution.videosWatched', 'evolution.slopeStable', 'onboarding.prev', 'helpModal.cafftInfo.title',
    'helpModal.therapistInfo.rciTitle', 'aiChat.sendButton', 'aiChat.genderNeutralSuggestions.1', 'aiChat.genderNeutralSuggestions.2',
    'aiChat.genderNeutralSuggestions.3', 'aiChat.saveName', 'therapistDashboard.exportModal.exportButton',
    'therapistDashboard.table.significant_rci', 'therapistDashboard.table.remind', 'therapistDashboard.resetPasswordModal.copyButton',
    'therapistDashboard.exportDataModal.exportButton', 'therapistDashboard.queryLabel', 'patientDetail.rating',
    'superadminDashboard.table.role', 'superadminDashboard.table.parent', 'superadminDashboard.form.role', 'managerDashboard.table.therapist',
    'feedback.pageTitle', 'feedback.types.bug', 'feedback.submitButton', 'general.roles.manager', 'general.roles.therapist',
    'general.roles.superadmin', 'planner.timeFor', 'welcome.continue', 'start.greeting', 'flight.send',
  ],
  en: [
    'common.time.sessions', 'informedConsent.occupationPTGAS', 'informedConsent.occupationPDI', 'informedConsent.sourceWeb',
    'nav.superadminDashboard', 'home.title.3', 'exposure.accidents', 'helpModal.therapistInfo.rciTitle',
    'therapistDashboard.table.sessions', 'patientDetail.rating', 'general.roles.manager', 'general.roles.superadmin',
  ],
};

type Tree = { [key: string]: unknown };

function leaves(node: unknown, path: string[] = [], out = new Map<string, string>()): Map<string, string> {
  if (typeof node === 'string') out.set(path.join('.'), node);
  else if (Array.isArray(node)) node.forEach((v, i) => leaves(v, [...path, String(i)], out));
  else if (node && typeof node === 'object') for (const [k, v] of Object.entries(node as Tree)) leaves(v, [...path, k], out);
  return out;
}

const ca = leaves(translations[Language.CA]);
let missing = 0;
for (const lang of [Language.ES, Language.EN]) {
  const other = leaves(translations[lang]);
  const untranslated = [...ca].filter(([key, text]) => {
    if (!other.has(key)) return true;
    const value = other.get(key)!;
    // Identifiers (…Key) and strings that are only placeholders are not texts.
    if (key.endsWith('Key') || !/\p{L}{3,}/u.test(text.replace(/\{[^}]*\}/g, ''))) return false;
    return value === text && !SAME_EVERYWHERE.includes(key) && !SAME_ON_PURPOSE[lang].includes(key);
  });
  for (const [key, text] of untranslated) console.log(`${lang}\t${key}\t${text.slice(0, 80).replace(/\n/g, ' ')}`);
  console.error(`${lang}: ${untranslated.length} texts still in Catalan`);
  missing += untranslated.length;
}
process.exit(missing > 0 ? 1 : 0);
