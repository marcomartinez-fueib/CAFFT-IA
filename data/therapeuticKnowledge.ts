
/**
 * Aquest fitxer conté la base de coneixement clínica i operativa del CAFFT 5.1.
 * S'utilitza per alimentar el sistema d'instruccions de l'assistent d'IA.
 */

export const THERAPEUTIC_KNOWLEDGE = {
    manual: `
# Manual Clínic i Prospecte CAFFT 5.1
**Computer Assisted Fear of Flying Treatment**
*Universitat de les Illes Balears (UIB)*

Aquest document constitueix la font oficial de coneixement per al programa CAFFT. Està dissenyat tant per a la consulta del pacient com per a la supervisió clínica.

## 1. Introducció a la Por de Volar (Aerofòbia)
Afecta aproximadament al 13% de la població adulta en forma de fòbia clínica. Un 40% addicional experimenta malestar significatiu. No és una malaltia, sinó una resposta de por apresa que es pot extingir.
Es manifesta a través de tres sistemes: Fisiològic (el cos), Cognitiu (el pensament) i Conductual (l'acció, principalment l'evitació).
El factor clau que manté la fòbia és l'alleujament que sentim en evitar la situació (reforç negatiu).

## 2. El Programa CAFFT (Funcionament)
El tractament es basa en l'Exposició Pura. Utilitzem vídeos realistes que simulen les fases del vol. El sistema crea una jerarquia personalitzada basada en el qüestionari QPV-II.
L'objectiu és l'Habituació: que el sistema emocional aprengui, per repetició, que els estímuls de l'avió no prediuen un perill real.
Sessions: 4-8 sessions de 60 minuts. Freqüència: 2-3 sessions per setmana.

## 3. Guia de l'Usuari (Prospecte)
Condicions d'ús: Lloc tranquil, llum tènue, AURICULARS OBLIGATORIS, volum realista.
Implicació activa: Concentració, honestedat en el malestar (SUDS 0-10), no aturar l'exposició si l'ansietat és alta.
PROHIBIT: No utilitzar tècniques de relaxació, respiració profunda o distracció durant els vídeos. Aquestes actuen com a "muletes" que impedeixen l'aprenentatge real.

## 4. Instruccions per al Vol Real (Post-Tractament)
Realitzar un vol en 10-15 dies després de la jerarquia.
Pautes: NO prendre tranquil·litzants ni alcohol. Comportar-se amb normalitat. Acceptar els nervis com a part segura del procés.

## 5. Contraindicacions
No fer servir sense supervisió en cas de malalties cardíaques greus, tractament psiquiàtric amb psicofàrmacs forts, epilèpsia fotosensible o embaràs.
`,

    therapistGuide: `
# Guia Científica i Clínica CAFFT per a Terapeutes (UIB)

## 1. Fonamentació Científica
- Bornas et al. (2001, 2002): Eficàcia del CAE vs llista d'espera.
- Bornas et al. (2006): L'exposició pura és el component crític. No cal relaxació.
- Tortella-Feliu et al. (2011): Equivalència entre CAFFT i Realitat Virtual (VRET).
- Craske et al. (2014): Model d'Aprenentatge Inhibitori per optimitzar l'exposició.

## 2. Mecanismes Terapèutics
- Extinció de la resposta de por per habituació.
- **Aprenentatge Inhibitori**: L'objectiu no és només "baixar l'ansietat" (habituació), sinó crear un nou aprenentatge de seguretat (CS-noUS) que competeixi amb el de por.
- Importància del so: Els estímuls auditius són sovint més rellevants que els visuals (Bornas et al., 2004).

## 3. Pautes Clau (Model Inhibitori - Craske)
- **Violació d'Expectatives**: El canvi es produeix quan el pacient experimenta un "desajust" entre el que temia que passaria i el que realment passa.
- **Eliminació de Senyals de Seguretat**: Treure "muletes" (com la respiració profunda o la presència del terapeuta) per maximitzar l'aprenentatge.
- **Variabilitat**: Canviar la durada, el context i els estímuls per fer l'aprenentatge més robust i resistent a recaigudes.
- **Etiquetatge Afectiu**: Expressar les emocions en paraules durant l'exposició ajuda a la regulació emocional.
`,

    inhibitoryLearning: `
# Model d'Aprenentatge Inhibitori (Michelle Craske)
Aquest model complementa la visió clàssica de l'habituació i se centra en maximitzar l'aprenentatge a llarg termini.

## Estratègies d'Optimització:
1. **Violació de l'Expectativa**: Dissenyar l'exposició per posar a prova una hipòtesi específica (Ex: "Si sento turbulències, l'avió caurà").
2. **Extinció Aprofundida (Deepened Extinction)**: Combinar estímuls ja exhibits anteriorment per potenciar l'aprenentatge.
3. **Variabilitat**: No seguir sempre un ordre lineal de menys a més por; introduir variacions en el nivell d'ansietat.
4. **Múltiples Contextos**: Practicar en diferents llocs, hores i estats emocionals.
5. **Eliminació de Conductes de Seguretat**: Forçar la confrontació sense mecanismes de defensa atenuants.
`,

    hierarchyLogic: `
# Lògica de la Jerarquia d'Exposició (Algoritme)
1. Associar puntuacions QPV-II a fases: Preparatius -> Preparació/Embarcament; Vol -> Enlairament/Vol/Aterratge; Vicari -> Accidents.
2. Ordenar fases de menor a major puntuació (de menys por a més por).
3. Desempatar per ordre lògic de vol (Enlairament -> Vol -> Aterratge).
4. Seleccionar el vídeo representatiu de menor intensitat per a cada fase.
Això garanteix un procés gradual i personalitzat.
`,

    patientFlow: `
# Flux del Pacient (CAFFT 5.1)
1. Registre/Login.
2. Introducció Psicoeducativa.
3. Avaluació Inicial (QPV-II Pre).
4. Visualització de Jerarquia.
5. Sessions d'Exposició (Habituació: repetir vídeo fins SUDs <= 2).
6. Pàgina de Decisió (LastSessionPage): Avaluació Post o Repàs.
7. Avaluació Final (QPV-II Post).
8. Celebració i Pautes de Vol Real.
`,

    coreFeatures: `
# Funcionalitats Core
- QPV-II digitalitzat amb 31 ítems i 4 subescales.
- Càlcul de l'Índex de Canvi Fiable (RCI) (significatiu si > 1.96).
- Gràfics d'evolucio i corbes d'habituació (pendent/slope negatiu).
- LocalStorage DB per a persistència "backendless".
- Assistent IA integrat (Gemini) amb personalitat terapèutica.
`
};
