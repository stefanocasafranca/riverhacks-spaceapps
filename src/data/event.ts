/**
 * Single source of truth for every piece of copy on the page.
 *
 * All content is transcribed from the three 2026 flyers:
 *   - IconCover.png                                        (brand lockup + tagline)
 *   - RiverHacks×NASASpaceAppsChallenge2026.png            (event details)
 *   - RiverHacks×NASASpaceAppsChallenge2026-SponsorshipTiers.png (sponsorship)
 *
 * Change a price, a deadline, or a benefit here and it updates everywhere.
 */

// Luma event page. Registration is CLOSED (all 200 seats filled), so nothing
// on the site links here as a call to action any more. Kept for the JSON-LD.
export const REGISTER_URL = 'https://luma.com/n9rvutt0';

// --- Registration status ----------------------------------------------------
export const REGISTRATION = {
  closed: 'Registration is closed.',
  full: 'All 200 seats are filled.',
  spaceApps: 'Anyone can still join NASA Space Apps online.',
  waitlist: 'ACC students: join the waitlist and we will contact you as seats open.',
  waitlistCta: 'Join the ACC student waitlist',
} as const;

// Google Form for the ACC-student waitlist (opened after Luma filled up).
export const WAITLIST_URL = 'https://forms.gle/C9gL4xihfYZzbvN88';

// --- Legal / minors ---------------------------------------------------------
// Filling a URL below swaps the public "coming soon" text for a real link.
// TODO(Stefano): parent/guardian consent form URL (link out only, no uploads).
export const CONSENT_FORM_URL = '';
// TODO(Stefano): RiverHacks Participant Waiver URL.
export const WAIVER_URL = '';
export const FORMS_COMING_SOON =
  'Coming soon, available by October 5, 2026. We are finalizing it with ACC.';

// Minors must finish the consent form AND one orientation by this date.
export const MINORS_DEADLINE = 'October 17, 2026';

const ORIENTATION_TITLE = 'RiverHacks guardian orientation (required)';
const ORIENTATION_PAGE = 'https://riverhacks-spaceapps.org/legal#orientation';
const orientationDetails = (meet: string) =>
  `Required to participate in RiverHacks 2026 for participants under 18. Parents and guardians attend one session; participants are strongly recommended to join them. Google Meet: ${meet} . Details: ${ORIENTATION_PAGE}`;

const googleCalUrl = (start: string, end: string, meet: string) =>
  'https://calendar.google.com/calendar/render?' +
  new URLSearchParams({
    action: 'TEMPLATE',
    text: ORIENTATION_TITLE,
    dates: `${start}/${end}`,
    details: orientationDetails(meet),
    location: meet,
  }).toString().replace('%2F', '/');

const MEET_OCT16 = 'https://meet.google.com/akp-uzww-hsp';
const MEET_OCT17 = 'https://meet.google.com/yeh-hqhd-kdd';

export const ORIENTATION = {
  // A guardian attends ONE of these sessions (Google Meet). Times in UTC for calendars.
  sessions: [
    {
      id: 'oct16',
      label: 'Friday, October 16, 2026, 7:00 to 7:45 PM CT',
      meet: MEET_OCT16,
      google: googleCalUrl('20261017T000000Z', '20261017T004500Z', MEET_OCT16),
      ics: '/calendar/orientation-oct16.ics',
    },
    {
      id: 'oct17',
      label: 'Saturday, October 17, 2026, 10:30 to 11:15 AM CT',
      meet: MEET_OCT17,
      google: googleCalUrl('20261017T153000Z', '20261017T161500Z', MEET_OCT17),
      ics: '/calendar/orientation-oct17.ics',
    },
  ],
} as const;
export const SPACE_APPS_LEGAL_URL = 'https://www.spaceappschallenge.org/legal/';
export const LEGAL_CONTACT = 'stefano.casafrancalaos@austincc.edu';
export const MINORS_NOTICE =
  'Under 18 on November 14? A parent or guardian must complete these steps by October 17.';
export const LEGAL_MINORS_HREF = '/legal#minors';

// --- Secured sponsors -------------------------------------------------------
export const SPONSORS = {
  title: {
    tier: 'Title Sponsor',
    name: 'SerpApi',
    url: 'https://serpapi.com/',
    logo: '/brand/serpapi-logo-white.svg',
    width: 4680,
    height: 1340,
    credit: 'RiverHacks, powered by SerpApi',
  },
  platinum: {
    tier: 'Platinum Sponsor',
    name: 'ElevenLabs',
    url: 'https://elevenlabs.io/',
    logo: '/brand/elevenlabs-logo-white.svg',
    width: 694,
    height: 90,
  },
} as const;

