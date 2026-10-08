# CAFFT-IA — Plan de backend con persistencia

Estado: **en curso** (fases 0–5 hechas; queda la puesta en marcha, ver §12) · Última revisión: 2026-10-08

## 1. Punto de partida

CAFFT-IA es hoy una SPA estática. No hay servidor de aplicación ni base de datos:

- **Persistencia**: `utils/localStorageDB.ts` (646 líneas, 36 funciones exportadas)
  guarda todo en `localStorage` bajo seis claves: usuarios, resultados QPV-II,
  progreso de exposición, emails simulados, consultas a la IA y feedback. Lo
  importan 28 ficheros.
- **Autenticación**: ocurre entera en el navegador (`hooks/useAuth.tsx`). Las
  contraseñas se guardan como SHA-256 sin sal (`utils/hash.ts`). Cada carga crea
  las cuentas `testuser`/`password` y `terapeuta`/`clauacces`.
- **Autorización**: no existe. Las páginas leen *todos* los usuarios y filtran en
  el cliente (p. ej. `u.therapistId === currentUser.id` en
  `TherapistPatientsPage.tsx`, `TherapistDashboardPage.tsx`, `ChatPage.tsx`).
- **Servidor**: solo el contenedor nginx de `docs/deploy/docker/`, que sirve la
  app y hace de proxy *sin autenticar* a Gemini en `/cafft/genai/`.

Consecuencia: los datos clínicos están en un único dispositivo, sin copia de
seguridad, y un terapeuta solo ve a los pacientes que se registraron *en su mismo
navegador*. La app no es utilizable con pacientes reales en varios dispositivos.

## 2. Objetivo y alcance

**Objetivo**: un backend sencillo, en el mismo servidor, que guarde todos los
datos de forma persistente y centralizada, con login real y control de acceso
por rol.

**Dentro del alcance**

- API REST con sesiones en servidor.
- Base de datos persistente con migraciones y copias de seguridad.
- Autorización por rol y por relación (paciente ↔ terapeuta ↔ gestor).
- Proteger el proxy de Gemini con la sesión.
- Adaptar el frontend para usar la API en lugar de `localStorage`.
- Envío real de emails: restablecer contraseña e invitaciones/recordatorios.

**Fuera del alcance**

- Importar datos de `localStorage`: no hay pacientes reales, se empieza con la
  BD vacía.
- SSO de la UIB: no es obligatorio.
- Copias fuera del servidor: basta con copias en el propio servidor.
- Tareas programadas (recordatorios automáticos de inactividad).
- Mover las llamadas a Gemini al backend (se sigue usando el proxy de nginx).

## 3. Decisiones técnicas

| Tema | Decisión | Motivo |
|---|---|---|
| Lenguaje | **TypeScript sobre Node 24 LTS** | Mismo lenguaje que el frontend; se reutilizan `types.ts`, `utils/qpviiScoring.ts`, `utils/exposureUtils.ts`. |
| Framework HTTP | **Fastify** | Ligero, validación de esquemas JSON integrada, buen soporte TS. |
| Base de datos | **SQLite** con el módulo integrado `node:sqlite` (modo WAL), en un volumen Docker | Un solo servidor, decenas o pocos cientos de usuarios, escrituras pequeñas. Un fichero, cero administración. `node:sqlite` evita dependencias nativas (`better-sqlite3` no siempre tiene binarios para la última versión de Node) e incluye `backup()`. Si algún día hace falta, el esquema se traslada a PostgreSQL sin cambiar la API. |
| Ejecución | Node ejecuta el TypeScript directamente (*type stripping*) | Sin paso de compilación: la imagen Docker son las fuentes más las dependencias. |
| Tests | `node:test` + `fastify.inject` | Sin dependencias de test. |
| Acceso a datos | SQL escrito a mano + migraciones numeradas (`server/migrations/NNN_*.sql`) | Pocas tablas; un ORM añade más de lo que aporta. |
| Hash de contraseñas | **scrypt** de `node:crypto` (sal aleatoria por usuario) | Sin dependencias nativas extra. |
| Sesiones | Token aleatorio en cookie `HttpOnly; Secure; SameSite=Strict; Path=/cafft`, guardado hasheado en la tabla `sessions` | Revocables (logout, cambio de contraseña), sin JWT que gestionar. |
| CSRF | `SameSite=Strict` + comprobación de `Origin` en peticiones que modifican datos | Todo es same-origin; no hace falta token CSRF. |
| Ubicación del código | `server/` en este mismo repositorio | Tipos compartidos y un solo despliegue. |

