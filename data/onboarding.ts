import {
  ghanaRegions,
  isMinor,
  sports,
  sportPositions,
  type FieldOption,
  type RoleFlow,
  type Values,
} from '@/lib/onboarding'

const passwordField = {
  id: 'password',
  label: 'Password',
  type: 'password' as const,
  placeholder: 'At least 8 characters',
  required: true,
}

const accountStep = {
  id: 'account',
  eyebrow: 'Step 01',
  title: 'Create your login.',
  intro: 'This is how you get back into your Demo Day account on any device.',
  fields: [
    { id: 'firstName', label: 'First name', type: 'text' as const, placeholder: 'Ama', required: true },
    { id: 'lastName', label: 'Last name', type: 'text' as const, placeholder: 'Mensah', required: true },
    { id: 'email', label: 'Email', type: 'email' as const, placeholder: 'you@example.com', required: true },
    passwordField,
  ],
}

const mediaConsentCopy =
  'I give separate, specific consent for images, video and performance data of this person to be used in Demo Day profiles, scout reports and event coverage. This can be withdrawn at any time.'

const playerGuardianStep = {
  id: 'guardian',
  eyebrow: 'Step 07',
  title: 'Guardian identity & consent.',
  intro: 'Under-18 accounts stay dormant until a verified guardian consents. Registration consent and media consent are recorded separately, exactly as the safeguarding standard requires.',
  fields: [
    { id: 'guardianName', label: 'Guardian full name', type: 'text' as const, placeholder: 'Kwame Mensah', required: true },
    {
      id: 'guardianRelationship',
      label: 'Relationship to athlete',
      type: 'choice' as const,
      required: true,
      options: [
        { value: 'parent', label: 'Parent' },
        { value: 'guardian', label: 'Legal guardian' },
        { value: 'grandparent', label: 'Grandparent' },
        { value: 'sibling', label: 'Older sibling (18+)' },
        { value: 'other', label: 'Other carer' },
      ],
    },
    { id: 'guardianPhone', label: 'Guardian phone', type: 'tel' as const, placeholder: '+233 24 000 0000', required: true },
    { id: 'guardianEmail', label: 'Guardian email', type: 'email' as const, placeholder: 'guardian@example.com', required: true },
    { id: 'guardianAddress', label: 'Home address', type: 'text' as const, placeholder: 'Area, city', span: 2 as const },
    { id: 'consentParticipation', label: 'Participation consent', type: 'consent' as const, required: true, span: 2 as const, hint: 'Required before the account activates.' },
    { id: 'consentMedia', label: 'Media & image use consent', type: 'consent' as const, required: true, span: 2 as const, hint: mediaConsentCopy },
    { id: 'consentSafeguarding', label: 'Safeguarding communications', type: 'consent' as const, required: true, span: 2 as const, hint: 'I accept safeguarding notices, event-day protocols and escalation contacts by email and SMS.' },
    { id: 'consentFinancial', label: 'No outside offers declaration', type: 'consent' as const, required: true, span: 2 as const, hint: 'I understand that any financial offer or gift to a minor outside documented Demo Day processes must be reported immediately.' },
  ],
}

const playerAdultConsentStep = {
  id: 'consent',
  eyebrow: 'Step 07',
  title: 'Your consents.',
  intro: 'Registration consent and media consent are separate choices. You can withdraw media consent later without deleting your account.',
  fields: [
    { id: 'consentParticipation', label: 'Participation consent', type: 'consent' as const, required: true, span: 2 as const, hint: 'I agree to the Demo Day athlete terms and eligibility rules.' },
    { id: 'consentMedia', label: 'Media & image use consent', type: 'consent' as const, required: true, span: 2 as const, hint: mediaConsentCopy },
    { id: 'consentSafeguarding', label: 'Safeguarding communications', type: 'consent' as const, required: true, span: 2 as const, hint: 'I accept safeguarding notices, event-day protocols and escalation contacts.' },
    { id: 'consentFinancial', label: 'No outside offers declaration', type: 'consent' as const, required: true, span: 2 as const, hint: 'I understand that undocumented financial offers linked to trials or selection must be reported immediately.' },
  ],
}