export const SPONSOR_TIER_SHEET_URL =
  'https://drive.google.com/file/d/14MeobzzVha0luoRpQjlkobB8TLWZ7YjC/view';
export const SPONSOR_CONTACT = 'stefano.casafrancalaos@austincc.edu';

export const SPACE_APPS_URL = 'https://www.spaceappschallenge.org/';

// Deep link to the Austin local event on the Space Apps site — where NASA
// Global Track entrants actually register.
export const SPACE_APPS_AUSTIN_URL =
  'https://www.spaceappschallenge.org/2026/local-events/austin/?utm_source=luma';

export const EVENT = {
  name: 'RiverHacks × NASA Space Apps Challenge',
  year: '2026',
  tagline: 'Innovate. Collaborate. Launch change.',
  sponsorTagline: 'The world. Your ideas. One weekend to launch change.',
  headline: ['One weekend.', 'One project.', 'Two competitions.'],

  intro:
    'RiverHacks is Austin Community College’s official hackathon — partnering with the NASA Space Apps Challenge in Austin to join the world’s largest global space & science hackathon, themed “The Next Frontier.” Two days, in person, alongside 17 international space agencies.',

  dates: {
    label: 'November 14–15, 2026',
    iso: { start: '2026-11-14T09:00:00-06:00', end: '2026-11-15T23:59:00-06:00' },
    startTime: '9:00 AM CST',
  },

  venue: {
    city: 'Austin, Texas',
    name: 'Austin Community College — Rio Grande Campus',
    building: 'Building 1000',
    street: '1212 Rio Grande St',
    cityStateZip: 'Austin, TX 78701',
    note: 'Registration closed · ACC student waitlist open',
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=Austin+Community+College+Rio+Grande+Campus+1212+Rio+Grande+St+Austin+TX+78701',
  },

  contacts: [
    { email: 'stefano.casafrancalaos@austincc.edu' },
    { email: 'gayathri.swa@gmail.com' },
  ],

  titlePartner: {
    name: 'SerpApi',
    blurb: 'Free API credits for every participant',
    url: 'https://serpapi.com/',
  },
} as const;

// --- Hero stat bar (event flyer) -------------------------------------------
export const STATS = [
  { value: '200', label: 'Seats filled', accent: 'ink' },
  { value: '$10,000', label: 'In prizes', accent: 'gold' },
  { value: 'Free', label: 'To enter', accent: 'cyan' },
  { value: 'All', label: 'Skill levels', accent: 'violet' },
] as const;

// --- The two tracks ---------------------------------------------------------
export const TRACKS = [
  {
    id: 'nasa',
    name: 'NASA Global Track',
    kicker: 'Use real NASA open data',
    accent: 'cyan',
    body: 'Pick an official NASA challenge and build with open data from NASA and its partner agencies. Winners advance to the global awards and a NASA Center celebration.',
    themes: [],
    link: {
      href: SPACE_APPS_AUSTIN_URL,
      label: 'View the Austin event on Space Apps',
    },
  },
  {
    id: 'riverhacks',
    name: 'RiverHacks Track',
    kicker: 'No NASA dataset required',
    accent: 'pink',
    body: 'One challenge: Build Something Great. Perfect for creative, interdisciplinary or first-time teams.',
    themes: [
      'Mind of the Astronaut',
      'On-Ship Ecosystem',
      'AI for Space',
      'Space Play & Fitness',
      'AI Space Search',
      'Spacesuit AR',
    ],
    link: null,
  },
] as const;

export const TRACKS_BRIDGE = 'Do both — with one single project';

// --- Prizes -----------------------------------------------------------------
export const PRIZES = {
  total: '$10,000',
  awards: [
    { medal: '🥇', place: '1st place overall', amount: '$3,000', accent: 'gold' },
    { medal: '🥈', place: '2nd place overall', amount: '$1,500', accent: 'ink' },
    { medal: '🥉', place: '3rd place overall', amount: '$500', accent: 'ink' },
    {
      medal: '🤖',
      place: 'Bold Innovation in Search & AI',
      amount: '$5,000',
      accent: 'violet',
      note: 'presented by SerpApi · allocated by special jury',
    },
  ],
} as const;

