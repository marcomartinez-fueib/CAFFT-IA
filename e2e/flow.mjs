// The checks run by e2e/run.mjs. Each returns a line starting with PASS or
// FAIL. The labels refer to the tasks of the pilot plan (docs/PLA_PILOT.md).
import { DatabaseSync } from 'node:sqlite';

const DAY = 24 * 60 * 60 * 1000;

// Console errors that are expected: the session check before login, and the
// exposure videos when the Git LFS files are not present, and the assistant
// answering «not available» (these runs have no provider key).
const EXPECTED_CONSOLE = [/status of 401/, /Video loading failed/, /status of 503/, /ai\.disabled/];

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
  check('5.3 the QPV-II says how long it takes', (await text()).includes('Calculi uns 10 minuts'));
  await page.locator('input[type="radio"]').first().check({ force: true });
  await pause(2000);
  check('5.3 the answers are saved on the server as the patient goes', !!db.prepare('SELECT 1 FROM qpvii_drafts WHERE user_id = ?').get(patientId));

  db.prepare('UPDATE users SET is_test_account = 1 WHERE id = ?').run(patientId);
  await page.reload();
  await pause(2000);
  check('1.10 random fill shown to a test account', (await page.getByText('aleatòriament').count()) > 0);
  check('5.3 after a reload the questionnaire carries on where it was',
    (await text()).includes('Ha començat aquest qüestionari un altre dia') && (await page.locator('input[type="radio"]').first().isChecked()));

  const progressBefore = (await text()).match(/(\d+)%/)?.[1];
  await page.getByText('aleatòriament').first().click();
  await page.locator('form button[type="submit"]').last().click();
  await pause(2500);
  const progressAfter = (await text()).match(/(\d+)%/)?.[1];
  check('1.6 progress bar updates after the QPV-II without a reload', progressBefore === '5' && progressAfter !== '5', `${progressBefore}% -> ${progressAfter}%`);
  check('5.3 submitting the QPV-II deletes the draft', !db.prepare('SELECT 1 FROM qpvii_drafts WHERE user_id = ?').get(patientId));

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

  // P06 before the first session: open, with the version selector, and it
  // must be watched to the end before «Començar Exposició» is enabled.
  // Exact: the card's note also mentions «Començar Exposició».
  const start = page.getByRole('button', { name: 'Començar Exposició', exact: true });
  check('3.6 P06 gates the first session', await start.isDisabled() && (await text()).includes('vegi aquest vídeo fins al final'));
  check('3.3 a video with two versions offers «Esquema / Pantalla real»',
    (await page.getByRole('radio').count()) === 2 && (await page.getByRole('radio', { name: 'Esquema' }).isChecked()));
  await page.getByText('Pantalla real').click();
  await pause(1000);
  const p06c = page.locator('video[data-help-video="P06c"]');
  check('3.3 the choice switches the video and is kept in the profile',
    (await p06c.count()) === 1 && db.prepare('SELECT help_video_variant AS v FROM users WHERE id = ?').get(patientId).v === 'captures');
  await p06c.evaluate((v) => v.dispatchEvent(new Event('play')));
  await p06c.evaluate((v) => v.dispatchEvent(new Event('ended')));
  await pause(1000);
  const viewRow = db.prepare("SELECT * FROM help_video_views WHERE user_id = ? AND video_id = 'P06'").get(patientId);
  check('3.4 the viewing is recorded with its version', viewRow?.version_id === 'P06c' && viewRow.completed_at > 0 && viewRow.closed_early === 0 && viewRow.views === 1);
  check('3.6 watching P06 to the end enables «Començar Exposició»', await start.isEnabled());
  check('3.5 a watched card folds and says «Vist»', (await page.locator('[data-help-video-card="P06"] [aria-expanded="false"]').count()) === 1 && (await text()).includes('Vist'));

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
  check('3.6 the retry message carries P07', (await page.locator('[data-help-video-card="P07"]').count()) === 1);

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

  // The assistant goes through the API; these runs have no provider key, so the
  // API answers «not available» and the chat must say so (and keep working).
  await page.getByRole('button', { name: 'Assistent virtual' }).click();
  await pause(1500);
  await page.getByPlaceholder('Escrigui aquí...').fill('Com funciona l\'exposició?');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await pause(1500);
  check('2.7 the assistant goes through the API (no provider: «not available»)', (await text()).includes('no està disponible ara mateix'));
  await page.keyboard.press('Escape');
  await pause(300);
  check('6.1 Escape closes the assistant and the focus returns to its button',
    (await page.locator('[role="dialog"]').count()) === 0 && (await page.evaluate(() => document.activeElement?.id)) === 'help-button');

  // Help videos, from the catalogue e2e/run.mjs writes into the build.
  await page.goto(base + '#/help-videos');
  await pause(1500);
  body = await text();
  check('3.7 the library groups the videos by moment, with P17 as «to learn more»',
    body.includes('Benvinguda') && body.includes('Entrenament') && body.includes("Per què funciona l'exposició") && body.includes('PER SABER-NE MÉS') && !/youtube/i.test(await page.content()));
  const p04 = page.getByRole('button', { name: /Per què funciona l'exposició/ });
  await p04.click();
  await pause(800);
  const player = page.locator('video[data-help-video="P04"]');
  const state = await player.evaluate((v) => ({ paused: v.paused, autoplay: v.autoplay, track: v.querySelector('track')?.default }));
  check('3.2 the video plays inside the page, not by itself, subtitles on', state.paused && !state.autoplay && state.track === true);
  await page.getByText('Transcripció').click();
  await pause(800);
  check('3.2 the transcript comes from the subtitles', (await text()).includes('Text de prova de P04_exposicio en ca.'));
  await player.evaluate((v) => v.dispatchEvent(new Event('ended')));
  await pause(300);
  check('3.2 at the end the card folds and the focus returns to its button',
    (await p04.getAttribute('aria-expanded')) === 'false' && (await p04.evaluate((b) => b === document.activeElement)));
  await page.goto(base + '#/cafft-intro');
  await pause(1500);
  check('3.1 the introduction plays P01 from the catalogue', (await page.locator('video[data-help-video="P01"]').count()) === 1);

  // The profile is in the menu (on the phone, the menu button).
  await page.locator('#sidebar-nav-mobile').click();
  await pause(300);
  await page.getByRole('link', { name: 'El meu perfil' }).click();
  await pause(1000);
  check('4.4 the profile is reachable from the menu', page.url().endsWith('#/profile'));

  // Session planner: Monday and Thursday, saved on the server, then the .ics.
  await page.goto(base + '#/session-plan');
  await pause(1500);
  await page.getByLabel('dilluns').check();
  await page.getByLabel('dijous').check();
  await page.getByLabel('Hora del dijous').fill('19:30');
  await page.getByRole('button', { name: 'Desar la planificació' }).click();
  await pause(1000);
  const planRow = db.prepare('SELECT slots FROM session_plans WHERE user_id = ?').get(patientId);
  check('4.1 the plan is saved on the server', planRow?.slots === JSON.stringify([{ day: 1, time: '18:00' }, { day: 4, time: '19:30' }]), planRow?.slots);
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Afegir al calendari' }).click()]);
  const ics = await (await import('node:fs/promises')).readFile(await download.path(), 'utf8');
  check('4.2 «Afegir al calendari» gives the planned sessions as a calendar file',
    download.suggestedFilename() === 'cafft-sessions.ics' && (ics.match(/BEGIN:VEVENT/g) || []).length === 8 && ics.includes('SUMMARY:Sessió del CAFFT') && !/QPV|malestar/i.test(ics));

  // Reminders: off for this patient (the seed), turned on from the planner.
  await page.getByRole('button', { name: 'Sí, enviar-me recordatoris' }).click();
  await pause(1500);
  const consentRow = db.prepare('SELECT notification_consent_version AS v, notification_prefs AS p FROM users WHERE id = ?').get(patientId);
  check('4.4 turning reminders on records the notification consent', consentRow.v === '2026-12' && JSON.parse(consentRow.p).enabled === true);
  await page.goto(base + '#/profile');
  await pause(1500);
  body = await text();
  check('4.1 the profile shows the next planned session', body.includes('Propera sessió') && body.includes('Recordatoris per correu'));

  // The link of a reminder email turns them off without logging in.
  db.prepare("UPDATE users SET unsubscribe_token = 'e2e-unsubscribe-token-0123456789' WHERE id = ?").run(patientId);
  const anon = await browser.newPage();
  watch(anon);
  await anon.goto(base + '#/reminders-off/e2e-unsubscribe-token-0123456789');
  await anon.waitForTimeout(1500);
  check('4.4 the email link turns reminders off',
    (await anon.locator('body').innerText()).includes('Hem desactivat els recordatoris')
      && db.prepare('SELECT notification_consent_version AS v FROM users WHERE id = ?').get(patientId).v === null);
  await anon.close();

  // The real flight: the date for the question the day after, and the self-report.
  await page.goto(base + '#/flight-report');
  await pause(1500);
  await page.getByLabel('Data prevista del vol').fill('2027-03-20');
  await page.getByRole('button', { name: 'Desar la data' }).click();
  await pause(800);
  await page.getByText('Sí', { exact: true }).click();
  await page.getByLabel('Quin dia va volar?').fill('2027-03-20');
  await page.getByLabel(/malestar màxim durant el vol/).fill('3');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await pause(1000);
  const flight = db.prepare('SELECT flew, max_anxiety FROM flight_reports WHERE user_id = ?').get(patientId);
  check('5.6 the patient plans the flight date and reports the flight',
    db.prepare('SELECT planned_flight_date AS d FROM users WHERE id = ?').get(patientId).d === '2027-03-20' && flight?.flew === 1 && flight.max_anxiety === 3);
  const [guide] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Descarregar les pautes' }).click()]);
  check('5.6 the flight guidelines can be downloaded', guide.suggestedFilename() === 'cafft-pautes-del-vol.html');

  await page.goto(base + '#/');
  await pause(800);

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
  check('5.4 a patient lands on the start screen after logging in', np.url().endsWith('#/welcome') || np.url().endsWith('#/start'), np.url());
  await np.goto(base + '#/exposure-hierarchy');
  await np.waitForTimeout(1000);
  let nb = await np.locator('body').innerText();
  check('5.2 a new patient is taken to the welcome, step 1 of 3', np.url().endsWith('#/welcome') && nb.includes('Pas 1 de 3'));
  check('2.1 a patient registered from the panel sees the informed consent first', nb.includes('Acceptar i continuar') && nb.includes('En poques paraules'));
  await np.fill('#dob', '1990-01-01');
  await np.selectOption('#gender', 'female');
  await np.selectOption('#occupation', 'PDI');
  await np.selectOption('#source', 'web');
  await np.check('#consent');
  await np.getByRole('button', { name: 'Acceptar i continuar' }).click();
  await np.waitForTimeout(1500);
  nb = await np.locator('body').innerText();
  const novaConsent = db.prepare("SELECT c.version FROM consents c JOIN users u ON u.id = c.user_id WHERE u.username = 'nova'").get();
  check('2.1 accepting records the version and opens the programme', !!novaConsent && nb.includes('Pas 2 de 3'));
  check('5.2 step 2 is the welcome video P01', (await np.locator('video[data-help-video="P01"]').count()) === 1);
  await np.getByRole('button', { name: 'Continuar' }).click();
  await np.waitForTimeout(800);
  const next = np.getByRole('button', { name: 'Continuar' });
  check('5.2 step 3: the checklist must be ticked before going on', (await np.locator('body').innerText()).includes('Pas 3 de 3') && (await next.isDisabled()));
  for (const box of await np.locator('input[type="checkbox"]').all()) await box.check();
  await next.click();
  await np.waitForTimeout(800);
  check('5.2 at the end, the session planner is offered', (await np.locator('body').innerText()).includes('Quan farà les sessions?'));
  await np.getByRole('button', { name: "Anar a l'inici" }).click();
  await np.waitForTimeout(1500);
  nb = await np.locator('body').innerText();
  check('5.4 the start screen has one next step: the QPV-II',
    np.url().endsWith('#/start') && /el seu pas següent/i.test(nb) && (await np.locator('[data-next-step="qpvii"]').count()) === 1,
    `${np.url()} ${await np.locator('[data-next-step]').getAttribute('data-next-step').catch(() => 'none')}`);
  check('5.2 the welcome is recorded', !!db.prepare("SELECT welcome_completed_at AS w FROM users WHERE username = 'nova'").get().w);
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

  // A dialog keeps the keyboard inside and closes with Escape.
  await tp.goto(base + '#/therapist/dashboard');
  await tp.reload();
  await tp.waitForTimeout(1500);
  await tp.keyboard.press('Tab');
  const firstStop = await tp.evaluate(() => document.activeElement?.textContent);
  await tp.keyboard.press('Enter');
  check('6.1 the first Tab offers «skip to content», which moves the focus there',
    firstStop === 'Anar al contingut' && (await tp.evaluate(() => document.activeElement?.id)) === 'main-content', firstStop);
  await tp.locator('#add-patient-btn').click();
  await tp.waitForTimeout(500);
  const dialogFocus = [];
  for (let i = 0; i < 8; i++) {
    await tp.keyboard.press('Tab');
    dialogFocus.push(await tp.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')));
  }
  await tp.keyboard.press('Escape');
  await tp.waitForTimeout(300);
  check('6.1 the focus stays inside a dialog, and Escape closes it',
    dialogFocus.every(Boolean) && (await tp.locator('[role="dialog"]').count()) === 0 && (await tp.evaluate(() => document.activeElement?.id)) === 'add-patient-btn');
  await tp.goto(base + '#/therapist/notifications');
  await tp.waitForTimeout(1500);
  check('1.14 Notificacions has no English placeholder', !(await tp.locator('body').innerText()).includes('will be implemented here'));
  await tp.goto(base + '#/therapist/evidence');
  await tp.waitForTimeout(1500);
  body = await tp.locator('body').innerText();
  check('1.14 Evidència: no raw key, RCI is not «clínicament significatiu»', !/COMMON\.VIEWSOURCE/i.test(body) && !/clínicament significatiu/i.test(body));
  await tp.goto(base + `#/therapist/patient/${patientId}`);
  await tp.waitForTimeout(2000);
  body = (await tp.locator('body').innerText()).replace(/\s+/g, ' ');
  check('3.4 the therapist sees which help videos the patient watched', body.includes("Vídeos d'ajuda") && /P06 .*Pantalla real.*Vist/.test(body));
  check('4.6 the therapist sees the patient\'s session plan', body.includes('Planificació de sessions') && body.includes('dilluns 18:00 · dijous 19:30'));
  await tp.goto(base + '#/therapist/dashboard');
  await tp.waitForTimeout(1500);
  await tp.getByRole('button', { name: /Exportar/i }).first().click();
  await tp.waitForTimeout(500);
  const [funnel] = await Promise.all([tp.waitForEvent('download'), tp.getByRole('button', { name: "Exportar l'embut" }).click()]);
  const funnelCsv = await (await import('node:fs/promises')).readFile(await funnel.path(), 'utf8');
  check('5.8 the funnel exports one pseudonymised row per patient',
    funnelCsv.split('\n')[0].includes('patient_code') && funnelCsv.includes('"yes"') && !funnelCsv.includes(patientId) && !funnelCsv.includes('pac@'));
  await tp.close();

  check('no unexpected browser errors', errors.length === 0, [...new Set(errors)].slice(0, 5).join(' | '));
  db.close();
  return results;
}
