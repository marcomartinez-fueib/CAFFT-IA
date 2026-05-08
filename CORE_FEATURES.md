# CAFFT 5.1 — Documentació de Funcionalitats Principals (Core Features)

Aquest document descriu les funcionalitats clau de l'aplicació **CAFFT 5.1 (Computer Assisted Fear of Flying Treatment)**. L'aplicació està dissenyada per proporcionar un tractament autoaplicat per a l'aerofòbia basat en l'evidència científica, així com eines de gestió per a terapeutes.

## 1. Mòdul del Pacient

El nucli de l'aplicació és l'experiència de l'usuari (pacient), dissenyada per guiar-lo des de l'avaluació inicial fins a la superació de la por mitjançant l'exposició.

### 1.1. Avaluació Psicomètrica (QPV-II)
*   **Qüestionari Digitalitzat:** Implementació completa del "Qüestionari de Por de Volar" (QPV-II) amb 31 ítems.
*   **Càlcul Automàtic de Subescales:** El sistema processa les respostes en temps real per calcular puntuacions en quatre dimensions:
    *   Malestar General.
    *   Ansietat Anticipatòria (Preparatius).
    *   Ansietat Vicària (Notícies/Accidents).
    *   Ansietat Durant el Vol.
*   **Comparativa Pre/Post:** Emmagatzematge d'avaluacions històriques per comparar l'estat del pacient abans i després del tractament.

### 1.2. Generació de Jerarquia Personalitzada (Algoritme Terapèutic)
*   **Lògica Dinàmica:** L'aplicació no utilitza una seqüència fixa per a tothom. Un algoritme analitza les puntuacions de les subescales del QPV-II per ordenar les fases del vol (preparació, embarcament, enlairament, vol, aterratge, accidents).
*   **Ordenació per Nivell d'Ansietat:** Es genera una llista de reproducció de vídeos ordenada des de la situació menys ansiògena (per començar amb seguretat) fins a la més ansiògena (dessensibilització sistemàtica).

### 1.3. Tractament d'Exposició Interactiva
*   **Reproductor de Vídeo Immersiu:** Reproducció de vídeos (MP4) que simulen situacions reals de vol.
*   **Valoració Subjectiva del Malestar (SUDs):** Després de cada vídeo, es demana a l'usuari que valori la seva ansietat de l'1 al 10.
*   **Lògica de Progressió Intel·ligent:**
    *   **Habituació:** Si la valoració és > 2, el sistema obliga a repetir el vídeo (l'usuari no pot avançar fins que l'ansietat baixa).
    *   **Avançament:** Si la valoració és ≤ 2, es desbloqueja el següent vídeo de la jerarquia.
*   **Explicació Psicoeducativa:** Mòdul previ a l'exposició que explica els conceptes d'habituació i extinció de la por.

### 1.4. Seguiment i Evolució
*   **Gràfics d'Evolució (QPV-II):** Visualització de la reducció de la por global i per subescales al llarg del temps (Chart.js/Recharts).
*   **Corbes d'Habituació:** Gràfics detallats per a cada escena que mostren com baixa l'ansietat amb cada repetició del vídeo (pendent d'habituació).
*   **Historial de Sessions:** Registre detallat de cada sessió d'exposició realitzada (data, durada, vídeos vistos).

### 1.5. Manteniment i Repàs
*   **Sessions de Repàs a la Carta:** Un cop completat el programa, l'usuari pot seleccionar escenes específiques per fer sessions de recordatori ("booster sessions") abans d'un vol real.
*   **Pautes Post-Tractament:** Consells específics per afrontar un vol real després d'haver completat la teràpia virtual.

---

## 2. Mòdul del Terapeuta

Un entorn dedicat per a professionals de la salut mental per supervisar el progrés dels seus pacients.

### 2.1. Tauler de Control (Dashboard)
*   **KPIs Globals:** Estadístiques resumides (total pacients, sessions actives, taxa de finalització, millora mitjana).
*   **Llista de Pacients Enriquida:** Taula amb estat actual del pacient (Nou, A punt, En progrés, Necessita revisió, Completat) i temps total d'exposició.

### 2.2. Gestió de Pacients
*   **Alta de Pacients:** Creació de credencials per a nous usuaris.
*   **Simulació de Comunicacions:** Sistema per enviar (simuladament) correus d'invitació, recordatoris o restabliment de contrasenya.
*   **Gestió de Dades:** Opció per esborrar dades de pacients o restablir contrasenyes.

### 2.3. Anàlisi Clínica Detallada
*   **Visualització del Progrés Individual:** Accés a tots els gràfics i resultats del pacient.
*   **Sistema de Recomanacions Automàtiques:** L'aplicació analitza les dades d'exposició i genera alertes clíniques automàtiques, com ara:
    *   "Habituació estancada" (si l'ansietat no baixa després de moltes repeticions).
    *   "Progrés lent".
    *   "Progrés positiu".

### 2.4. Exportació de Dades
*   **Exportació CSV:** Capacitat de descarregar totes les dades clíniques en format CSV per a anàlisi externa (Excel, SPSS).
*   **Anonimització:** Opció per exportar les dades amb IDs anònims per complir amb normatives de privacitat.

---

## 3. Funcionalitats Transversals i Tècniques

### 3.1. Assistent Virtual amb IA (Gemini)
*   **Xatbot Integrat:** Un xat d'ajuda basat en l'API de Google Gemini.
*   **Personalitat Terapèutica:** Configurat amb instruccions de sistema per actuar com un assistent psicològic empàtic, responent preguntes sobre la por de volar i el funcionament del programa.

### 3.2. Autenticació i Seguretat
*   **Registre i Login Segur:** Hashing de contrasenyes (SHA-256) abans de l'emmagatzematge.
*   **Rols d'Usuari:** Separació estricta entre vistes de pacient i terapeuta.
*   **Protecció de Rutes:** Components `ProtectedRoute` per evitar accessos no autoritzats a URL específiques.

### 3.3. Internacionalització (i18n)
*   **Suport Multi-idioma:** L'aplicació està completament traduïda a:
    *   Català (CA)
    *   Castellà (ES)
    *   Anglès (EN)
*   **Canvi Dinàmic:** Canvi d'idioma instantani sense recarregar la pàgina.

### 3.4. Persistència de Dades Local
*   **LocalStorage DB:** Tota la lògica de base de dades està simulada utilitzant el `localStorage` del navegador. Això permet que l'aplicació funcioni com una demostració autònoma sense necessitat de configurar un servidor backend (backendless).