## 4. Arquitectura de despliegue

```
navegador ──https──▶ Traefik ──▶ cafft-nginx ──┬─ /cafft/            estáticos (igual que hoy)
                                               ├─ /cafft/videos_cafft/ vídeos (igual que hoy)
                                               ├─ /cafft/api/        ──▶ cafft-api:3001  (NUEVO)
                                               └─ /cafft/genai/      ──▶ Google, tras auth_request a la API (CAMBIA)
                                                                     
                                     cafft-api ──▶ /data/cafft.db  (volumen ./data)
```

- Nuevo servicio `api` en `docs/deploy/docker/docker-compose.yml`, en la red
  interna del compose. No se publica en Traefik: solo nginx lo alcanza, así la
  CSP `connect-src 'self'` sigue valiendo sin cambios.
- `cafft.conf` gana un `location /cafft/api/` con `proxy_pass http://api:3001/`.
- **Proxy Gemini protegido** con `auth_request`: nginx pregunta a
  `GET /cafft/api/auth/check` antes de reenviar a Google; si la sesión no es
  válida devuelve 401. El streaming SSE sigue resuelto en nginx, como ahora. El
  `limit_req` se mantiene como segunda barrera.
- Directorio nuevo en el servidor: `/data/apps/cafft/data/` (BD) y
  `/data/apps/cafft/backups/`.
- En desarrollo, `vite.config.ts` añade un proxy `/cafft/api → http://localhost:3001`,
  igual que ya hace con `genai`.

## 5. Modelo de datos

Criterio: columnas relacionales para todo lo que se filtra o tiene integridad
(ids, roles, relaciones, fechas), y columnas JSON para estructuras anidadas que
el cliente ya usa tal cual (respuestas QPV-II, secuencia de vídeos, valoraciones).
Así el JSON que ve el frontend apenas cambia.

