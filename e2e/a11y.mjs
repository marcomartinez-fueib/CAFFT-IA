// Automatic accessibility check (WCAG 2.2 AA rules of axe-core) of every
// screen, as a patient and as a therapist, on a phone, a tablet and a
// computer. Run after the flow (e2e/flow.mjs), so the screens have data.
//
//   A11Y=1 npm run test:e2e        (the report goes to e2e-a11y.json)
//
// axe finds about a third of WCAG problems; the keyboard and screen-reader
// review is in docs/accessibilitat/.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  computer: { width: 1366, height: 900 },
};

const PUBLIC = ['#/', '#/login', '#/register', '#/fear-of-flying', '#/cafft-program', '#/user-guide', '#/help-videos', '#/help-center', '#/privacy-policy', '#/scientific-foundation', '#/feedback'];
const PATIENT = ['#/start', '#/qpvii-evaluation', '#/exposure-hierarchy', '#/exposure', '#/evolution', '#/profile', '#/session-plan', '#/flight-report', '#/cafft-intro'];
const THERAPIST = ['#/therapist/dashboard', '#/therapist/patients', '#/therapist/notifications', '#/therapist/guide', '#/therapist/evidence'];

async function login(page, base, username) {
  await page.goto(base + '#/login');
  await page.fill('#username', username);
  await page.fill('#password', 'correct-horse');
  await page.click('form button[type="submit"]');
  await page.waitForTimeout(2000);
}

async function audit(page, base, route) {
  await page.goto(base + route);
  await page.waitForTimeout(1200);
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async (tags) => {
    const result = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
    return result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
      // For contrast: the colours and the ratio, to fix them at their source.
      colors: v.id === 'color-contrast' ? v.nodes.map((n) => n.any[0]?.data).filter(Boolean).map((c) => `${c.fgColor} on ${c.bgColor} = ${c.contrastRatio} (${c.fontSize})`) : undefined,
      count: v.nodes.length,
    }));
  }, TAGS);
}

/** Returns one entry per screen, viewport and rule broken. */
export async function runA11y({ browser, base, patientId }) {
  const found = [];
  for (const [viewport, size] of Object.entries(VIEWPORTS)) {
    for (const [who, routes] of [['visitor', PUBLIC], ['pac', PATIENT], ['ter', THERAPIST]]) {
      const page = await browser.newPage({ viewport: size });
      if (who !== 'visitor') await login(page, base, who);
      const all = who === 'ter' ? [...routes, `#/therapist/patient/${patientId}`] : routes;
      for (const route of all) {
        for (const v of await audit(page, base, route)) found.push({ viewport, who, route, ...v });
      }
      await page.close();
    }
  }
  return found;
}