const playerFlow: RoleFlow = {
  label: 'Player',
  title: 'Build your athlete profile.',
  intro: 'Registration is open to every athlete. The details you add here decide which Demo Day you are placed at, which team balances you into, and which scouts can find you.',
  idLabel: 'Athlete ID',
  idPrefix: 'DD-ATH',
  status: 'Verification pending',
  statusNote: 'Identity, age category and eligibility checks must clear before team placement.',
  dashboard: '/player',
  steps: [
    accountStep,
    {
      id: 'athlete',
      eyebrow: 'Step 02',
      title: 'Your sport & where you play.',
      intro: 'Grouping starts with sport, then constituency, district and region. This is what keeps team allocation fair.',
      fields: [
        { id: 'sport', label: 'Sport', type: 'choice' as const, required: true, span: 2 as const, options: sports },
        { id: 'dob', label: 'Date of birth', type: 'date' as const, required: true, max: new Date().toISOString().slice(0, 10) },
        { id: 'gender', label: 'Gender', type: 'choice' as const, required: true, options: [
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
        ] },
        { id: 'region', label: 'Region', type: 'select' as const, required: true, options: ghanaRegions },
        { id: 'district', label: 'Constituency / district', type: 'text' as const, placeholder: 'e.g. Ayawaso North', required: true },
        { id: 'community', label: 'Community / town', type: 'text' as const, placeholder: 'e.g. Nima' },
        { id: 'school', label: 'School or academy', type: 'text' as const, placeholder: 'Optional' },
      ],
    },
    {
      id: 'position',
      eyebrow: 'Step 03',
      title: 'How you play.',
      intro: 'Position and dominant side feed the positional-balance rules used when teams are formed.',
      fields: [
        {
          id: 'position',
          label: 'Primary position',
          type: 'choice' as const,
          required: true,
          span: 2 as const,
          optionsFor: (values: Values) => sportPositions[values.sport] ?? [],
          validate: (value: string, values: Values) =>
            (sportPositions[values.sport] ?? []).some(option => option.value === value)
              ? null
              : 'Select a position for your sport.',
        },
        { id: 'secondaryPosition', label: 'Secondary position', type: 'select' as const, optionsFor: (values: Values) => sportPositions[values.sport] ?? [] },
        {
          id: 'dominantSide',
          label: 'Dominant hand / foot',
          type: 'choice' as const,
          required: true,
          options: [
            { value: 'right', label: 'Right' },
            { value: 'left', label: 'Left' },
            { value: 'both', label: 'Both' },
          ],
        },
        { id: 'jerseyNumber', label: 'Preferred squad number', type: 'number' as const, min: '0', max: '99' },
        { id: 'height', label: 'Height (cm)', type: 'number' as const, min: '100', placeholder: '172' },
        { id: 'weight', label: 'Weight (kg)', type: 'number' as const, min: '25', placeholder: '64' },
      ],
    },
    {
      id: 'experience',
      eyebrow: 'Step 04',
      title: 'Experience & ambitions.',
      intro: 'Context static trials never capture. Scouts see this next to your evaluation data.',
      fields: [
        {
          id: 'experienceLevel',
          label: 'Highest level played',
          type: 'choice' as const,
          required: true,
          options: [
            { value: 'park', label: 'Park / community' },
            { value: 'school', label: 'School team' },
            { value: 'district', label: 'District / regional' },
            { value: 'academy', label: 'Academy / club' },
            { value: 'none', label: 'Never competed' },
          ],
        },
        { id: 'yearsPlaying', label: 'Years playing', type: 'number' as const, min: '0', placeholder: '4' },
        { id: 'previousClub', label: 'Previous club or team', type: 'text' as const, placeholder: 'Optional' },
        { id: 'bio', label: 'About your game', type: 'textarea' as const, placeholder: 'How do you play? What are you known for?', span: 2 as const },
        { id: 'goals', label: 'What are you working towards?', type: 'textarea' as const, placeholder: 'Trial, scholarship, national selection...', span: 2 as const },
      ],
    },
    {
      id: 'media',
      eyebrow: 'Step 05',
      title: 'Profile photo.',
      intro: 'One clear headshot, one action shot. Photos of minors are only published when guardian media consent is recorded.',
      fields: [
        { id: 'profilePhoto', label: 'Profile photo', type: 'photo' as const, required: true, span: 2 as const, hint: 'Face clearly visible, plain background where possible.' },
        { id: 'actionPhoto', label: 'Action photo (optional)', type: 'photo' as const, span: 2 as const },
      ],
    },
    {
      id: 'highlights',
      eyebrow: 'Step 06',
      title: 'Highlight link.',
      intro: 'A short clip does more than a long CV. Optional, but it travels further.',
      fields: [
        { id: 'highlightUrl', label: 'Highlight video link', type: 'text' as const, placeholder: 'YouTube, Drive or social link', span: 2 as const },
        { id: 'achievements', label: 'Key achievements', type: 'textarea' as const, placeholder: 'Tournament awards, captaincies, call-ups', span: 2 as const },
      ],
    },
    { ...playerGuardianStep, when: (values: Values) => isMinor(values.dob) },
    { ...playerAdultConsentStep, when: (values: Values) => !isMinor(values.dob) },
  ],
}

