import { loadProfiles, type ProfileRecord, type RoleId } from '@/lib/onboarding'

export interface DemoEvent {
  id: string
  title: string
  description: string
  category: string
  date: string
  time: string
  location: string
  imageUrl?: string
  spotlight: boolean
  createdAt: string
}

const EVENTS_KEY = 'demoday.events'
const NOTES_KEY = 'demoday.admin.notes'
const EVENTS_UPDATED_EVENT = 'demoday:events-updated'

export const demoEvents: DemoEvent[] = [
  {
    id: 'event-accra-scout-day',
    title: 'American Football Demo Day',
    description: 'Experience American football at a live Demo Day for athletes, coaches, and fans.',
    category: 'American football demo',
    date: '2026-11-14',
    time: '09:00',
    location: 'University of Ghana Rugby Stadium',
    imageUrl: 'https://img.olympics.com/images/image/private/t_s_16_9_g_auto/t_s_w1920/f_auto/primary/taqaxb3jnkgmh8gcbryg',
    spotlight: true,
    createdAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'event-women-in-sport',
    title: 'Women in Sport: Open House',
    description: 'A conversation and connection session for the next generation.',
    category: 'Community',
    date: '2026-11-28',
    time: '14:00',
    location: 'Community Arena',
    spotlight: false,
    createdAt: '2026-10-01T09:00:00.000Z',
  },
  {
    id: 'event-network-social',
    title: 'Demo Day Network Social',
    description: 'Meet the coaches, scouts, guardians, and athletes moving the game forward.',
    category: 'Network',
    date: '2026-12-12',
    time: '18:30',
    location: 'The Green Room',
    spotlight: false,
    createdAt: '2026-10-01T09:00:00.000Z',
  },
]

function parseEvents(raw: string | null): DemoEvent[] {
  if (raw === null) return demoEvents
  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed) || !parsed.every(isDemoEvent)) {
    throw new Error('Saved event data is invalid. Please clear the demo event data and try again.')
  }
  return parsed.map(event => {
    const current = event as DemoEvent
    const defaultEvent = demoEvents.find(item => item.id === current.id)
    if (current.title !== 'Accra North Scout Day' || current.id !== 'event-accra-scout-day' || !defaultEvent) return current
    return { ...defaultEvent, spotlight: current.spotlight }
  })
}

function isDemoEvent(value: unknown): value is DemoEvent {
  if (!value || typeof value !== 'object') return false
  const event = value as Partial<DemoEvent>
  return typeof event.id === 'string'
    && typeof event.title === 'string'
    && typeof event.description === 'string'
    && typeof event.category === 'string'
    && typeof event.date === 'string'
    && typeof event.time === 'string'
    && typeof event.location === 'string'
    && (event.imageUrl === undefined || typeof event.imageUrl === 'string')
    && typeof event.spotlight === 'boolean'
    && typeof event.createdAt === 'string'
}

export function loadDemoEvents(): DemoEvent[] {
  if (typeof window === 'undefined') return demoEvents
  const events = parseEvents(window.localStorage.getItem(EVENTS_KEY))
  if (window.localStorage.getItem(EVENTS_KEY) === null) {
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  } else {
    const rawEvents = window.localStorage.getItem(EVENTS_KEY)
    if (rawEvents !== JSON.stringify(events)) {
      window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
    }
  }
  return events
}

export function saveDemoEvents(events: DemoEvent[]): void {
  if (typeof window === 'undefined') throw new Error('Events can only be saved in a browser.')
  if (events.filter(event => event.spotlight).length > 1) {
    throw new Error('Only one event can be the active spotlight.')
  }
  window.localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  window.dispatchEvent(new Event(EVENTS_UPDATED_EVENT))
}

export function subscribeToDemoEvents(onUpdate: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === EVENTS_KEY) onUpdate()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(EVENTS_UPDATED_EVENT, onUpdate)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(EVENTS_UPDATED_EVENT, onUpdate)
  }
}

export function getSpotlightEvent(events: DemoEvent[]): DemoEvent | null {
  return events.find(event => event.spotlight) ?? null
}

export function loadAdminNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const raw = window.localStorage.getItem(NOTES_KEY)
  if (!raw) return {}
  const parsed: unknown = JSON.parse(raw)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Saved admin notes are invalid.')
  }
  return parsed as Record<string, string>
}

export function saveAdminNote(profileId: string, note: string): void {
  if (typeof window === 'undefined') throw new Error('Notes can only be saved in a browser.')
  const notes = loadAdminNotes()
  if (note.trim()) notes[profileId] = note.trim()
  else delete notes[profileId]
  window.localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}

export function updateProfileStatus(profile: ProfileRecord, status: string, statusNote: string): void {
  if (typeof window === 'undefined') throw new Error('Profiles can only be updated in a browser.')
  const profiles = loadProfiles()
  const index = profiles.findIndex(item => item.id === profile.id)
  if (index < 0) throw new Error('This profile is no longer available. Refresh and try again.')
  profiles[index] = { ...profile, status, statusNote }
  window.localStorage.setItem('demoday.profiles', JSON.stringify(profiles))
  window.localStorage.setItem(`demoday.profile.${profile.role}`, JSON.stringify(profiles[index]))
}

export function roleLabel(role: RoleId): string {
  return role.charAt(0).toUpperCase() + role.slice(1)
}
