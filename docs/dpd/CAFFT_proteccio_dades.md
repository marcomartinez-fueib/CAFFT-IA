# CAFFT 5.1 · Informació per al delegat de protecció de dades

Esborrany per revisar · novembre de 2026 · Marco Martínez (desenvolupament)

Aquest document descriu com tracta les dades l'aplicació web del CAFFT, per a
la consulta al delegat de protecció de dades (DPD) de la UIB i per preparar,
si escau, l'avaluació d'impacte (art. 35 RGPD). Recull l'estat de l'aplicació
el novembre de 2026, abans del pilot amb pacients reals.

Els punts marcats **[equip]** els ha de completar o confirmar l'equip clínic;
els marcats **[DPD]** són preguntes per al DPD.

---

## 1. El tractament

| | |
|---|---|
| **Què és** | Aplicació web d'exposició per a la por a volar (programa CAFFT), autoaplicada amb seguiment d'un terapeuta, i assistent virtual amb IA. |
| **Responsable** | Universitat de les Illes Balears (així ho diu el text legal del consentiment), a través de l'Espai de Benestar Psicològic (EBP-UIB). **[equip]** Confirmar el registre d'activitats de tractament en què s'inclou. |
| **Finalitats** | Proporcionar el tractament; seguiment clínic pel terapeuta; recerca en psicologia clínica amb dades anonimitzades (segons el consentiment). |
| **Base jurídica** | Consentiment explícit del pacient per a dades de salut (art. 9.2.a RGPD), que l'aplicació demana i registra (§ 5). **[DPD]** Confirmar-la, i si la recerca necessita una base o un consentiment separats. |
| **Persones afectades** | Pacients adults del pilot; terapeutes, gestors i administradors. **[equip]** Nombre previst de pacients i durada del pilot. |
| **On s'executa** | Un servidor de la UIB (`pausat.uib.es`), amb dos entorns separats: `pre` (proves, sense pacients reals) i `pro` (el pilot). |

## 2. Dades que es tracten

| Categoria | Dades | On | Qui hi accedeix |
|---|---|---|---|
| Identificació | Nom d'usuari, correu electrònic, codi de pacient seudònim | Base de dades del servidor | El mateix pacient; el seu terapeuta; gestors i administradors |
| Dades sociodemogràfiques | Data de naixement, gènere, ocupació, com ha conegut el servei, si accepta la presència d'estudiants | Ídem | Ídem |
| **Salut** | Respostes i puntuacions del QPV-II; valoracions de malestar (escala 1–9) de cada vídeo d'exposició; sessions (data, durada); progrés en la jerarquia | Ídem | Ídem |
| **Converses amb l'assistent** | Text lliure de les preguntes i respostes | Ídem; el model d'IA de la UIB les processa en el moment de respondre (§ 4) | El pacient; el seu terapeuta |
| Consentiments | Quina versió del text s'ha acceptat, quan i en quina llengua; retirades | Ídem | Terapeuta (estat); administradors |
| Comunicacions | Correus enviats (invitació, restabliment de contrasenya, recordatoris) i resposta del servidor de correu | Ídem | Administradors |
| Registre d'accessos | Data, usuari, acció, pacient afectat i adreça IP de: inicis de sessió, canvis de comptes, consentiments, i cada accés del personal a dades clíniques (§ 6) | Ídem | Administradors; el DPD a petició |
| Preferències | Notificacions, nom de l'assistent | Ídem | El pacient |
| Navegador | Només la llengua triada i una marca del recorregut guiat (`localStorage`). Les dades clíniques es tenen en memòria mentre l'aplicació és oberta i no queden al dispositiu. | Dispositiu del pacient | El pacient |

No es tracten dades de pagament ni de geolocalització. L'aplicació no fa servir
galetes de seguiment ni analítica de tercers: només la galeta de sessió
(`HttpOnly`, `SameSite=Strict`).

## 3. Fluxos de dades

```
 Pacient / terapeuta (navegador)
        │  HTTPS (certificat de la UIB)
        ▼
 Servidor UIB pausat.uib.es ── Traefik ── nginx (aplicació) ── API (base de dades SQLite)
                                                                 │
                                         ┌───────────────────────┼─────────────────────┐
                                         ▼                       ▼                     ▼
                         Model d'IA de la UIB         Relé de correu UIB     Còpies diàries
                         (pausat-llm, mateix servidor)
                              (assistent; § 4)           smtp.uib.es            (mateix servidor)
```

