# Lògica de Creació de la Jerarquia d'Exposició

Aquest document descriu el procés que utilitza l'aplicació CAFFT per generar una jerarquia d'exposició personalitzada per a cada usuari, basant-se en els resultats del seu qüestionari inicial **QPV-II**.

## Objectiu Principal

L'objectiu és crear una seqüència de vídeos d'exposició que vagi **del menys ansiogen al més ansiogen** per a un usuari concret. Aquest enfocament gradual és fonamental en la teràpia d'exposició, ja que permet a l'usuari habituar-se a la por de manera controlada, augmentant l'eficàcia del tractament.

## Com funciona?

El sistema no es basa en una única puntuació total, sinó que analitza les pors específiques de l'usuari a través de les **subescales** del QPV-II. El procés es divideix en tres passos clau:

---

### Pas 1: Associar les Puntuacions a les Fases del Vol

El primer pas és vincular la por de l'usuari, mesurada per les subescales del QPV-II, a les diferents fases d'un vol. El sistema utilitza la següent correspondència:

| Fase del Vol | Subescala del QPV-II Associada | Descripció de la Por |
| :--- | :--- | :--- |
| **Preparació** | `Subescala Preparatius` | Ansietat anticipatòria (fer la maleta, anar a l'aeroport). |
| **Embarcament** | `Subescala Preparatius` | Ansietat relacionada amb els procediments a l'aeroport. |
| **Enlairament** | `Subescala Vol` | Por durant les maniobres de vol actives. |
| **Durant el Vol** | `Subescala Vol` | Por a sorolls, moviments o sensacions un cop a l'aire. |
| **Aterratge** | `Subescala Vol` | Por durant les maniobres d'aproximació i aterratge. |
| **Accidents** | `Subescala Vicari` | Ansietat generada per notícies o imatges d'accidents (por indirecta). |

Això permet al sistema saber quines parts de l'experiència de volar generen més malestar a l'usuari.

---

### Pas 2: Ordenar les Fases per Nivell de Por

Un cop cada fase té una puntuació de por associada, el sistema les ordena de la següent manera:

1.  **Criteri Principal**: S'ordenen les fases **de menor a major puntuació**. Les fases que han obtingut menys punts a la seva subescala corresponent apareixen primer a la jerarquia.
2.  **Criteri de Desempat**: Si diverses fases tenen la mateixa puntuació (per exemple, "Enlairament", "Durant el Vol" i "Aterratge" depenen totes de la `Subescala Vol`), s'utilitza un **ordre lògic i canònic** del vol per desempatar. Això assegura que, fins i tot amb la mateixa puntuació de por, la seqüència mantingui un ordre coherent (p. ex., l'enlairament sempre anirà abans de l'aterratge).

El resultat d'aquest pas és una **llista ordenada de les fases del vol**, des de la que genera menys por a la que en genera més, totalment personalitzada per a l'usuari.

---

### Pas 3: Seleccionar el Vídeo Representatiu per a Cada Fase

Finalment, amb la llista de fases ja ordenada, el sistema construeix la seqüència final de vídeos:

- Per a cada fase de la llista ordenada, busca entre els vídeos disponibles aquell que hi està relacionat.
- Si hi ha diversos vídeos per a una mateixa fase, el sistema tria el que té el valor d'**intensitat intrínseca més baix**.

Això garanteix que, per a una fase temuda, l'usuari s'exposi primer a la versió "més suau" d'aquesta situació.

### Exemple Pràctic

Imaginem un **Usuari A** amb les següents puntuacions:
- `Subescala Preparatius`: **70** (molta por a la preparació)
- `Subescala Vol`: **40** (por moderada durant el vol)
- `Subescala Vicari`: **10** (poca por a les notícies d'accidents)

La lògica de l'aplicació faria el següent:
1.  **Assignar puntuacions a les fases**: Accidents (10), Enlairament/Vol/Aterratge (40), Preparació/Embarcament (70).
2.  **Ordenar les fases per por**:
    1. Accidents (puntuació 10)
    2. Enlairament, Vol, Aterratge (puntuació 40, ordenades per la seva seqüència lògica)
    3. Preparació, Embarcament (puntuació 70, ordenades per la seva seqüència lògica)
3.  **Construir la seqüència de vídeos**: L'aplicació seleccionaria el vídeo menys intens de cada fase en l'ordre establert. El resultat seria una jerarquia que comença amb vídeos d'accidents (la seva por més baixa) i acaba amb vídeos de preparatius (la seva por més alta).

## Conclusió

Aquest mètode de tres passos assegura que la jerarquia d'exposició no sigui genèrica, sinó que estigui **directament adaptada al perfil de por específic de cada usuari**. Això augmenta la rellevància terapèutica del tractament i facilita un progrés gradual i efectiu.