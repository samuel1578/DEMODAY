export type RoleId = 'player' | 'scout' | 'guardian'

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'date'
  | 'number'
  | 'textarea'
  | 'select'
  | 'choice'
  | 'multi'
  | 'toggle'
  | 'photo'
  | 'consent'

export interface FieldOption {
  value: string
  label: string
  hint?: string
}

export interface FieldDef {
  id: string
  label: string
  type: FieldType
  placeholder?: string
  hint?: string
  required?: boolean
  span?: 1 | 2
  min?: string
  max?: string
  accept?: string
  options?: FieldOption[]
  optionsFor?: (values: Values) => FieldOption[]
  validate?: (value: string, values: Values) => string | null
}

export interface StepDef {
  id: string
  eyebrow: string
  title: string
  intro: string
  fields: FieldDef[]
  when?: (values: Values) => boolean
}

export interface RoleFlow {
  label: string
  title: string
  intro: string
  idLabel: string
  idPrefix: string
  status: string
  statusNote: string
  dashboard: string
  steps: StepDef[]
}

export type Values = Record<string, string>

export interface ProfileRecord {
  role: RoleId
  id: string
  values: Values
  photo?: string
  completedAt: string
  status: string
  statusNote: string
}

export const ghanaRegions = [
  'Ahafo',
  'Ashanti',
  'Bono',
  'Bono East',
  'Central',
  'Eastern',
  'Greater Accra',
  'North East',
  'Northern',
  'Savannah',
  'Upper East',
  'Upper West',
  'Volta',
  'Western',
  'Western North',
].map(region => ({ value: region, label: region }))

export const sports: FieldOption[] = [
  { value: 'football', label: 'Football', hint: 'Lead sport' },
  { value: 'basketball', label: 'Basketball', hint: 'Parallel pilot' },
  { value: 'american-football', label: 'American Football', hint: 'Pilot follows later' },
]

export const sportPositions: Record<string, FieldOption[]> = {
  football: [
    { value: 'goalkeeper', label: 'Goalkeeper' },
    { value: 'right-back', label: 'Right Back' },
    { value: 'centre-back', label: 'Centre Back' },
    { value: 'left-back', label: 'Left Back' },
    { value: 'defensive-midfield', label: 'Defensive Midfield' },
    { value: 'central-midfield', label: 'Central Midfield' },
    { value: 'attacking-midfield', label: 'Attacking Midfield' },
    { value: 'right-wing', label: 'Right Wing' },
    { value: 'left-wing', label: 'Left Wing' },
    { value: 'forward', label: 'Forward' },
    { value: 'striker', label: 'Striker' },
  ],
  basketball: [
    { value: 'point-guard', label: 'Point Guard' },
    { value: 'shooting-guard', label: 'Shooting Guard' },
    { value: 'small-forward', label: 'Small Forward' },
    { value: 'power-forward', label: 'Power Forward' },
    { value: 'center', label: 'Center' },
  ],
  'american-football': [
    { value: 'quarterback', label: 'Quarterback' },
    { value: 'running-back', label: 'Running Back' },
    { value: 'wide-receiver', label: 'Wide Receiver' },
    { value: 'tight-end', label: 'Tight End' },
    { value: 'offensive-line', label: 'Offensive Line' },
    { value: 'defensive-line', label: 'Defensive Line' },
    { value: 'linebacker', label: 'Linebacker' },
    { value: 'cornerback', label: 'Cornerback' },
    { value: 'safety', label: 'Safety' },
    { value: 'kicker', label: 'Kicker' },
    { value: 'return-specialist', label: 'Return Specialist' },
  ],
}

const sportCodes: Record<string, string> = {
  football: 'FTB',
  basketball: 'BKB',
  'american-football': 'AMF',
}

