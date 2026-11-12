/**
 * The flight guidelines as a page to keep (download, open, print or save as
 * PDF): the checklist and the final advice the app shows after the programme.
 * Until the team decides the final format (plan, fita 5).
 */
export function flightGuidelinesHtml(t: (key: string) => string, lang: string): string {
  const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const items = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `<li>${esc(t(`lastSession.checklistItem${n}`))}</li>`).join('\n');
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>${esc(t('lastSession.header'))} · CAFFT</title>
<style>
  body { font: 16px/1.5 system-ui, sans-serif; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; color: #1e293b; }
  h1 { color: #00263E; font-size: 1.6rem; } h2 { color: #00263E; font-size: 1.2rem; margin-top: 2rem; }
  li { margin: .5rem 0; } footer { margin-top: 3rem; font-size: .85rem; color: #64748b; }
</style>
</head>
<body>
<h1>${esc(t('lastSession.header'))}</h1>
<p><em>${esc(t('lastSession.intro'))}</em></p>
<ol>
${items}
</ol>
<h2>${esc(t('lastSession.finalAdviceTitle'))}</h2>
<p>${esc(t('lastSession.finalAdviceText'))}</p>
<footer>CAFFT · Universitat de les Illes Balears</footer>
</body>
</html>
`;
}

export function downloadFlightGuidelines(t: (key: string) => string, lang: string): void {
  const url = URL.createObjectURL(new Blob([flightGuidelinesHtml(t, lang)], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'cafft-pautes-del-vol.html';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    link.remove();
    URL.revokeObjectURL(url);
  }, 100);
}