- El navegador només parla amb el servidor de la UIB (política de seguretat de
  contingut `default-src 'self'`): cap recurs ni dada no va a tercers des del
  navegador.
- El codi font és a GitHub (repositori privat). **No hi ha dades de pacients**:
  les proves automàtiques fan servir bases de dades temporals amb usuaris
  inventats.

## 4. Assistent virtual i model d'IA

- **Model:** el motor d'IA propi de la UIB, **al mateix servidor** (`pausat-llm`,
  que també fa servir el PAUSAT): un model obert (Qwen3.5) servit amb vLLM.
  **Cap conversa no surt de la UIB** i no intervé cap proveïdor extern. Ni la
  passarel·la ni el motor no registren el contingut de les peticions.
- **Qui hi parla:** només l'API del servidor, amb un testimoni d'accés propi de
  cada entorn. El navegador no hi té accés.
- **Què s'envia:** les instruccions de l'assistent (manual clínic del CAFFT,
  moment del tractament i, per al pacient, si ha fet el QPV-II i el darrer
  vídeo), i els darrers missatges de la conversa. **No s'hi inclou el nom, el
  correu ni cap identificador** del pacient. Per al terapeuta, les dades dels
  seus pacients hi van identificades només pel codi de pacient seudònim.
- **Text lliure:** el que escriu l'usuari arriba al model tal com l'escriu, però
  es processa dins la UIB.
- **Conservació a la UIB:** les preguntes i respostes es desen perquè el
  terapeuta les pugui consultar. Es poden esborrar automàticament passat un
  termini (`AI_RETENTION_DAYS`), avui sense fixar. **[DPD]** Termini.
- **Disponibilitat:** el motor es comparteix amb el PAUSAT i s'adorm quan no
  s'usa; la primera resposta pot trigar uns minuts. **Per això cap funció de
  seguretat (crisi o risc) no pot dependre de l'assistent.** **[equip]** Avui el
  CAFFT no té cap detecció de crisi en el xat: valorar si cal abans del pilot.
- **Interruptor:** l'assistent es pot desactivar per entorn sense afectar la
  resta de l'aplicació.
- **No és un producte sanitari validat.** **[equip]** Revisar una mostra de
  respostes del model en el context del CAFFT abans del pilot.
- L'aplicació també pot fer servir Google Gemini en lloc del model de la UIB
  (`AI_PROVIDER=gemini`); no està activat i, si s'activés, les converses
  sortirien de la UIB i caldria tornar a consultar el DPD.

## 5. Consentiment

- El pacient ha d'acceptar el consentiment informat **abans de qualsevol pàgina
  del programa**, tant si es registra ell mateix com si l'ha donat d'alta el
  terapeuta. Fins al novembre de 2026, els pacients donats d'alta pel terapeuta
  quedaven marcats com a consentidors sense haver vist el text; s'ha corregit i
  se'ls demana en entrar.
- Es desa **quina versió del text** s'ha acceptat, la data i la llengua. Si el
  text canvia, se'n puja la versió i tots els pacients l'han de tornar a
  acceptar. Una prova automàtica impedeix canviar el text sense canviar-ne la
  versió.
- El servidor rebutja qualsevol dada clínica d'un pacient sense el
  consentiment vigent.
- El consentiment per als avisos (recordatoris) és separat, es registra igual i
  es pot **retirar** des del perfil.
- La retirada del consentiment del tractament es fa per escrit al DPD o al
  terapeuta, tal com diu el text legal. **[DPD]** Si cal oferir-la també dins
  l'aplicació.
- **[equip]** El text del consentiment en llenguatge planer (viatge del
  pacient) s'haurà de revisar amb el DPD abans de publicar-lo.

## 6. Mesures de seguretat

**Accés i autenticació**
- Contrasenyes de 8 caràcters com a mínim, desades amb `scrypt` i sal.
- Sessions al servidor (galeta `HttpOnly`, `Secure`, `SameSite=Strict`) que
  caduquen als 14 dies sense ús; límit d'intents i bloqueig temporal en
  l'inici de sessió; comprovació d'origen contra CSRF.
- Restabliment de contrasenya per enllaç d'un sol ús vàlid 1 hora; altes per
  invitació amb enllaç d'un sol ús vàlid 7 dies.
- Rols: pacient (només les seves dades), terapeuta (els seus pacients), gestor
  (els terapeutes que gestiona i els seus pacients), administrador. Comprovat
  al servidor a cada petició.

