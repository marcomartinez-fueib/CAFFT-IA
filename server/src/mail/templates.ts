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
  ca: "—\nCAFFT · Universitat de les Illes Balears\nAquest és un missatge automàtic; no cal que hi respongui.",
  es: '—\nCAFFT · Universitat de les Illes Balears\nEste es un mensaje automático; no hace falta que responda.',
  en: '—\nCAFFT · Universitat de les Illes Balears\nThis is an automated message; please do not reply.',
};

export function passwordResetMail(lang: Lang, username: string, link: string): { subject: string; body: string } {
  const t = {
    ca: {
      subject: 'CAFFT: restableixi la contrasenya',
      body: `Hola ${username},\n\nHem rebut una sol·licitud per restablir la contrasenya del seu compte de CAFFT. Pot triar-ne una de nova en aquest enllaç, que és vàlid durant 1 hora i només es pot fer servir una vegada:\n\n${link}\n\nSi no ho ha demanat vostè, pot ignorar aquest missatge: la seva contrasenya no canviarà.`,
    },
    es: {
      subject: 'CAFFT: restablezca su contraseña',
      body: `Hola ${username}:\n\nHemos recibido una solicitud para restablecer la contraseña de su cuenta de CAFFT. Puede elegir una nueva en este enlace, válido durante 1 hora y de un solo uso:\n\n${link}\n\nSi no lo ha pedido usted, puede ignorar este mensaje: su contraseña no cambiará.`,
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
      body: `Hola ${username},\n\n${invitedBy} li ha creat un compte a CAFFT, el programa de tractament de la por a volar de la Universitat de les Illes Balears.\n\nEl seu nom d'usuari és: ${username}\n\nPer començar, triï la seva contrasenya en aquest enllaç (vàlid durant 7 dies i d'un sol ús):\n\n${link}\n\nSi l'enllaç ha caducat, demani'n un de nou a la persona que l'ha convidat.`,
    },
    es: {
      subject: 'Bienvenido/a a CAFFT',
      body: `Hola ${username}:\n\n${invitedBy} le ha creado una cuenta en CAFFT, el programa de tratamiento del miedo a volar de la Universitat de les Illes Balears.\n\nSu nombre de usuario es: ${username}\n\nPara empezar, elija su contraseña en este enlace (válido durante 7 días y de un solo uso):\n\n${link}\n\nSi el enlace ha caducado, pida uno nuevo a la persona que le ha invitado.`,
    },
    en: {
      subject: 'Welcome to CAFFT',
      body: `Hi ${username},\n\n${invitedBy} has created an account for you on CAFFT, the fear-of-flying treatment programme of the Universitat de les Illes Balears.\n\nYour username is: ${username}\n\nTo get started, choose your password at this link (valid for 7 days, single use):\n\n${link}\n\nIf the link has expired, ask the person who invited you for a new one.`,
    },
  }[lang];
  return { subject: t.subject, body: `${t.body}\n\n${SIGNATURE[lang]}` };
}

const FEEDBACK_TYPES: Record<string, string> = {
  bug: 'Error / problema',
  improvement: 'Mejora sugerida',
  testimonial: 'Testimonio / experiencia',
  other: 'Otro',
};

const USER_TYPES: Record<string, string> = {
  patient: 'paciente',
  therapist: 'terapeuta',
  manager: 'gestor',
  superadmin: 'superadmin',
  guest: 'sin sesión',
};

/**
 * Notice to the CAFFT team about new feedback. Always in Spanish: it goes to
 * the team, not to the user who wrote it.
 */
export function feedbackMail(f: {
  type: string;
  rating: number;
  comment: string;
  username: string;
  userType: string;
  contact: string | null;
  page: string | null;
  language: string | null;
  userAgent: string | null;
  viewport: string | null;
  at: Date;
}): { subject: string; body: string } {
  const type = FEEDBACK_TYPES[f.type] ?? f.type;
  const firstLine = f.comment.trim().split('\n')[0];
  const excerpt = firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
  const lines = [
    `Tipo: ${type}`,
    `Valoración: ${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)} (${f.rating}/5)`,
    `Usuario: ${f.username} (${USER_TYPES[f.userType] ?? f.userType})`,
    `Contacto: ${f.contact || 'no indicado'}`,
    `Página: ${f.page || 'desconocida'}`,
    `Idioma: ${f.language || 'desconocido'}`,
    `Pantalla: ${f.viewport || 'desconocida'}`,
    `Navegador: ${f.userAgent || 'desconocido'}`,
    `Fecha: ${f.at.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}`,
  ];
  return {
    subject: `CAFFT feedback · ${type}: ${excerpt}`,
    body: `${f.comment.trim()}\n\n—\n${lines.join('\n')}\n\nEnviado desde el formulario de feedback de CAFFT.`,
  };
}

