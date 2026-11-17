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
  closed: 'RiverHacks 2026 is complete. Thank you for participating!',
  spaceApps: 'Online Participation through',
  // Post-event (Nov 16, 2026): replaces the online-participation line in the hero.
  thanks:
    'Thank you to every participant, mentor, judge, volunteer and sponsor who made this weekend happen. Keep building.',
} as const;

// --- Legal / minors ---------------------------------------------------------
// Filling a URL below swaps the public "coming soon" text for a real link.
// TODO(Stefano): parent/guardian consent form URL (link out only, no uploads).
export const CONSENT_FORM_URL = '';
// TODO(Stefano): RiverHacks Participant Waiver URL.
export const WAIVER_URL = '';
export const FORMS_COMING_SOON =
  'Sent by email to registered participants. Forms are not accepted on site.';

// Consent form deadline. Stefano set October 29 (the orientation day) as the
// one signing deadline on 2026-10-20, replacing Oct 17 and Oct 25.
export const MINORS_DEADLINE = 'October 29, 2026';

// Guardian Google Meet orientation. Moved by Stefano on 2026-10-16 from the two
// sessions (Fri Oct 16 and Sat Oct 17) to one session on Thu Oct 29. No time is
// set yet: keep `time` null until one is decided, and the page says
// "Time to be announced". Never fill in a guessed time.
export const ORIENTATION = {
  date: 'Thursday, October 29, 2026',
  dateShort: 'October 29, 2026',
  time: null as string | null,
  timeTba: 'Time to be announced',
  // The existing Saturday session Meet room (created 2026-09-27), reused.
  meet: 'https://meet.google.com/yeh-hqhd-kdd',
  formLine: 'The form needs to be signed by October 29, 2026.',
} as const;
export const SPACE_APPS_LEGAL_URL = 'https://www.spaceappschallenge.org/legal/';
export const MINORS_NOTICE =
  'Under 18 on November 14? A registered supervising adult must stay on campus with you. No signed form, no badge.';
export const LEGAL_MINORS_HREF = '/legal#minors';