**Registre d'accessos**
- Es registren els inicis de sessió (també els fallits), els canvis de comptes,
  els consentiments i **cada accés del personal a dades clíniques**: cada
  càrrega de dades amb els pacients afectats, cada fitxa de pacient oberta i
  cada exportació. S'exporta en CSV per al DPD
  (`node src/cli/audit.ts --days N`).

**Comunicacions i servidor**
- HTTPS amb el certificat de la UIB; política de seguretat de contingut
  estricta; capçaleres contra incrustació i sniffing.
- L'API no és accessible directament des de fora: només hi arriba el
  contenidor nginx de la mateixa aplicació.
- El testimoni d'accés al model d'IA només és al servidor (fitxer `0600`).
- **Xifratge en repòs:** **[equip/informàtica]** Pendent que informàtica de la
  UIB confirmi si el disc del servidor està xifrat.

**Còpies de seguretat**
- Còpia de la base de dades cada dia i abans de cada actualització de
  l'aplicació; es conserven 30 dies. Restauració provada.
- **Les còpies són al mateix servidor.** No hi ha còpia fora del servidor
  (decisió del projecte). **[DPD]** Valorar el risc de pèrdua de disponibilitat.

**Entorns i proves**
- L'entorn de proves (`pre`) té base de dades pròpia sense pacients reals, i
  el seu correu només arriba a adreces dels dominis de l'equip (`uib.es`,
  `uib.cat`, `fueib.org`).
- Els comptes de prova es marquen com a tals al panell i es poden excloure de
  les dades del pilot.
- Els canvis arriben a producció només després de passar per l'entorn de
  proves i les proves automàtiques.

**Monitoratge**
- El servei, els contenidors i l'antiguitat de les còpies es vigilen
  contínuament (`server-monitoring`), amb avisos per correu a l'equip tècnic.

## 7. Conservació

| Dada | Avui | **[DPD]** Proposta |
|---|---|---|
| Comptes i dades clíniques | Mentre el compte existeix; l'esborrat del pacient esborra totes les seves dades | Fi del pilot + termini de recerca |
| Converses amb l'assistent | Indefinida (configurable) | |
| Registre d'accessos | Indefinida | |
| Correus enviats | Indefinida | |
| Còpies de seguretat | 30 dies | |
| Sessions | 14 dies sense ús | |

## 8. Drets de les persones

- Accés, rectificació, supressió, oposició, portabilitat i limitació: per
  escrit al DPD (`dpo@uib.es`), segons el text legal del consentiment.
- L'aplicació permet al terapeuta **esborrar un pacient** amb totes les seves
  dades (QPV-II, sessions, valoracions, converses, consentiments) i exportar
  dades en CSV (també anonimitzades).
- El pacient pot retirar el consentiment dels avisos des del perfil.

## 9. Riscos identificats

| Risc | Mesures | Risc residual |
|---|---|---|
| Accés no autoritzat a dades de salut | Rols comprovats al servidor, contrasenyes robustes, límits d'intents, registre d'accessos | Baix |
| Dades de salut processades pel model d'IA | Model propi de la UIB al mateix servidor; sense identificadors; sense registre del contingut; interruptor; termini de conservació configurable | Baix |
| Una persona en crisi escriu al xat | **Cap detecció avui**; el model pot no estar disponible durant minuts | **[equip]** A valorar abans del pilot (§ 4) |
| Registre lliure de pacients | Els pacients que es registren sols queden sense terapeuta i només els veu l'administrador | **[equip]** El registre lliure es manté obert per decisió del projecte; valorar si cal per al pilot |
| Pèrdua de dades per avaria del servidor | Còpies diàries i abans de cada actualització | Mitjà: les còpies són al mateix servidor |
| Correus a destinataris equivocats | Les invitacions les crea el terapeuta; a proves, només dominis de l'equip | Baix |
| Dades de prova barrejades amb les del pilot | Entorn de proves separat; comptes de prova marcats | Baix |
| Text del consentiment desactualitzat | Versionat i reacceptació obligatòria | Baix |

## 10. Preguntes per al DPD

1. Base jurídica i si la recerca necessita un consentiment separat.
2. Si cal una avaluació d'impacte completa (art. 35) i en quin format.
3. Si el tractament de les converses amb el model d'IA propi de la UIB
   (compartit amb el PAUSAT) requereix alguna mesura addicional.
4. Terminis de conservació (§ 7), especialment de les converses amb
   l'assistent i del registre d'accessos.
5. Si les còpies només al mateix servidor són suficients.
6. Si cal oferir la retirada del consentiment del tractament dins l'aplicació.
7. Revisió del text del consentiment en llenguatge planer abans del pilot.