```sql
-- 001_init.sql
CREATE TABLE users (
  id                 TEXT PRIMARY KEY,               -- UUID
  role               TEXT NOT NULL CHECK (role IN ('patient','therapist','manager','superadmin')),
  username           TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email              TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash      TEXT NOT NULL,                  -- 'scrypt$N$r$p$salt$hash'
  patient_code       TEXT UNIQUE,
  therapist_id       TEXT REFERENCES users(id),      -- solo pacientes
  manager_id         TEXT REFERENCES users(id),      -- solo terapeutas
  consent_given      INTEGER NOT NULL DEFAULT 0,
  consent_metadata   TEXT,                           -- JSON InformedConsentMetadata
  assistant_name     TEXT,
  notification_prefs TEXT,                           -- JSON NotificationPreferences
  onboarding_enabled INTEGER NOT NULL DEFAULT 1,
  onboarding_done    TEXT NOT NULL DEFAULT '[]',     -- JSON: tours completados (hoy en localStorage)
  sent_follow_ups    TEXT NOT NULL DEFAULT '[]',     -- JSON string[]
  last_login_at      INTEGER,
  last_assessment_at INTEGER,
  last_reminder_at   INTEGER,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL
);
CREATE INDEX users_therapist ON users(therapist_id);
CREATE INDEX users_manager   ON users(manager_id);

CREATE TABLE sessions (
  token_hash  TEXT PRIMARY KEY,                      -- sha256 del token de la cookie
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE TABLE qpvii_results (
  id                  INTEGER PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timestamp           INTEGER NOT NULL,              -- se conserva: es la clave lógica que usa el cliente
  form_name           TEXT NOT NULL,
  form_date           TEXT NOT NULL,
  evaluation_type     TEXT CHECK (evaluation_type IN ('pre','post')),
  original_timestamp  INTEGER,
  scores              TEXT NOT NULL,                 -- JSON QPVIIScores
  answers             TEXT NOT NULL,                 -- JSON QPVIIAnswers
  UNIQUE (user_id, timestamp)
);

CREATE TABLE exposure_progress (
  id                  INTEGER PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qpvii_timestamp     INTEGER,                       -- NULL permitido, como hoy
  original_qpvii_timestamp INTEGER,
  is_review           INTEGER NOT NULL DEFAULT 0,
  video_sequence      TEXT NOT NULL,                 -- JSON string[]
  current_video_index INTEGER NOT NULL,
  completed_video_ids TEXT NOT NULL,                 -- JSON string[]
  discomfort_ratings  TEXT NOT NULL,                 -- JSON VideoDiscomfortRating[]
  explanation_shown   INTEGER NOT NULL DEFAULT 0,
  program_completed   INTEGER NOT NULL DEFAULT 0,
  review_completed    INTEGER NOT NULL DEFAULT 0,
  last_updated        INTEGER NOT NULL,
  UNIQUE (user_id, qpvii_timestamp)
);

CREATE TABLE ai_consultations (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_role  TEXT NOT NULL,
  query      TEXT NOT NULL,
  response   TEXT NOT NULL,
  timestamp  INTEGER NOT NULL
);
CREATE INDEX ai_consultations_user ON ai_consultations(user_id, timestamp);

CREATE TABLE emails (                              -- hoy "SimulatedEmail"; futura cola de envío
  id         TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  status     TEXT NOT NULL,                          -- 'generated' | 'sent'
  timestamp  INTEGER NOT NULL
);

CREATE TABLE feedback (
  id        TEXT PRIMARY KEY,
  user_id   TEXT REFERENCES users(id) ON DELETE SET NULL,   -- NULL para 'guest'
  username  TEXT NOT NULL,
  user_type TEXT NOT NULL,
  type      TEXT NOT NULL,
  rating    INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment   TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'new',
  timestamp INTEGER NOT NULL
);

CREATE TABLE audit_log (                           -- quién vio/cambió qué; datos de salud
  id         INTEGER PRIMARY KEY,
  at         INTEGER NOT NULL,
  actor_id   TEXT,
  action     TEXT NOT NULL,                          -- 'login', 'patient.create', 'patient.delete', 'patient.view', …
  target_id  TEXT,
  ip         TEXT
);
```

Notas:

- `PRAGMA foreign_keys = ON` y `journal_mode = WAL` al abrir la conexión.
- Borrar un paciente pasa a ser un `DELETE FROM users` dentro de una transacción;
  las cascadas sustituyen a la lógica manual de `deletePatientData`.
- La API devuelve los objetos con la **misma forma** que los tipos actuales
  (`StoredUser` sin `hashedPassword`, `QPVIIUserResult`, `UserExposureProgress`…),
  de modo que las páginas no cambian lo que consumen, solo cómo lo obtienen.

## 6. Reglas de autorización

Se aplican en el servidor, en cada endpoint, con un helper
`canAccessUser(actor, targetId)`:

| Rol | Puede leer / modificar |
|---|---|
| `patient` | Solo sus propios datos. |
| `therapist` | Sus datos y los de los pacientes con `therapist_id = actor.id`. Crea pacientes (asignados a sí mismo). |
| `manager` | Sus datos, sus terapeutas (`manager_id = actor.id`) y los pacientes de esos terapeutas (solo lectura clínica). Crea terapeutas. |
| `superadmin` | Todo. Crea usuarios de cualquier rol, reasigna. |