const scoutVettingOptions: FieldOption[] = [
  { value: 'club-academy', label: 'Club / academy' },
  { value: 'national-federation', label: 'National federation' },
  { value: 'college', label: 'College / collegiate program' },
  { value: 'independent', label: 'Independent scout' },
  { value: 'media', label: 'Media / analyst' },
]

const scoutFlow: RoleFlow = {
  label: 'Scout',
  title: 'Apply for verified scout access.',
  intro: 'Scout access is granted, not assumed. Vetted profiles only — and every scout-minor conversation is logged and visible to the safeguarding officer.',
  idLabel: 'Scout ID',
  idPrefix: 'DD-SCT',
  status: 'Vetting in progress',
  statusNote: 'Access to athlete records stays locked until safeguarding vetting clears.',
  dashboard: '/scout',
  steps: [
    accountStep,
    {
      id: 'identity',
      eyebrow: 'Step 02',
      title: 'Who you are.',
      intro: 'We verify identity before vetting. None of this is shown publicly.',
      fields: [
        { id: 'dob', label: 'Date of birth', type: 'date' as const, required: true, max: new Date().toISOString().slice(0, 10) },
        { id: 'phone', label: 'Phone', type: 'tel' as const, placeholder: '+233 24 000 0000', required: true },
        { id: 'nationality', label: 'Nationality', type: 'text' as const, placeholder: 'Ghanaian' },
        { id: 'region', label: 'Based in region', type: 'select' as const, options: ghanaRegions },
      ],
    },
    {
      id: 'professional',
      eyebrow: 'Step 03',
      title: 'Your professional standing.',
      intro: 'Who you scout for decides which athlete pools you are cleared to see.',
      fields: [
        { id: 'organisation', label: 'Club, academy or organisation', type: 'text' as const, placeholder: 'e.g. Accra Lions FC', required: true },
        {
          id: 'scoutRole',
          label: 'Your role',
          type: 'choice' as const,
          required: true,
          options: [
            { value: 'scout', label: 'Scout' },
            { value: 'coach', label: 'Coach' },
            { value: 'recruiter', label: 'Recruiter' },
            { value: 'analyst', label: 'Analyst' },
            { value: 'club-official', label: 'Club official' },
          ],
        },
        { id: 'affiliationType', label: 'Affiliation', type: 'choice' as const, required: true, span: 2 as const, options: scoutVettingOptions },
        { id: 'yearsExperience', label: 'Years in talent identification', type: 'number' as const, min: '0', placeholder: '6' },
        { id: 'referenceName', label: 'Professional reference', type: 'text' as const, placeholder: 'Full name of referee', required: true },
        { id: 'referenceContact', label: 'Reference phone or email', type: 'text' as const, placeholder: 'How we reach them', required: true },
      ],
    },
    {
      id: 'vetting',
      eyebrow: 'Step 04',
      title: 'Vetting & code of conduct.',
      intro: 'Safeguarding vetting is a precondition, not optional. No athlete records are released before this clears.',
      fields: [
        { id: 'idDocument', label: 'Government ID photo', type: 'photo' as const, required: true, span: 2 as const, hint: 'Passport or national ID. Used for vetting only, never published.' },
        { id: 'scoutCode', label: 'Scout Code of Conduct', type: 'consent' as const, required: true, span: 2 as const, hint: 'I accept the Demo Day Scout Code of Conduct: no unsupervised one-to-one contact with minors outside sanctioned sessions, no gifts or financial offers outside documented processes, and immediate disclosure of any conflict of interest.' },
        { id: 'backgroundCheck', label: 'Background check consent', type: 'consent' as const, required: true, span: 2 as const, hint: 'I consent to safeguarding background checks and to my referee being contacted.' },
        { id: 'noContactPolicy', label: 'Communication logging', type: 'consent' as const, required: true, span: 2 as const, hint: 'I understand all scout-athlete-family contact about trials, transfers or recruitment is logged and visible to the safeguarding officer.' },
      ],
    },
    {
      id: 'photo',
      eyebrow: 'Step 05',
      title: 'Profile photo.',
      intro: 'A face attached to a name keeps the network accountable.',
      fields: [
        { id: 'profilePhoto', label: 'Profile photo', type: 'photo' as const, required: true, span: 2 as const },
      ],
    },
    {
      id: 'preferences',
      eyebrow: 'Step 06',
      title: 'What you look for.',
      intro: 'These shape your watchlist and the alerts you receive before every Demo Day.',
      fields: [
        { id: 'sports', label: 'Sports you cover', type: 'multi' as const, required: true, span: 2 as const, options: sports },
        {
          id: 'positionsSought',
          label: 'Positions you are hunting',
          type: 'multi' as const,
          span: 2 as const,
          optionsFor: (values: Values) => {
            const selected = (values.sports ?? '').split(',').filter(Boolean)
            const list = selected.length ? selected : ['football']
            return list.flatMap(sport => sportPositions[sport] ?? [])
          },
        },
        { id: 'ageBands', label: 'Age bands', type: 'multi' as const, required: true, options: [
          { value: 'u14', label: 'Under 14' },
          { value: 'u16', label: 'Under 16' },
          { value: 'u18', label: 'Under 18' },
          { value: 'u21', label: 'Under 21' },
          { value: 'senior', label: 'Senior' },
        ] },
        { id: 'regionsSought', label: 'Regions you cover', type: 'multi' as const, options: ghanaRegions },
      ],
    },
  ],
}