export function ageFromDob(dob: string): number | null {
  if (!dob) return null
  const born = new Date(dob)
  if (Number.isNaN(born.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())
  if (beforeBirthday) age -= 1
  return age
}

export function isMinor(dob: string): boolean {
  const age = ageFromDob(dob)
  return age !== null && age < 18
}

export function resolveOptions(field: FieldDef, values: Values): FieldOption[] {
  if (field.optionsFor) return field.optionsFor(values)
  return field.options ?? []
}

export function formatValue(field: FieldDef, value: string, values: Values): string {
  if (!value) return '—'
  if (field.type === 'toggle' || field.type === 'consent') return value === 'yes' ? 'Yes' : 'No'
  if (field.type === 'multi') {
    const lookup = new Map(resolveOptions(field, values).map(option => [option.value, option.label]))
    return value
      .split(',')
      .filter(Boolean)
      .map(item => lookup.get(item) ?? item)
      .join(', ')
  }
  const lookup = resolveOptions(field, values).find(option => option.value === value)
  return lookup?.label ?? value
}

export function generateId(role: RoleId, values: Values): string {
  const stamp = new Date().getFullYear().toString().slice(2)
  const random = Math.floor(1000 + Math.random() * 9000)
  if (role === 'player') return `DD-ATH-${sportCodes[values.sport] ?? 'GEN'}-${stamp}${random}`
  if (role === 'scout') return `DD-SCT-${stamp}${random}`
  return `DD-GDN-${stamp}${random}`
}

export function displayName(role: RoleId, values: Values): string {
  const name = [values.firstName, values.lastName].filter(Boolean).join(' ').trim()
  return name || (role === 'scout' ? 'Scout' : role === 'guardian' ? 'Guardian' : 'Athlete')
}

export function validateStep(step: StepDef, values: Values): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of step.fields) {
    const value = (values[field.id] ?? '').trim()
    if (field.type === 'photo') {
      if (field.required && !value) errors[field.id] = 'A photo is required to continue.'
      continue
    }
    if (field.type === 'toggle' || field.type === 'consent') {
      if (field.required && value !== 'yes') errors[field.id] = 'This confirmation is required.'
      continue
    }
    if (field.type === 'multi') {
      if (field.required && !value) errors[field.id] = 'Select at least one option.'
      continue
    }
    if (field.required && !value) {
      errors[field.id] = 'This field is required.'
      continue
    }
    if (field.validate) {
      const message = field.validate(value, values)
      if (message) errors[field.id] = message
      continue
    }
    if (!value) continue
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field.id] = 'Enter a valid email address.'
    }
    if (field.type === 'password' && value.length < 8) {
      errors[field.id] = 'Use at least 8 characters.'
    }
    if (field.type === 'tel' && !/^[+\d][\d\s()-]{6,}$/.test(value)) {
      errors[field.id] = 'Enter a valid phone number.'
    }
    if (field.type === 'date' && field.max && value > field.max) {
      errors[field.id] = 'Date is in the future.'
    }
    if (field.type === 'number' && field.min && Number(value) < Number(field.min)) {
      errors[field.id] = `Must be at least ${field.min}.`
    }
  }
  return errors
}

const STORAGE_PREFIX = 'demoday.profile.'
const PROFILES_STORAGE_KEY = 'demoday.profiles'

function readStorageJson<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function loadProfiles(): ProfileRecord[] {
  if (typeof window === 'undefined') return []

  const savedProfiles = readStorageJson<unknown>(PROFILES_STORAGE_KEY)
  const parsedProfiles = Array.isArray(savedProfiles) ? savedProfiles.filter((profile): profile is ProfileRecord => !!profile && typeof profile === 'object' && 'id' in profile && 'role' in profile) : []
  const migrated = [...parsedProfiles]
  const knownIds = new Set(migrated.map(profile => profile.id))

  for (const role of ['player', 'scout', 'guardian'] as const) {
    const profile = readStorageJson<Partial<ProfileRecord>>(STORAGE_PREFIX + role)
    if (!profile || !profile.id || !profile.role || typeof profile.role !== 'string') continue
    if (profile.role !== role) continue
    if (!knownIds.has(profile.id)) {
      migrated.push(profile as ProfileRecord)
      knownIds.add(profile.id)
    }
  }

  if (!savedProfiles && migrated.length) {
    window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(migrated))
  }
  return migrated
}

export function loadProfile(role: RoleId): ProfileRecord | null {
  if (typeof window === 'undefined') return null
  try {
    const profiles = loadProfiles().filter(profile => profile.role === role)
    if (profiles.length) return profiles[profiles.length - 1]
    const raw = readStorageJson<Partial<ProfileRecord>>(STORAGE_PREFIX + role)
    if (!raw || !raw.id || raw.role !== role) return null
    return raw as ProfileRecord
  } catch {
    return null
  }
}

export function saveProfile(record: ProfileRecord): void {
  if (typeof window === 'undefined') return
  try {
    const profiles = loadProfiles()
    const index = profiles.findIndex(profile => profile.id === record.id)
    if (index < 0) profiles.push(record)
    else profiles[index] = record
    window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles))
    window.localStorage.setItem(STORAGE_PREFIX + record.role, JSON.stringify(record))
  } catch {
    /* storage full or unavailable - the demo still works in memory */
  }
}

export function clearProfile(role: RoleId): void {
  if (typeof window === 'undefined') return
  try {
    const current = readStorageJson<Partial<ProfileRecord>>(STORAGE_PREFIX + role)
    const currentId = current?.id ?? null
    window.localStorage.removeItem(STORAGE_PREFIX + role)
    if (currentId) {
      const profiles = loadProfiles().filter(profile => profile.id !== currentId)
      window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles))
    }
  } catch {
    /* ignore */
  }
}
