// JSON schemas shared by several routes. Bodies are validated against these
// before any handler runs; unknown properties are rejected (see app.ts).

export const uuid = { type: 'string', minLength: 1, maxLength: 64 } as const;
export const timestamp = { type: 'integer', minimum: 0 } as const;
export const shortText = (maxLength: number) => ({ type: 'string', maxLength }) as const;

export const username = { type: 'string', minLength: 3, maxLength: 64, pattern: '^[A-Za-z0-9._-]+$' } as const;
export const email = { type: 'string', format: 'email', maxLength: 254 } as const;
export const password = { type: 'string', minLength: 1, maxLength: 256 } as const;

export const notificationPreferences = {
  type: 'object',
  additionalProperties: false,
  required: ['enabled', 'reminders', 'newTasks', 'followUp', 'general', 'frequency', 'startTime', 'endTime'],
  properties: {
    enabled: { type: 'boolean' },
    reminders: { type: 'boolean' },
    newTasks: { type: 'boolean' },
    followUp: { type: 'boolean' },
    general: { type: 'boolean' },
    frequency: { enum: ['daily', 'weekly', 'custom'] },
    startTime: shortText(5),
    endTime: shortText(5),
    consentDate: timestamp,
  },
} as const;

export const qpviiScores = {
  type: 'object',
  additionalProperties: false,
  required: ['malestarGeneral', 'subPreparatius', 'subVicari', 'subVol', 'total'],
  properties: {
    malestarGeneral: { type: 'number' },
    subPreparatius: { type: 'number' },
    subVicari: { type: 'number' },
    subVol: { type: 'number' },
    total: { type: 'number' },
  },
} as const;

// QPVIIAnswers: question number -> answer (or null when skipped).
export const qpviiAnswers = {
  type: 'object',
  maxProperties: 100,
  propertyNames: { pattern: '^[0-9]{1,3}$' },
  additionalProperties: { type: ['number', 'null'] },
} as const;

export const idList = (maxItems: number) => ({ type: 'array', maxItems, items: shortText(64) }) as const;

export const discomfortRatings = {
  type: 'array',
  maxItems: 2000,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'rating', 'qpviiTimestamp', 'videoTimestamp'],
    properties: {
      id: shortText(64),
      rating: { type: 'number', minimum: 0, maximum: 10 },
      qpviiTimestamp: timestamp,
      videoTimestamp: timestamp,
    },
  },
} as const;