const guardianFlow: RoleFlow = {
  label: 'Guardian',
  title: 'Stay close to every milestone.',
  intro: 'Guardians hold the consent record, see every event their athlete is entered into, and are the first point of contact for safeguarding.',
  idLabel: 'Guardian ID',
  idPrefix: 'DD-GDN',
  status: 'Link pending',
  statusNote: 'Your athlete link activates once the connected player profile is verified.',
  dashboard: '/guardian',
  steps: [
    accountStep,
    {
      id: 'identity',
      eyebrow: 'Step 02',
      title: 'Who you are.',
      intro: 'We confirm the adult behind the consent. This information is never shown on the athlete profile.',
      fields: [
        {
          id: 'relationship',
          label: 'Relationship to the athlete',
          type: 'choice' as const,
          required: true,
          span: 2 as const,
          options: [
            { value: 'parent', label: 'Parent' },
            { value: 'guardian', label: 'Legal guardian' },
            { value: 'grandparent', label: 'Grandparent' },
            { value: 'sibling', label: 'Older sibling (18+)' },
            { value: 'other', label: 'Other carer' },
          ],
        },
        { id: 'phone', label: 'Phone', type: 'tel' as const, placeholder: '+233 24 000 0000', required: true },
        { id: 'secondaryPhone', label: 'Secondary phone (optional)', type: 'tel' as const },
        { id: 'region', label: 'Region', type: 'select' as const, required: true, options: ghanaRegions },
        { id: 'address', label: 'Home address', type: 'text' as const, placeholder: 'Area, city', required: true },
      ],
    },
    {
      id: 'photo',
      eyebrow: 'Step 03',
      title: 'Profile photo.',
      intro: 'Guardian identity confirmation is part of the safeguarding record for every minor in the network.',
      fields: [
        { id: 'profilePhoto', label: 'Profile photo', type: 'photo' as const, required: true, span: 2 as const },
      ],
    },
    {
      id: 'athlete',
      eyebrow: 'Step 04',
      title: 'Link your athlete.',
      intro: 'Connect to a registered player now, or create the link once they have registered.',
      fields: [
        {
          id: 'linkMethod',
          label: 'How do you want to link?',
          type: 'choice' as const,
          required: true,
          span: 2 as const,
          options: [
            { value: 'athlete-id', label: 'I have their Athlete ID', hint: 'Shown on their profile after registration' },
            { value: 'invite', label: 'Send me an invite link', hint: 'We email a one-time linking request' },
            { value: 'later', label: 'They have not registered yet', hint: 'Link later from your dashboard' },
          ],
        },
        { id: 'athleteId', label: 'Athlete ID', type: 'text' as const, placeholder: 'DD-ATH-FTB-260142', validate: (value: string, values: Values) => {
          if (values.linkMethod !== 'athlete-id') return null
          return value ? null : 'Enter the Athlete ID to send a link request.'
        } },
        { id: 'athleteName', label: 'Athlete full name', type: 'text' as const, placeholder: 'Name as registered', validate: (value: string, values: Values) => {
          if (values.linkMethod !== 'athlete-id') return null
          return value ? null : 'Enter the athlete name for verification.'
        } },
        { id: 'athletePhone', label: 'Athlete phone (for invite)', type: 'tel' as const, validate: (value: string, values: Values) => {
          if (values.linkMethod !== 'invite') return null
          return value ? null : 'A phone number is needed to send the invite.'
        } },
      ],
    },
    {
      id: 'consent',
      eyebrow: 'Step 05',
      title: 'Consent & emergency contact.',
      intro: 'Registration consent and media consent are recorded separately, and either can be withdrawn later without deleting the account.',
      fields: [
        { id: 'emergencyContactName', label: 'Emergency contact name', type: 'text' as const, required: true },
        { id: 'emergencyContactPhone', label: 'Emergency contact phone', type: 'tel' as const, placeholder: '+233 24 000 0000', required: true },
        { id: 'medicalNotes', label: 'Medical or allergy notes (optional)', type: 'textarea' as const, placeholder: 'Seen by event medical staff only', span: 2 as const },
        { id: 'consentParticipation', label: 'Participation consent', type: 'consent' as const, required: true, span: 2 as const, hint: 'I consent to the athlete I represent taking part in Demo Day assessment and competition.' },
        { id: 'consentMedia', label: 'Media & image use consent', type: 'consent' as const, required: true, span: 2 as const, hint: mediaConsentCopy },
        { id: 'consentSafeguarding', label: 'Safeguarding communications', type: 'consent' as const, required: true, span: 2 as const, hint: 'I accept event-day protocols, safeguarding notices and escalation contacts by email and SMS.' },
        { id: 'consentFinancial', label: 'No outside offers declaration', type: 'consent' as const, required: true, span: 2 as const, hint: 'I understand that any financial offer or gift to a minor outside documented Demo Day processes must be reported immediately.' },
      ],
    },
  ],
}

export const roleFlows: Record<'player' | 'scout' | 'guardian', RoleFlow> = {
  player: playerFlow,
  scout: scoutFlow,
  guardian: guardianFlow,
}

export const roleCards = [
  { id: 'player', label: 'Player', detail: 'Open athlete registration — sport, position, region, photo and guardian consent.', image: 'https://images.pexels.com/photos/30461448/pexels-photo-30461448.jpeg' },
  { id: 'scout', label: 'Scout', detail: 'Vetted access — club details, references, ID check and code of conduct.', image: 'https://images.pexels.com/photos/38761310/pexels-photo-38761310.jpeg' },
  { id: 'guardian', label: 'Guardian', detail: 'Consent holder — identity, athlete link, emergency contact and media consent.', image: '/guardians.jpeg' },
] as const