Campos que **nunca** acepta la API desde el cliente al actualizar un usuario:
`id`, `role`, `password_hash`, `therapist_id`, `manager_id`, `patient_code`,
`last_login_at` (salvo superadmin para `role`/asignaciones). Hoy `updateUser`
mezcla cualquier `Partial<User>` sobre el registro guardado; eso se sustituye por
una lista blanca de campos editables.

## 7. API

Prefijo `/cafft/api` (nginx lo reenvía sin prefijo). JSON en ambos sentidos.
Validación con esquemas de Fastify en todas las rutas.

**Autenticación**

| Método y ruta | Sustituye a |
|---|---|
| `POST /auth/login` `{username, password}` → usuario + cookie | `login` en `useAuth` |
| `POST /auth/logout` | `logout` |
| `GET  /auth/me` → usuario actual o 401 | `getSessionUser` + `findUserById` al arrancar |
| `GET  /auth/check` → 204/401 (para `auth_request` de nginx) | — |
| `POST /auth/register` (paciente autoregistrado) | `register` |
| `POST /auth/change-password` | `changePassword` |

`requestPasswordReset` / `resetPassword` siguen simulados hasta que haya envío
de email (fase posterior). Mientras, el restablecimiento lo hace el terapeuta con
`POST /users/:id/reset-password`, que devuelve una contraseña temporal y marca
`must_change_password`.

**Usuarios**

| Método y ruta | Sustituye a |
|---|---|
| `GET    /users?role=&therapistId=&managerId=` (filtrado por permisos) | `getUsers`, `getUsersByRole`, `getPatientsForTherapist`, `getTherapistsForManager` |
| `GET    /users/:id` | `findUserById` |
| `POST   /users` (crea paciente/terapeuta/… según rol del actor) | `saveUser` en los dashboards de terapeuta, gestor y superadmin |
| `PATCH  /users/:id` (lista blanca de campos) | `saveUser` / `updateUser` |
| `DELETE /users/:id` | `deletePatientData` |
| `POST   /users/:id/reset-password` | `resetPatientPassword` |
| `POST   /users/:id/toggle-notifications` | `toggleUserNotifications` |
| `POST   /users/:id/toggle-onboarding` | `toggleUserOnboarding` |
| `POST   /me/onboarding/:tour/complete` | flag `cafft_onboarding_completed_*` en localStorage |

`patient_code` y `id` se generan en el servidor (con restricción `UNIQUE`), no
en el cliente.

**Datos clínicos**

| Método y ruta | Sustituye a |
|---|---|
| `GET  /users/:id/qpvii` | `getQPVIIResultsForUser`, `hasQPVIIResults` |
| `POST /users/:id/qpvii` | `saveQPVIIResultForUser` (actualiza también `last_assessment_at`) |
| `GET  /users/:id/exposure` | `getAllUserExposureProgress().filter(userId)` |
| `GET  /users/:id/exposure/:qpviiTimestamp` | `getUserExposureProgress` |
| `PUT  /users/:id/exposure/:qpviiTimestamp` | `saveUserExposureProgress` (upsert) |
| `DELETE /users/:id/exposure/:qpviiTimestamp` | `clearUserExposureProgress` |
| `GET  /users/:id/activity` → `{ daysSinceLastActivity }` | `getDaysSinceLastActivity` |

**Vista agregada para terapeutas** (evita N+1 peticiones en los dashboards)

| Método y ruta | Sustituye a |
|---|---|
| `GET /therapist/patients/overview` → pacientes del actor con QPV-II, progreso y última actividad | Las cargas de todos los usuarios en `TherapistDashboardPage.tsx`, `TherapistPatientsPage.tsx` y `ChatPage.tsx` |

`GET /admin/overview` hace lo mismo para gestor y superadmin.

**Resto**

| Método y ruta | Sustituye a |
|---|---|
| `GET/POST /ai-consultations` (`?userId=`, `?userIds=`) | `saveAiConsultation`, `getAiConsultationsFor*` |
| `GET/POST /emails` (`?patientId=`) | `saveSimulatedEmail`, `getSimulatedEmailsForPatient` |
| `POST /therapist/reminders` `{thresholdDays, subject, bodyTemplate}` → `{sent}` | `sendAdherenceRemindersToAllInactive`, `checkAndSendInactivityReminder` |
| `GET/POST /feedback`, `PATCH /feedback/:id` | `getAllFeedback`, `saveFeedback` |

