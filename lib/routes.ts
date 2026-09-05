/** مسارات القالب النهائي + المسارات الحالية في تآلف */

export const APP_ROUTES = {
  home: '/',
  login: '/login',
  parent: '/parent',
  specialist: '/dashboard',
  admin: '/admin',
  clinicalHub: '/hub',
  assessment: '/assessment',
  assessmentReport: '/assessment/report',
  games: '/games',
  sensoryRoom: (childId: string) => `/sensory-room/${childId}`,
  sensoryMatching: '/sensory-matching',
  sensoryRooms: '/sensory-rooms',
  messages: '/messages',
  bookings: '/bookings',
  videoAnalysis: '/video-analysis',
  legal: '/legal',
  terms: '/terms',
  privacy: '/privacy',
  scientificBasis: '/scientific-basis',
  consent: '/consent',
  faq: '/faq',
  doctorSummary: (childId: string) => `/doctor/summary/${childId}`,
} as const;

/** الوجهات الفعلية داخل التطبيق الحالي */
export const ROUTE_ALIASES: Record<string, string> = {
  '/dashboard/parent': '/parent',
  '/dashboard/specialist': '/dashboard',
  '/dashboard/admin': '/admin',
  '/legal/terms': '/terms',
};
