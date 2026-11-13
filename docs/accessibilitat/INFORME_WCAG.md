# CAFFT · Informe d'accessibilitat (WCAG 2.2 AA)

Revisió de la fita 6.1 del pla del pilot. Data: novembre de 2026.

## Abast i mètode

- **Anàlisi automàtica** amb axe-core 4.14 (regles WCAG 2.0, 2.1 i 2.2,
  nivells A i AA) de totes les pantalles: 11 públiques, 9 del pacient i 6 del
  terapeuta, amb dades reals de prova, a tres mides (mòbil 390 px, tauleta
  820 px i ordinador 1366 px). Es repeteix a cada canvi en el CI:
  `A11Y=1 npm run test:e2e` (detall a `e2e-a11y.json`). Si troba un problema,
  la prova falla.
- **Teclat**: proves automàtiques del recorregut amb tabulador i Escape en
  els diàlegs, l'enllaç per saltar al contingut i el focus visible.
- **Lector de pantalla** (VoiceOver i NVDA): pendent de fer-ho a mà; vegeu
  l'últim apartat.

axe detecta aproximadament un terç dels problemes de WCAG; la resta demana
revisió humana.

## Resultat de l'anàlisi automàtica

| Regla | Abans | Ara | Correcció |
|---|---|---|---|
| Contrast del text (1.4.3) | 78 | 0 | Els tons de gris i de color clars de Tailwind (slate i gray 400–500, sky-600, green-600, emerald-600) s'han enfosquit a la configuració del tema fins a 4,5:1 o més; casos puntuals amb opacitat corregits a la pantalla. |
| Nom accessible amb el text visible (2.5.3) | 40 | 0 | El botó «Assistent virtual» s'anunciava com «Ajuda». |
| Botons sense nom (4.1.2) | 20 | 0 | El botó del menú al mòbil: ara diu «Obrir el menú» / «Tancar» i si està obert. |
| Enllaços sense nom (2.4.4, 4.1.2) | 15 | 0 | L'enllaç a l'inici de la ruta de navegació del terapeuta. |
| Zones amb desplaçament sense teclat (2.1.1) | 6 | 0 | El text del consentiment i l'àrea principal del panell del terapeuta es poden enfocar i desplaçar amb el teclat. |
| Gràfics sense alternativa (1.1.1) | 6 | 0 | Els gràfics de sectors donen les xifres en text al lector de pantalla i no reben el focus. |
| **Total** | **165** | **0** | |

## Teclat

- **Diàlegs** (assistent, consentiment d'avisos, valoració del malestar,
  pautes del vol, i els del terapeuta i l'administrador): s'anuncien com a
  diàleg amb el seu títol, el focus hi entra en obrir-se i no en surt fins que
  es tanquen, Escape els tanca i el focus torna al botó que els ha obert. La
  valoració del malestar no es tanca amb Escape: espera la resposta, i el
  focus va directament a la barra de valoració.
- **Saltar al contingut** (2.4.1): el primer element del tabulador a totes
  les pantalles porta directament al contingut.
- **Focus visible** (2.4.7): cap control amaga el contorn de focus sense
  posar-ne un altre.
- Les etiquetes dels formularis del terapeuta estan associades als camps.

## Decisions i límits coneguts

- **Vídeos d'exposició**: es reprodueixen a pantalla completa, sense controls
  i sense poder-los aturar ni avançar. És una decisió terapèutica (exposició
  sense evitació). En surt amb «Fer una pausa» abans de començar el vídeo o en
  acabar-lo. **[equip]** Confirmar que es manté així al pilot.
- **Píndoles d'ajuda**: tenen subtítols, transcripció i no comencen soles.
  Algunes porten el text escrit a la imatge i, amb els subtítols activats, es
  veuen tots dos. **[equip]** Pendent de decidir.
- **Anglès**: totes les cadenes de la interfície estan traduïdes, i un control
  del CI (`npm run check:translations`) impedeix que en quedi cap en català.
  **[equip]** Revisar els textos en anglès abans del 12 de febrer.

## Pendent: revisió amb lector de pantalla

Recorregut recomanat, amb VoiceOver (iPhone i Mac) i NVDA (Windows), amb un
compte de pacient nou:

1. Inici de sessió i benvinguda en tres passos: s'anuncia «Pas 1 de 3», el
   consentiment es llegeix sencer i els errors del formulari s'anuncien.
2. QPV-II: cada pregunta s'anuncia amb la seva escala; el desat automàtic no
   interromp la lectura.
3. Sessió d'exposició: la targeta de P06, el botó «Començar Exposició»
   desactivat fins a veure-la i, després del vídeo, el diàleg de valoració.
4. Planificador: dies, hores i «Afegir al calendari».
5. Panell del terapeuta: alertes, fitxa del pacient i exportacions.

Anotar a cada pas què s'anuncia i si es pot fer sense mirar la pantalla.