## 8. Cambios en el frontend

Implementado así (difiere del plan inicial, que proponía hacer asíncronas todas
las páginas):

- **`services/api.ts`**: `fetch` same-origin a `<base>api`, errores como
  `ApiError` y evento `cafft:session-expired` ante un 401 a mitad de sesión.
- **`services/dataStore.ts`** sustituye a `utils/localStorageDB.ts` con los
  mismos nombres de función. Al iniciar sesión, `GET /sync` carga en memoria todo
  lo que el usuario puede ver. Las **lecturas** siguen siendo síncronas, así que
  el flujo del paciente (QPV-II, jerarquía, exposición...) apenas cambió. Las
  **escrituras clínicas** actualizan la memoria y se envían en una cola
  secuencial con reintentos; todas son idempotentes en el servidor. Las
  **operaciones de cuenta** (crear, borrar, contraseña temporal, *toggles*) son
  asíncronas porque la página necesita la respuesta.
- Las páginas de staff llaman a `syncStore()` al montarse para ver la última
  actividad de sus pacientes. `syncStore()` espera a que la cola se vacíe, así
  una recarga no puede deshacer escrituras pendientes.
- `SyncStatusBanner` avisa si alguna escritura no se pudo guardar y pide
  confirmación antes de cerrar la pestaña con escrituras pendientes.
- En `localStorage` solo quedan preferencias del dispositivo: idioma y
  auto-arranque de los vídeos de introducción.
- No hizo falta el endpoint *overview* (§7): `/sync` ya devuelve los datos
  filtrados por permisos.

## 9. Puesta en marcha de datos

No hay pacientes reales: se arranca con la BD vacía y no hay importación ni
compatibilidad con los hashes SHA-256 antiguos. Lo que quede en `localStorage`
de pruebas anteriores se ignora.

Primer superadmin: script `npm run create-admin -- --username … --email …` que
pide la contraseña por terminal. Nunca hay credenciales en el código.

## 10. Copias de seguridad y operación

- **Backups dentro del propio proceso de la API**, sin cron: una copia al
  arrancar (antes de aplicar migraciones, así cada despliegue deja una copia
  previa) y otra cada 24 h, en `/data/apps/cafft/backups/cafft-YYYY-MM-DD.db`,
  con rotación de 30 días. Copia manual: `node src/cli/backup.ts`.
- **Restauración documentada** en `docs/deploy/DEPLOYMENT.md` (Step 6); hay que
  probarla una vez en el servidor antes de usar con pacientes.
- `GET /cafft/api/health` para comprobar el servicio.
- Logs de Fastify a stdout (`docker logs cafft-api`), sin registrar cuerpos de
  petición (contienen datos de salud).
- `deploy.sh` pasa los tests de la API, sube `server/` y hace
  `docker compose up -d --build api`; las migraciones se aplican al arrancar. El
  despliegue de estáticos no cambia.

## 11. Seguridad y protección de datos

Los datos son de salud (categoría especial, art. 9 RGPD). Mínimos que cubre este
plan:

- Contraseñas con scrypt y sal; sesiones revocables; cookie `HttpOnly`/`Secure`.
- Autorización en servidor (§6) y `audit_log` de accesos y cambios.
- Rate limit en `/auth/login` (p. ej. 5 intentos/min por IP + bloqueo temporal
  por cuenta).
- Sin credenciales por defecto ni rutas de desarrollo en producción.
- BD fuera del directorio web, en volumen con permisos restringidos; cifrado en
  reposo a nivel de disco del servidor.

La consulta al DPD de la UIB (base jurídica, plazo de conservación, envío de
conversaciones a Gemini) queda aplazada por decisión del equipo.

## 12. Fases

Cada fase se puede desplegar sola sin romper la anterior.

