// The checks run by e2e/run.mjs. Each returns a line starting with PASS or
// FAIL. The labels refer to the tasks of the pilot plan (docs/PLA_PILOT.md).
import { DatabaseSync } from 'node:sqlite';

const DAY = 24 * 60 * 60 * 1000;

// Console errors that are expected: the session check before login, and the
// exposure videos when the Git LFS files are not present.
const EXPECTED_CONSOLE = [/status of 401/, /Video loading failed/];

export async function runFlow({ browser, base, dbPath }) {
  const db = new DatabaseSync(dbPath);
  const results = [];
  const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`);
  const errors = [];
  const watch = (page) => {
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' && !EXPECTED_CONSOLE.some((re) => re.test(m.text()))) errors.push(m.text());
    });
  };
  const patientId = db.prepare("SELECT id FROM users WHERE username = 'pac'").get().id;

  // --- Patient, on a phone-sized screen -------------------------------------------
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  watch(page);
  const text = async () => (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  const pause = (ms) => page.waitForTimeout(ms);

  await page.goto(base + '#/login');
  await page.fill('#username', 'pac');
  await page.fill('#password', 'correct-horse');
  await page.click('form button[type="submit"]');
  await pause(2000);

  await page.goto(base + '#/exposure-hierarchy');
  await pause(1000);
  let body = await text();
  check('1.2 hierarchy without a QPV-II explains the missing step', body.includes('Primer cal fer un pas previ') && body.includes('Respondre el QPV-II'));

  await page.goto(base + '#/exposure-explanation');
  await pause(1000);
  check('1.2 exposure explanation without a QPV-II is not blank', (await text()).includes('Primer cal fer un pas previ'));

  await page.goto(base + '#/qpvii-evaluation');
  await pause(1500);
  check('1.10 random fill hidden from a normal patient', (await page.getByText('aleatòriament').count()) === 0);

  db.prepare('UPDATE users SET is_test_account = 1 WHERE id = ?').run(patientId);
  await page.reload();
  await pause(2000);
  check('1.10 random fill shown to a test account', (await page.getByText('aleatòriament').count()) > 0);

  const progressBefore = (await text()).match(/(\d+)%/)?.[1];
  await page.getByText('aleatòriament').first().click();
  await page.locator('form button[type="submit"]').last().click();
  await pause(2500);
  const progressAfter = (await text()).match(/(\d+)%/)?.[1];
  check('1.6 progress bar updates after the QPV-II without a reload', progressBefore === '5' && progressAfter !== '5', `${progressBefore}% -> ${progressAfter}%`);

  await page.getByRole('button', { name: /Jerarquia/i }).first().click();
  await pause(1500);
  body = await text();
  check('1.9 hierarchy is explained with the figures of the list', body.includes('Cada vídeo correspon a un moment del vol') && /\d\.\d \/ 9/.test(body));

  await page.getByRole('button', { name: /Començar Exposició/i }).first().click();
  await pause(1500);
  await page.getByRole('button', { name: /exposici|Continuar|Començar/i }).last().click();
  await pause(1500);
  body = await text();
  check('1.3 «Fer una pausa» replaces «Sortir i guardar el progrés»', body.includes('Fer una pausa') && !body.includes('Sortir i guardar'));
  check('1.4 opening the exposure page creates no session', db.prepare('SELECT COUNT(*) AS n FROM exposure_sessions').get().n === 0);

  // Plays the current video (or, without the LFS files, simulates it) and rates it.
  const watchAndRate = async (rating) => {
    await page.getByRole('button', { name: /Començar Exposició/i }).first().click();
    await pause(1500);
    const failed = await page.getByRole('button', { name: /Simular/i }).count();
    if (failed) await page.getByRole('button', { name: /Simular/i }).click();
    else await page.locator('video').evaluate((v) => v.dispatchEvent(new Event('ended')));
    await pause(500);
    const slider = page.locator('input[type="range"]');
    const max = await slider.getAttribute('max');
    await slider.fill(String(rating));
    await page.getByRole('button', { name: /Desar|Guardar/i }).click();
    await pause(1000);
    return max;
  };

  check('1.7 the discomfort slider goes from 1 to 9', (await watchAndRate(5)) === '9');
  body = await text();
  check('1.8 the retry message speaks only of 2 or less', /2 o menys/.test(body) && !/meitat|->/.test(body));

  await watchAndRate(2);
  check('1.4 the first rating opens one session', db.prepare('SELECT COUNT(*) AS n FROM exposure_sessions').get().n === 1);

  await page.getByRole('button', { name: 'Fer una pausa' }).click();
  await pause(1500);
  body = await text();
  check('1.3 the pause shows the end-of-session summary', body.includes('Ha fet una pausa') && body.includes('Vídeos vistos i valorats: 2') && body.includes('del 5 al 2'));
  check('1.3 the patient is still logged in after the pause', !page.url().includes('login') && !body.includes('Iniciar Sessió'));
  check('1.3 the session is closed as a pause', db.prepare('SELECT end_reason FROM exposure_sessions').get().end_reason === 'pause');

  // A second session, a day later: move the first one back in time.
  db.prepare('UPDATE exposure_sessions SET started_at = started_at - ?, last_activity_at = last_activity_at - ?, ended_at = ended_at - ?').run(DAY, DAY, DAY);
  const progress = db.prepare('SELECT id, discomfort_ratings FROM exposure_progress WHERE user_id = ?').get(patientId);
  const shifted = JSON.parse(progress.discomfort_ratings).map((r) => ({ ...r, videoTimestamp: r.videoTimestamp - DAY }));
  db.prepare('UPDATE exposure_progress SET discomfort_ratings = ? WHERE id = ?').run(JSON.stringify(shifted), progress.id);
  await page.reload();
  await pause(1500);
  await page.goto(base + '#/exposure');
  await pause(1500);
  await watchAndRate(6);
  await page.getByRole('button', { name: 'Fer una pausa' }).click();
  await pause(800);
  check('1.3 a pause after a high rating explains first', (await text()).includes('El seu darrer malestar ha estat 6'));
  await page.getByRole('button', { name: 'Fer la pausa' }).click();
  await pause(1500);

  await page.goto(base + '#/evolution');
  await pause(2000);
  body = await text();
  check('1.5 La Meva Evolució lists both sessions', (body.match(/\b[12]\. /g) || []).length >= 2);
  check('1.5 trend charts appear from the second session', (await page.locator('.recharts-wrapper').count()) > 0);
  check('1.7 no «/10» left on La Meva Evolució', !/\/10\b/.test(body));

  db.prepare('UPDATE users SET is_test_account = 0 WHERE id = ?').run(patientId);
  await page.reload();
  await pause(1500);
  await page.goto(base + '#/exposure');
  await pause(1500);
  await page.getByRole('button', { name: /Començar Exposició/i }).first().click();
  await pause(1500);
  if ((await page.locator('[role="alert"]').count()) > 0) {
    body = await text();
    check('1.10 a patient sees no paths or «Simular» when a video fails',
      !/videos_cafft|\.mp4|https?:\/\//.test(body) && (await page.getByRole('button', { name: /Simular/i }).count()) === 0);
  }
  await page.close();

  // --- A patient registered from the panel: consent first --------------------------
  const np = await browser.newPage({ viewport: { width: 390, height: 844 } });
  watch(np);
  await np.goto(base + '#/login');
  await np.fill('#username', 'nova');
  await np.fill('#password', 'correct-horse');
  await np.click('form button[type="submit"]');
  await np.waitForTimeout(2000);
  await np.goto(base + '#/exposure-hierarchy');
  await np.waitForTimeout(1000);
  let nb = await np.locator('body').innerText();
  check('2.1 a patient registered from the panel sees the informed consent first', nb.includes('Consentiment informat') && nb.includes('Acceptar i continuar'));
  await np.fill('#dob', '1990-01-01');
  await np.selectOption('#gender', 'female');
  await np.selectOption('#occupation', 'PDI');
  await np.selectOption('#source', 'web');
  await np.check('#consent');
  await np.getByRole('button', { name: 'Acceptar i continuar' }).click();
  await np.waitForTimeout(1500);
  nb = await np.locator('body').innerText();
  const novaConsent = db.prepare("SELECT c.version FROM consents c JOIN users u ON u.id = c.user_id WHERE u.username = 'nova'").get();
  check('2.1 accepting records the version and opens the programme', !!novaConsent && nb.includes('Primer cal fer un pas previ'));
  await np.close();

  // --- Therapist, on a desktop screen ------------------------------------------------
  const tp = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  watch(tp);
  await tp.goto(base + '#/login');
  await tp.fill('#username', 'ter');
  await tp.fill('#password', 'correct-horse');
  await tp.click('form button[type="submit"]');
  await tp.waitForTimeout(2500);
  body = (await tp.locator('body').innerText()).replace(/\s+/g, ' ');
  check('1.13 the role label is translated', !/\bTHERAPIST\b/i.test(body));
  const unnamed = await tp.evaluate(
    () => [...document.querySelectorAll('button')].filter((b) => !b.innerText.trim() && !b.getAttribute('aria-label') && !b.getAttribute('aria-labelledby')).length,
  );
  check('1.15 every icon-only button on the dashboard has a name', unnamed === 0, `unnamed=${unnamed}`);

  await tp.goto(base + `#/therapist/patient/${patientId}`);
  await tp.waitForTimeout(2000);
  await tp.getByRole('button', { name: 'Compte de prova' }).click();
  await tp.waitForTimeout(1000);
  check('1.10 the therapist marks a test account from the panel', db.prepare('SELECT is_test_account FROM users WHERE id = ?').get(patientId).is_test_account === 1);
  check('1.10 the toggle exposes its state', (await tp.getByRole('button', { name: 'Compte de prova' }).getAttribute('aria-pressed')) === 'true');

  await tp.goto(base + '#/therapist/notifications');
  await tp.waitForTimeout(1500);
  check('1.14 Notificacions has no English placeholder', !(await tp.locator('body').innerText()).includes('will be implemented here'));
  await tp.goto(base + '#/therapist/evidence');
  await tp.waitForTimeout(1500);
  body = await tp.locator('body').innerText();
  check('1.14 Evidència: no raw key, RCI is not «clínicament significatiu»', !/COMMON\.VIEWSOURCE/i.test(body) && !/clínicament significatiu/i.test(body));
  await tp.close();

  check('no unexpected browser errors', errors.length === 0, [...new Set(errors)].slice(0, 5).join(' | '));
  db.close();
  return results;
}