/**
 * The reminders the server sends by itself (src/reminders.ts). No clinical
 * information: only that there is a session, or that it has been a while.
 * `push` is the same message for a notification on the phone or computer.
 */
export interface ReminderMessage {
  subject: string;
  body: string;
  push: { title: string; body: string };
}

function reminderFooter(lang: Lang, unsubscribeLink: string): string {
  return {
    ca: `Si no vol rebre més recordatoris, desactivi'ls aquí:\n${unsubscribeLink}\n\nTambé ho pot fer des del seu perfil.`,
    es: `Si no quiere recibir más recordatorios, desactívelos aquí:\n${unsubscribeLink}\n\nTambién puede hacerlo desde su perfil.`,
    en: `If you no longer want these reminders, turn them off here:\n${unsubscribeLink}\n\nYou can also do it from your profile.`,
  }[lang];
}

export function sessionReminderMail(lang: Lang, username: string, time: string, appUrl: string, unsubscribeLink: string): ReminderMessage {
  const t = {
    ca: {
      subject: `CAFFT: té una sessió avui a les ${time}`,
      text: `Té programada una sessió del CAFFT avui a les ${time}.`,
      body: `Hola ${username},\n\nTé programada una sessió del CAFFT avui a les ${time}. Busqui un moment tranquil i un lloc on pugui estar sense interrupcions.\n\n${appUrl}`,
    },
    es: {
      subject: `CAFFT: tiene una sesión hoy a las ${time}`,
      text: `Tiene programada una sesión del CAFFT hoy a las ${time}.`,
      body: `Hola ${username}:\n\nTiene programada una sesión del CAFFT hoy a las ${time}. Busque un momento tranquilo y un lugar donde pueda estar sin interrupciones.\n\n${appUrl}`,
    },
    en: {
      subject: `CAFFT: you have a session today at ${time}`,
      text: `You have a CAFFT session planned today at ${time}.`,
      body: `Hi ${username},\n\nYou have a CAFFT session planned today at ${time}. Find a quiet moment and a place where you will not be interrupted.\n\n${appUrl}`,
    },
  }[lang];
  return {
    subject: t.subject,
    body: `${t.body}\n\n${reminderFooter(lang, unsubscribeLink)}\n\n${SIGNATURE[lang]}`,
    push: { title: 'CAFFT', body: t.text },
  };
}

export function inactivityReminderMail(lang: Lang, username: string, appUrl: string, unsubscribeLink: string): ReminderMessage {
  const t = {
    ca: {
      subject: 'CAFFT: quan li vagi bé, pot continuar',
      text: 'Fa uns dies que no fa cap sessió del CAFFT. Quan li vagi bé, pot continuar on ho va deixar.',
      body: `Hola ${username},\n\nFa uns dies que no fa cap sessió del CAFFT. És normal que costi trobar el moment; quan li vagi bé, pot continuar on ho va deixar.\n\n${appUrl}`,
    },
    es: {
      subject: 'CAFFT: cuando le vaya bien, puede continuar',
      text: 'Hace unos días que no hace ninguna sesión del CAFFT. Cuando le vaya bien, puede continuar donde lo dejó.',
      body: `Hola ${username}:\n\nHace unos días que no hace ninguna sesión del CAFFT. Es normal que cueste encontrar el momento; cuando le vaya bien, puede continuar donde lo dejó.\n\n${appUrl}`,
    },
    en: {
      subject: 'CAFFT: whenever suits you, you can carry on',
      text: "It has been a few days since your last CAFFT session. Whenever suits you, you can carry on where you left off.",
      body: `Hi ${username},\n\nIt has been a few days since your last CAFFT session. Finding the moment is not always easy; whenever suits you, you can carry on where you left off.\n\n${appUrl}`,
    },
  }[lang];
  return {
    subject: t.subject,
    body: `${t.body}\n\n${reminderFooter(lang, unsubscribeLink)}\n\n${SIGNATURE[lang]}`,
    push: { title: 'CAFFT', body: t.text },
  };
}