// --- The two Sunday deadlines ----------------------------------------------
export const DEADLINES = [
  {
    time: '1:00 PM CST',
    accent: 'cyan',
    label: 'RiverHacks submission',
    detail: 'judged in Austin',
  },
  {
    time: '11:59 PM CST',
    accent: 'pink',
    label: 'NASA global submission',
    detail: 'winners announced Jan 2027',
  },
] as const;

// --- Milestone timeline -----------------------------------------------------
export const TIMELINE = [
  { date: 'Aug 26', label: 'NASA registration opens', done: true },
  { date: 'Sept 17', label: 'Challenge summaries released', done: false },
  { date: 'Oct 28', label: 'Full challenge statements', done: false },
  { date: 'Nov 14–15', label: 'Hackathon weekend · 9:00 AM CST', done: false },
] as const;

// --- How to participate -----------------------------------------------------
export const STEPS = [
  {
    n: 1,
    text: 'Registration on Luma is closed: all 200 seats are filled. ACC students can join the waitlist.',
    link: { href: WAITLIST_URL, label: 'Join the ACC student waitlist' },
  },
  {
    n: 2,
    text: 'Registered? Also register at spaceappschallenge.org and choose Austin.',
    link: { href: SPACE_APPS_AUSTIN_URL, label: 'spaceappschallenge.org' },
  },
  {
    n: 3,
    text: 'Show up Nov 14 — teams of up to 6, or form one on the spot.',
    link: null,
  },
] as const;

// --- Sponsorship ------------------------------------------------------------
export const SPONSOR_AUDIENCE = [
  { value: 'All', label: 'Local universities represented' },
  { value: '200', label: 'Max participants' },
  { value: '$10K', label: 'In prizes' },
  { value: 'K–12', label: 'Middle & high schools in Central Austin' },
] as const;

// Tiers still open. Title (SerpApi) and Platinum (ElevenLabs) are secured and
// shown as logos in SPONSORS above. Ordered largest first.
export const TIERS = [
  {
    id: 'gold',
    name: 'Gold Sponsor',
    price: '$5,000',
    accent: 'gold',
    icon: '🏆',
    status: { label: 'Available', tone: 'open' },
    benefits: [
      '30-minute workshop or tech talk on the schedule',
      'Logo on the main stage and winners’ backdrop',
      'Logo on every participant’s certificate',
      'Plus everything in Silver',
    ],
  },
  {
    id: 'silver',
    name: 'Silver Sponsor',
    price: '$2,500',
    accent: 'cyan',
    icon: '🥈',
    status: { label: 'Available', tone: 'open' },
    benefits: [
      'Logo on participant T-shirts and stickers',
      'Two minutes on the main stage at opening',
      'A sponsor table, both days',
      'Plus everything in Startup Supporter',
    ],
  },
  {
    id: 'startup',
    name: 'Startup Supporter',
    price: 'Under $1,000',
    accent: 'pink',
    icon: '🚀',
    status: { label: 'Available', tone: 'open' },
    benefits: [
      'Logo on the event site and welcome packet',
      'Social media shout-out',
    ],
  },
] as const;

export const SPONSOR_CLOSER = {
  lines: ['Build solutions.', 'Inspire the future.'],
  script: 'Leave Your Mark.',
} as const;

// --- Scroll chapters --------------------------------------------------------
// Shared between the DOM (section data-chapter attributes) and the three.js
// camera spline, so the copy and the scene never drift apart.
export const CHAPTERS = ['pad', 'ascent', 'orbit', 'transit', 'mars'] as const;
export type Chapter = (typeof CHAPTERS)[number];

// Attribution required by the licences on the 3D assets we ship.
// Earth (NASA Blue Marble) is public domain and needs none; these do.
export const CREDITS = [
  {
    what: 'Starship model',
    title: 'SpaceX Starship — With landing legs deployed',
    author: 'AllThingsSpace',
    authorUrl: 'https://sketchfab.com/sunnychen753',
    workUrl:
      'https://sketchfab.com/3d-models/spacex-starship-with-landing-legs-deployed-168d98f7b4d747f88d301050ae645560',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    what: 'Mars surface map',
    title: 'Solar System Scope texture library',
    author: 'Solar System Scope',
    authorUrl: 'https://www.solarsystemscope.com/textures/',
    workUrl: 'https://www.solarsystemscope.com/textures/',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
] as const;

export const SEO = {
  title: 'RiverHacks 2026 — Austin’s NASA Space Apps Challenge',
  description:
    'Nov 14–15, 2026 · Austin, TX. Registration is closed: all 200 seats are filled. $10,000 in prizes, all skill levels. One weekend, one project, two competitions.',
} as const;