Las fases 1b–4 se hicieron en un solo bloque (decisión del 2026-10-07): los
usuarios, los datos clínicos y los recordatorios estaban demasiado acoplados
para migrarlos por separado sin código de transición desechable.

| Fase | Contenido | Estado |
|---|---|---|
| **0. Esqueleto** | `server/` con Fastify + `node:sqlite`, migración `001_init`, `/health`, Dockerfile, servicio en compose, `location /cafft/api/` en nginx, proxy en Vite, backups diarios, `deploy.sh`. | ✅ Hecho |
| **1a. Autenticación (servidor)** | login/logout/me/check/register/change-password, scrypt, sesiones en BD, bloqueo por cuenta + rate limit por IP, comprobación de `Origin`, `audit_log`, `create-admin`. | ✅ Hecho |
| **1b. Autenticación (frontend)** | `services/api.ts`; `useAuth` contra la API; quitar sembrado y `utils/hash.ts`; mínimo de contraseña 6 → 8 en las páginas y traducciones; nueva traducción `auth.tooManyAttemptsError`; `/dev/tools` solo en desarrollo y para superadmin; `auth_request` en `/cafft/genai/`. | ✅ Hecho |
| **2. Usuarios y roles** | Alta, baja, contraseña temporal y *toggles* con las reglas de §6; dashboards de terapeuta, gestor y superadmin. | ✅ Hecho |
| **3. Datos clínicos** | QPV-II y progreso de exposición en el servidor; el flujo del paciente lee de memoria y escribe en cola (ver §8). | ✅ Hecho |
| **4. Resto** | Consultas IA, emails simulados, recordatorios de inactividad (decididos en el servidor), feedback, tours de onboarding en la cuenta. `localStorageDB.ts` eliminado. | ✅ Hecho |
| **5. Email** | Envío por Microsoft Graph con cola persistente y reintentos; restablecer contraseña (enlace de 1 h); altas sin contraseña con invitación (enlace de 7 días, reenviable); recordatorios reales solo a quien aceptó notificaciones. | ✅ Hecho |
| **6. Operación** | Primer despliegue, alta del superadmin, credenciales de Graph (IT de la fundació, ver `DEPLOYMENT.md` Step 7) y probar una restauración en el servidor. | Pendiente |

## 13. Pruebas

Hecho: 26 tests de API (`npm run test:api`) y un recorrido e2e en Chromium
contra el stack real (nginx con `cafft.conf` + API + build con base `/cafft/`):
login por la UI, QPV-II guardado en el servidor y visto desde un segundo
navegador, sesión que sobrevive a una recarga, panel del terapeuta, proxy de
Gemini cerrado sin sesión y logout. **No cubierto en e2e:** la sesión de
exposición con vídeos (el entorno de prueba no tenía los mp4).

Plan original:

- **API**: Vitest + `fastify.inject` contra una BD SQLite en memoria. Prioridad:
  matriz de autorización (cada rol contra datos propios, ajenos y de su
  jerarquía), login con hash legado y re-hash, cascada al borrar paciente.
- **Frontend**: `npm run lint` (tsc) tras cada fase y recorrido manual del flujo
  completo de paciente y de terapeuta en dos navegadores distintos (el caso que
  hoy no funciona).

## 14. Decisiones tomadas (2026-10-07)

1. No hay pacientes reales: BD vacía, sin importación.
2. La UIB no exige SSO.
3. Copias de seguridad dentro del servidor.
4. El envío real de emails es necesario (fase 5), desde una cuenta de
   fueib.org (Microsoft 365) mediante **Microsoft Graph**, no SMTP: Exchange
   Online desactiva por defecto SMTP AUTH con contraseña a finales de
   diciembre de 2026.
7. Las invitaciones llevan un enlace para que el usuario elija su contraseña;
   quien da de alta ya no la fija, y ninguna contraseña viaja por email.
5. La consulta al DPD queda aplazada.
6. Contraseñas de 8 caracteres como mínimo (antes 6 en la app).
