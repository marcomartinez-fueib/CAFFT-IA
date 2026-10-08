// Server-generated emails. Text only. The app's languages are ca, es, en;
// anything else falls back to Catalan, the app's default.

export type Lang = 'ca' | 'es' | 'en';
export const LANGS = ['ca', 'es', 'en'] as const;

export function asLang(value: string | undefined): Lang {
  return (LANGS as readonly string[]).includes(value ?? '') ? (value as Lang) : 'ca';
}

/** The app uses a HashRouter, so the token goes after the #. */
export function setPasswordLink(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/*$/, '/')}#/reset-password/${token}`;
}

const SIGNATURE = {
  ca: "—\nCAFFT · Universitat de les Illes Balears\nAquest és un missatge automàtic; no cal que hi responguis.",
  es: '—\nCAFFT · Universitat de les Illes Balears\nEste es un mensaje automático; no hace falta que respondas.',
  en: '—\nCAFFT · Universitat de les Illes Balears\nThis is an automated message; please do not reply.',
};

export function passwordResetMail(lang: Lang, username: string, link: string): { subject: string; body: string } {
  const t = {
    ca: {
      subject: 'CAFFT: restableix la contrasenya',
      body: `Hola ${username},\n\nHem rebut una sol·licitud per restablir la contrasenya del teu compte de CAFFT. Pots triar-ne una de nova en aquest enllaç, que és vàlid durant 1 hora i només es pot fer servir una vegada:\n\n${link}\n\nSi no ho has demanat tu, pots ignorar aquest missatge: la teva contrasenya no canviarà.`,
    },
    es: {
      subject: 'CAFFT: restablece tu contraseña',
      body: `Hola ${username}:\n\nHemos recibido una solicitud para restablecer la contraseña de tu cuenta de CAFFT. Puedes elegir una nueva en este enlace, válido durante 1 hora y de un solo uso:\n\n${link}\n\nSi no lo has pedido tú, puedes ignorar este mensaje: tu contraseña no cambiará.`,
    },
    en: {
      subject: 'CAFFT: reset your password',
      body: `Hi ${username},\n\nWe received a request to reset the password of your CAFFT account. You can choose a new one at this link, which is valid for 1 hour and can be used once:\n\n${link}\n\nIf you did not ask for this, you can ignore this message: your password will not change.`,
    },
  }[lang];
  return { subject: t.subject, body: `${t.body}\n\n${SIGNATURE[lang]}` };
}

export function invitationMail(lang: Lang, username: string, invitedBy: string, link: string): { subject: string; body: string } {
  const t = {
    ca: {
      subject: 'Benvingut/da a CAFFT',
      body: `Hola ${username},\n\n${invitedBy} t'ha creat un compte a CAFFT, el programa de tractament de la por a volar de la Universitat de les Illes Balears.\n\nEl teu nom d'usuari és: ${username}\n\nPer començar, tria la teva contrasenya en aquest enllaç (vàlid durant 7 dies i d'un sol ús):\n\n${link}\n\nSi l'enllaç ha caducat, demana'n un de nou a la persona que t'ha convidat.`,
    },
    es: {
      subject: 'Bienvenido/a a CAFFT',
      body: `Hola ${username}:\n\n${invitedBy} te ha creado una cuenta en CAFFT, el programa de tratamiento del miedo a volar de la Universitat de les Illes Balears.\n\nTu nombre de usuario es: ${username}\n\nPara empezar, elige tu contraseña en este enlace (válido durante 7 días y de un solo uso):\n\n${link}\n\nSi el enlace ha caducado, pide uno nuevo a la persona que te ha invitado.`,
    },
    en: {
      subject: 'Welcome to CAFFT',
      body: `Hi ${username},\n\n${invitedBy} has created an account for you on CAFFT, the fear-of-flying treatment programme of the Universitat de les Illes Balears.\n\nYour username is: ${username}\n\nTo get started, choose your password at this link (valid for 7 days, single use):\n\n${link}\n\nIf the link has expired, ask the person who invited you for a new one.`,
    },
  }[lang];
  return { subject: t.subject, body: `${t.body}\n\n${SIGNATURE[lang]}` };
}