/** The app's link to turn reminders off without logging in. */
export function unsubscribeLink(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/*$/, '/')}#/reminders-off/${token}`;
}

/**
 * The welcome email of a patient their therapist registered: what CAFFT is,
 * how long it takes, what they need, who their therapist is, and one button
 * (the link to choose their password). DRAFT: the team reviews these texts.
 */
export function patientWelcomeMail(lang: Lang, username: string, therapist: { name: string; email: string } | null, link: string): { subject: string; body: string } {
  const contact = therapist
    ? {
        ca: `La persona que l'acompanyarà en el programa és ${therapist.name}. Si té qualsevol dubte, li pot escriure a ${therapist.email}.`,
        es: `La persona que le acompañará en el programa es ${therapist.name}. Si tiene cualquier duda, puede escribirle a ${therapist.email}.`,
        en: `The person who will support you through the programme is ${therapist.name}. If you have any questions, you can write to them at ${therapist.email}.`,
      }[lang]
    : '';
  const t = {
    ca: {
      subject: 'Benvingut/da al CAFFT',
      body: `Hola ${username},\n\nLi donam la benvinguda al CAFFT, el programa de la Universitat de les Illes Balears per superar la por a volar.\n\nCom funciona: mirarà vídeos de situacions d'un vol, de menys a més difícils, des del seu ordinador, tauleta o mòbil. Són fins a 8 sessions d'uns 30 a 45 minuts; en recomanam 2 o 3 per setmana.\n\nQuè necessita: un lloc tranquil, auriculars i uns minuts per començar. El primer dia li demanarem el consentiment, li ensenyarem com funciona i respondrà un qüestionari.\n\n${contact}\n\nPer començar, triï la seva contrasenya (l'enllaç és vàlid 7 dies):\n\n${link}\n\nEl seu nom d'usuari és: ${username}`,
    },
    es: {
      subject: 'Bienvenido/a al CAFFT',
      body: `Hola ${username}:\n\nLe damos la bienvenida al CAFFT, el programa de la Universitat de les Illes Balears para superar el miedo a volar.\n\nCómo funciona: verá vídeos de situaciones de un vuelo, de menos a más difíciles, desde su ordenador, tableta o móvil. Son hasta 8 sesiones de unos 30 a 45 minutos; le recomendamos 2 o 3 por semana.\n\nQué necesita: un lugar tranquilo, auriculares y unos minutos para empezar. El primer día le pediremos el consentimiento, le enseñaremos cómo funciona y responderá un cuestionario.\n\n${contact}\n\nPara empezar, elija su contraseña (el enlace es válido 7 días):\n\n${link}\n\nSu nombre de usuario es: ${username}`,
    },
    en: {
      subject: 'Welcome to CAFFT',
      body: `Hi ${username},\n\nWelcome to CAFFT, the Universitat de les Illes Balears programme for overcoming the fear of flying.\n\nHow it works: you will watch videos of situations in a flight, from easier to harder, on your computer, tablet or phone. There are up to 8 sessions of about 30 to 45 minutes; we recommend 2 or 3 a week.\n\nWhat you need: a quiet place, headphones and a few minutes to start. On the first day we will ask for your consent, show you how it works, and you will fill in a questionnaire.\n\n${contact}\n\nTo get started, choose your password (the link is valid for 7 days):\n\n${link}\n\nYour username is: ${username}`,
    },
  }[lang];
  return { subject: t.subject, body: `${t.body.replace(/\n\n\n\n/g, '\n\n')}\n\n${SIGNATURE[lang]}` };
}

/** The day after the planned flight: how did it go? DRAFT for the team. */
export function flightQuestionMail(lang: Lang, username: string, reportLink: string, unsubscribeLink: string): ReminderMessage {
  const t = {
    ca: {
      subject: 'CAFFT: com ha anat el vol?',
      text: "Com ha anat el vol? Ens ajudaria molt que ens ho expliqués en un minut.",
      body: `Hola ${username},\n\nVostè tenia previst volar aquests dies. Com ha anat? Ens ajudaria molt que ens ho expliqués: són tres preguntes i un minut.\n\n${reportLink}\n\nSi encara no ha volat, també ens ho pot dir allà.`,
    },
    es: {
      subject: 'CAFFT: ¿cómo ha ido el vuelo?',
      text: '¿Cómo ha ido el vuelo? Nos ayudaría mucho que nos lo contara en un minuto.',
      body: `Hola ${username}:\n\nUsted tenía previsto volar estos días. ¿Cómo ha ido? Nos ayudaría mucho que nos lo contara: son tres preguntas y un minuto.\n\n${reportLink}\n\nSi todavía no ha volado, también nos lo puede decir allí.`,
    },
    en: {
      subject: 'CAFFT: how did the flight go?',
      text: 'How did the flight go? It would help us a lot if you told us in a minute.',
      body: `Hi ${username},\n\nYou were planning to fly around now. How did it go? It would help us a lot if you told us: three questions, one minute.\n\n${reportLink}\n\nIf you have not flown yet, you can tell us there too.`,
    },
  }[lang];
  return {
    subject: t.subject,
    body: `${t.body}\n\n${reminderFooter(lang, unsubscribeLink)}\n\n${SIGNATURE[lang]}`,
    push: { title: 'CAFFT', body: t.text },
  };
}
