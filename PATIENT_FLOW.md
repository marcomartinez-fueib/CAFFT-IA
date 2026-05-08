# CAFFT 5.1 - Descripció del Flux Funcional del Pacient

Aquest document descriu el flux d'usuari **actualment implementat i funcional** a l'aplicació CAFFT 5.1, des del registre inicial fins a la finalització del programa i les opcions de manteniment.

## Diagrama de Flux General

```
                  +-------------------+
                  |      Pàgina       |
                  |       Inici       |
                  +---------+---------+
                            |
           +----------------+----------------+
           |                                 |
+----------v----------+           +----------v----------+
|  Registre / Login   |           |  Explorar Pàgines   |
+----------+----------+           |       Públiques     |
           |                       +---------------------+
+----------v----------+
|  Comprovació d'Estat |
|      (useAuth)      |
+----------+----------+
           |
  +--------+--------+------------------+
  | (Completat)     | (En Progrés)     | (Nou Usuari)
  |                 |                  |
+---v-------------+ +----------------v-+ +----------------v--+
| Pàgina de       | | Pàgina de        | | Pàgina            |
| Felicitació     | | Jerarquia/Repàs  | | d'Introducció     |
+-----------------+ | (Reprendre)      | | (Inici del Flux)  |
                  +------------------+ +---------+---------+
                                                    |
           +----------------------------------------+
           |
+----------v-----------+
|      Pàgina QPV-II   |
|   (Avaluació Inicial)|
+----------+-----------+
           |
+----------v-----------+
| Pàgina de Jerarquia  |
+----------+-----------+
           |
+----------v-----------+
| Pàgina d'Explicació  | (Primera vegada per cicle)
+----------+-----------+
           |
+----------v-----------+
| Pàgina d'Exposició   |
| (Mode Normal)        |
+----------+-----------+
           | (Seqüència completada)
+----------v-----------+
| Pàgina Última Sessió |  <-- NOVA PÀGINA DE DECISIÓ
| (Repàs o Avaluació)  |
+----------+-----------+
           |
  +--------+----------------+
  | (Tria Avaluació)        | (Tria Repàs)
  |                         |
+---v--------+        +-----v---------------+
| Pàgina     |        | Pàgina de Selecció  |
| QPV-II     |        | de Repàs            |
|(Avaluació +-------->+----------+----------+
|  Post)     | (Després del repàs)    |
+-----+------+                     | (Comença repàs)
      |                          |
      |                 +--------v----------+
      |                 | Pàgina Exposició  |
      |                 | (Mode Repàs)      |
      |                 +-------------------+
      |
+-----v------+
| Pàgina de  |
| Felicitació|
+------------+
```

---

## 1. Configuració Inicial i Accés

### 1.1. Registre i Login
- **Usuari Convidat**: L'usuari arriba a la `HomePage`. Pot explorar pàgines públiques (`FearOfFlyingPage`, `CafftProgramPage`). Les principals crides a l'acció són **Registrar-se** o **Iniciar Sessió**.
- **Registre (`RegisterPage`)**: Un nou usuari crea un compte (nom d'usuari, correu electrònic, contrasenya) i ha de donar el seu consentiment a la `PrivacyPolicyPage`.
- **Login (`LoginPage`)**: Un usuari existent inicia sessió.

### 1.2. Redirecció Post-Login
El hook `useAuth` determina a on redirigir l'usuari després de l'inici de sessió:

1.  **Usuari amb Programa Completat**: Si l'usuari té **qualsevol** cicle terapèutic marcat com a `programCompleted: true`, és redirigit directament a la `CelebrationPage`.
2.  **Usuari amb Sessió de Repàs en Curs**: Si té una sessió de repàs (`isReview: true`) incompleta, és la màxima prioritat i se'l redirigeix a la `ExposurePage` per continuar.
3.  **Usuari amb Sessió Estàndard Completada (Pendent de Decisió)**: Si l'usuari ha completat tots els vídeos d'una jerarquia però no ha fet l'avaluació final, és redirigit a la `LastSessionPage` per decidir el següent pas.
4.  **Usuari amb Sessió Estàndard en Curs**: Si l'últim cicle d'exposició de l'usuari **no** està completat, és redirigit a la `ExposureHierarchyPage` per reprendre el seu progrés exactament on el va deixar.
5.  **Nou Usuari / Sense Progrés**: Si l'usuari no té cap avaluació QPV-II prèvia o acaba de registrar-se, és redirigit a la `CafftIntroPage`.

---

## 2. El Cicle Terapèutic Principal

### Pas 1-3: Avaluació, Jerarquia i Explicació
Aquest flux es manté igual:
- L'usuari comença a la `CafftIntroPage`.
- Fa l'avaluació inicial a la `QpviiPage`.
- Veu la seva jerarquia a `ExposureHierarchyPage`.
- La primera vegada per cicle, veu la `ExposureExplanationPage`.

### Pas 4: Sessió d'Exposició (Pàgina d'Exposició - Mode Normal)
- L'usuari realitza el bucle d'exposició (veure vídeo -> valorar malestar) fins que supera tots els vídeos de la seva jerarquia.
- Quan l'últim vídeo es completa amb èxit (malestar ≤ 2), l'usuari ja **no** va directament a l'avaluació.

### Pas 5: Pàgina de Decisió (Pàgina d'Última Sessió)
- Després de completar la jerarquia, l'usuari aterra a `LastSessionPage`.
- Aquesta pàgina li ofereix dues opcions principals:
  1. **Fer l'Avaluació Final**: Porta a la `QpviiPage` per fer el qüestionari post-tractament.
  2. **Repassar Escenes**: Porta a la `ReviewSelectionPage`.

---

## 3. Flux de Repàs i Finalització

### Opció A: Flux d'Avaluació Directa

1.  A la `LastSessionPage`, l'usuari tria "Fer l'Avaluació Final".
2.  És redirigit a la `QpviiPage` (marcada internament com a `isPostExposureEval: true`).
3.  Després d'enviar el qüestionari, és redirigit a la `CelebrationPage`.
4.  El programa es marca com a completat.

### Opció B: Flux amb Repàs

1.  A la `LastSessionPage`, l'usuari tria "Repassar Escenes".
2.  És redirigit a la `ReviewSelectionPage`, on tria les escenes que vol practicar.
3.  Comença una nova sessió d'exposició a la `ExposurePage` (en mode `isReview: true`), que només conté els vídeos de les escenes seleccionades.
4.  L'usuari completa el bucle d'exposició per a aquesta seqüència de repàs.
5.  **Important**: En acabar l'últim vídeo del repàs, el sistema el redirigeix **directament i automàticament** a la `QpviiPage` per a l'avaluació final (`isPostExposureEval: true`). No torna a la pàgina de decisió.
6.  Després d'enviar el qüestionari, és redirigit a la `CelebrationPage`.
7.  El programa es marca com a completat.

---

## 4. Pàgina de Felicitació (CelebrationPage)

- Aquesta pàgina és la destinació final un cop un cicle es marca com a completat (`programCompleted: true`).
- Mostra un missatge de felicitació i ofereix opcions per veure les pautes per a un vol real, tornar a l'inici o tancar sessió.
- Qualsevol intent futur d'iniciar sessió per part d'aquest usuari el portarà directament aquí, tancant efectivament el cicle de tractament actiu.