// --- Secured sponsors -------------------------------------------------------
export const SPONSORS = {
  title: {
    tier: 'Title Sponsor',
    name: 'SerpApi',
    url: 'https://serpapi.com/',
    logo: '/brand/serpapi-logo-white.svg',
    width: 1764,
    height: 439,
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
  gold: {
    tier: 'Gold Sponsor',
    name: 'Firefly Aerospace',
    url: 'https://fireflyspace.com/',
    logo: '/brand/firefly-icon.svg',
    width: 2000,
    height: 2000,
  },
} as const;

// Smaller tiers, shown as a row of logo tiles under Gold. url: null = no link.
export const SUPPORTERS = [
  {
    tier: 'Silver Sponsor',
    name: 'Loop Message',
    url: 'https://loopmessage.com/',
    logo: '/brand/loopmessage-logo.svg',
    width: 1024,
    height: 867,
  },
  {
    tier: 'Startup Supporter',
    name: 'AI Security Engineering Austin',
    url: null,
    logo: '/brand/aiseceng-logo-white.svg',
    width: 292,
    height: 71,
  },
  {
    tier: 'Food Sponsor',
    name: 'Whole Foods Market',
    url: 'https://www.wholefoodsmarket.com/',
    logo: '/brand/wholefoods-logo.svg',
    width: 725,
    height: 725,
  },
] as const;

export const SPACE_APPS_URL = 'https://www.spaceappschallenge.org/';

// Deep link to the Austin local event on the Space Apps site — where NASA
// Global Track entrants actually register.
export const SPACE_APPS_AUSTIN_URL =
  'https://www.spaceappschallenge.org/2026/local-events/austin/?utm_source=luma';

export const EVENT = {
  name: 'RiverHacks × NASA Space Apps Challenge',
  year: '2026',
  tagline: 'Innovate. Collaborate. Launch change.',
  headline: ['One weekend.', 'One project.', 'Two competitions.'],

  intro:
    'RiverHacks is Austin Community College’s official hackathon — partnering with the NASA Space Apps Challenge in Austin to join the world’s largest global space & science hackathon, themed “The Next Frontier.” Two days, in person, alongside 17 international space agencies.',

  dates: {
    label: 'November 14–15, 2026',
    iso: { start: '2026-11-14T08:00:00-06:00', end: '2026-11-15T17:30:00-06:00' },
    startTime: '8:00 AM CST',
  },

  venue: {
    city: 'Austin, Texas',
    name: 'Austin Community College — Rio Grande Campus',
    building: 'Building 1000',
    street: '1212 Rio Grande St',
    cityStateZip: 'Austin, TX 78701',
    note: 'Registrations are closed',
    mapUrl:
      'https://www.google.com/maps/search/?api=1&query=Austin+Community+College+Rio+Grande+Campus+1212+Rio+Grande+St+Austin+TX+78701',
  },

  contacts: [
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
  { value: 'Closed', label: 'Registration', accent: 'ink' },
  { value: '$10,950', label: 'In prizes', accent: 'gold' },
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
    body: 'One theme: Build Something Great. Your project must work, be demoed, and live on GitHub. Perfect for creative, interdisciplinary or first-time teams.',
    themes: [],
    link: null,
  },
] as const;

export const TRACKS_BRIDGE = 'Do both — with one single project';

// --- Prizes -----------------------------------------------------------------
export const PRIZES = {
  total: '$10,950',
  groups: [
    {
      label: 'High school and college',
      subtotal: '$10,000',
      awards: [
        { medal: '🥇', place: '1st place', amount: '$3,000', accent: 'gold' },
        { medal: '🥈', place: '2nd place', amount: '$1,500', accent: 'ink' },
        { medal: '🥉', place: '3rd place', amount: '$500', accent: 'ink' },
        {
          medal: '🤖',
          place: 'Bold Innovation in Search & AI',
          amount: '$5,000',
          accent: 'violet',
          note: 'from SerpApi · allocated across teams that achieve bold innovation in search and AI; they do not have to be the top-three winners',
        },
      ],
    },
    {
      label: 'Middle school',
      subtotal: '$950',
      awards: [
        { medal: '🥇', place: '1st place', amount: '$500', accent: 'gold' },
        { medal: '🥈', place: '2nd place', amount: '$300', accent: 'ink' },
        { medal: '🥉', place: '3rd place', amount: '$150', accent: 'ink' },
      ],
    },
  ],
} as const;

// --- ElevenLabs (in-kind, not part of the cash pool) ------------------------
export const ELEVENLABS = {
  prizes: [
    {
      place: 'Overall winning team',
      detail: 'Each team member receives 3 months of the Pro tier ($297 value per team member, 600k credits/mo).',
    },
    {
      place: 'Best Project Built with ElevenLabs',
      detail: 'Each team member receives 3 months of the Scale tier ($897 value per team member, 1.8M credits/mo).',
    },
  ],
  everyone: '1 month free of the Creator tier (normally $22/month, 131k credits).',
  discord: 'https://discord.com/invite/VnBvbbcdEC',
  tutorial: 'https://youtu.be/S143_JtCtV8',
  guide: 'https://docs.google.com/document/d/1mCh5MtOzBw0aJpurQVUmIVFfPMAHW3MjNemE-LNiMto/edit?usp=sharing',
} as const;

// --- SerpApi participant perks ----------------------------------------------
export const SERPAPI_PERKS = {
  careers: 'https://serpapi.com/careers',
  careersSubject: 'RiverHacks - NASA participant: [The role you are applying for]',
  coupon: 'https://serpapi.com/riverhacksnasa',
} as const;

// --- NASA submission --------------------------------------------------------
export const NASA_SUBMIT = {
  teamsUrl: 'https://www.spaceappschallenge.org/2026/local-events/austin/?tab=teams',
  guideUrl: 'https://www.youtube.com/playlist?list=PLTPrbzl1eIYU',
} as const;

export const DISCORD_URL = 'https://discord.gg/JeUCYDZ7H';

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
  { date: 'Nov 14–15', label: 'Hackathon weekend · 8:00 AM CST', done: false },
] as const;

// --- Weekend agenda ---------------------------------------------------------
// Mirrors the Schedule in the welcome packet sent to participants (Nov 9).
export const AGENDA = [
  {
    day: 'Saturday',
    date: 'November 14',
    accent: 'cyan',
    items: [
      { time: '8:00 AM', label: 'Doors open, check-in' },
      { time: '9:00 AM – 12:00 PM', label: 'Elementary activation in the library (level 0)' },
      { time: '10:00 AM', label: 'Opening ceremony' },
      { time: '11:00 AM', label: 'Hacking starts' },
      { time: '12:45 PM', label: 'Lunch' },
      { time: '2:00 PM', label: 'Optional breakout sessions with mentors' },
      { time: '4:30 PM', label: '30-minute warning for participants under 18' },
      {
        time: '5:00 PM',
        label: 'Participants under 18 leave with their supervising adult and keep working online from home',
      },
      { time: 'Overnight', label: 'Hacking continues, 18+ only' },
    ],
  },
  {
    day: 'Sunday',
    date: 'November 15',
    accent: 'pink',
    items: [
      { time: '8:00 AM', label: 'Check-in starts. Participants under 18 return with their yellow card' },
      { time: '1:00 PM', label: 'RiverHacks submission deadline (GitHub)' },
      { time: '2:00 PM', label: 'Pitch competition' },
      { time: 'By 5:30 PM', label: 'Winners announced, event done' },
      { time: '11:59 PM', label: 'NASA global submission deadline' },
    ],
  },
] as const;

// --- How to participate -----------------------------------------------------
export const STEPS = [
  {
    n: 1,
    text: 'Registrations are closed.',
    link: null,
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
    'Nov 14–15, 2026 · Austin, TX. The event is complete. Thank you for participating. $10,950 in prizes, all skill levels. One weekend, one project, two competitions.',
} as const;
