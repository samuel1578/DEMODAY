import type { ReactNode } from 'react'
import { CheckCircle2, CircleAlert, CircleDot, ShieldCheck } from 'lucide-react'
import { accountStatusLabel, formatShortDate, humanizeToken, type ConsentState } from '@/lib/dashboard'
import type { ConsentType } from '@/lib/supabase/contracts'

/**
 * Shared, server-rendered presentation pieces for the role dashboards. These
 * receive data that has already been authorized and shaped by the server
 * loaders; no client-only state or demo values are used here.
 */

export function maybeLabel(options: { value: string; label: string }[], value: string | null | undefined): string {
    if (!value) return 'Not recorded'
    return options.find(option => option.value === value)?.label ?? humanizeToken(value)
}

const toneClasses: Record<string, string> = {
    neutral: 'border-foreground/15 bg-foreground/5 text-foreground/70',
    positive: 'border-[#1e5128]/40 bg-[#1e5128]/10 text-[#1e5128] dark:text-[#F4D03F]',
    attention: 'border-[#E67E22]/40 bg-[#E67E22]/10 text-[#E67E22]',
    pending: 'border-[#F4D03F]/40 bg-[#F4D03F]/15 text-foreground/75',
}

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof toneClasses }) {
    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${toneClasses[tone] ?? toneClasses.neutral}`}>
            {label}
        </span>
    )
}

export function statusTone(status: string | null | undefined): keyof typeof toneClasses {
    if (status === 'approved' || status === 'active') return 'positive'
    if (status === 'rejected') return 'attention'
    if (status === 'pending' || status === 'reviewed') return 'pending'
    return 'neutral'
}

export function DashboardHeader({
    eyebrow,
    title,
    intro,
    secondary,
    avatarUrl,
    avatarNote,
}: {
    eyebrow: string
    title: string
    intro: string
    secondary?: ReactNode
    /** Resolved server-side: a signed URL for private media. */
    avatarUrl?: string | null
    avatarNote?: string
}) {
    return (
        <div className="flex flex-col justify-between gap-6 border-b border-foreground/10 pb-10 md:flex-row md:items-end">
            <div className="flex items-start gap-5">
                {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="size-16 shrink-0 rounded-full border-2 border-[#F4D03F] object-cover" />
                ) : null}
                <div>
                    <p className="eyebrow">{eyebrow}</p>
                    <h1 className="display-title mt-4 max-w-3xl">{title}</h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground/60">{intro}</p>
                    {avatarUrl && avatarNote ? <p className="mt-3 text-xs text-foreground/45">{avatarNote}</p> : null}
                </div>
            </div>
            {secondary ? <div className="flex flex-wrap gap-3">{secondary}</div> : null}
        </div>
    )
}

export function StatGrid({ children }: { children: ReactNode }) {
    return <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="rounded-lg border border-foreground/10 bg-card p-5">
            <span className="text-xs uppercase tracking-wider text-foreground/50">{label}</span>
            <strong className="mt-2 block text-2xl font-black text-[#1e5128] dark:text-[#F4D03F]">{value}</strong>
            {hint ? <p className="mt-2 text-xs leading-5 text-foreground/55">{hint}</p> : null}
        </div>
    )
}

export function DashboardNotice({
    tone = 'pending',
    children,
}: {
    tone?: 'pending' | 'attention' | 'positive' | 'neutral'
    children: ReactNode
}) {
    const styles = tone === 'attention'
        ? 'border-[#E67E22]/40 bg-[#E67E22]/10 text-foreground/75'
        : tone === 'positive'
            ? 'border-[#1e5128]/35 bg-[#1e5128]/10 text-foreground/75'
            : tone === 'neutral'
                ? 'border-foreground/15 bg-background text-foreground/70'
                : 'border-[#F4D03F]/35 bg-background text-foreground/70'
    return <p className={`rounded-md border p-4 text-sm leading-6 ${styles}`}>{children}</p>
}

export function FieldGrid({ fields }: { fields: { label: string; value: string }[] }) {
    const visible = fields.filter(field => field.value && field.value !== 'Not recorded')
    if (!visible.length) {
        return <p className="text-sm text-foreground/55">No saved details yet.</p>
    }
    return (
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {visible.map(field => (
                <div key={field.label} className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-wider text-foreground/45">{field.label}</dt>
                    <dd className="mt-1 break-words text-sm font-semibold">{field.value}</dd>
                </div>
            ))}
        </dl>
    )
}

export function Card({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section className="rounded-xl border border-foreground/10 bg-card p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-black uppercase tracking-tight">{title}</h2>
                {action}
            </div>
            <div className="mt-5">{children}</div>
        </section>
    )
}

const consentCopy: Record<string, string> = {
    participation: 'Participation',
    media: 'Media use',
    safeguarding: 'Safeguarding communications',
    financial: 'No outside offers declaration',
    scout_code: 'Scout code of conduct',
    background_check: 'Background check',
    no_contact_policy: 'No contact with minors',
    profile_discovery: 'Scout discovery',
}

export function consentLabel(type: ConsentType): string {
    return consentCopy[type] ?? humanizeToken(type)
}

function ConsentRow({ state, required }: { state: ConsentState; required: boolean }) {
    const granted = state.decision === 'granted'
    return (
        <li className="flex flex-wrap items-start justify-between gap-3 border-b border-foreground/10 py-3 last:border-b-0">
            <span className="flex items-start gap-3">
                {granted
                    ? <CheckCircle2 className="mt-0.5 size-4 text-[#1e5128] dark:text-[#F4D03F]" aria-hidden="true" />
                    : <CircleAlert className="mt-0.5 size-4 text-[#E67E22]" aria-hidden="true" />}
                <span>
                    <b className="block text-sm font-bold">{consentLabel(state.consentType)}</b>
                    <span className="mt-0.5 block text-xs text-foreground/55">
                        {required ? 'Required' : 'Optional'} · recorded {formatShortDate(state.recordedAt)}
                    </span>
                </span>
            </span>
            <StatusPill label={state.decision === 'granted' ? 'Granted' : 'Withdrawn'} tone={granted ? 'positive' : 'attention'} />
        </li>
    )
}

export function ConsentPanel({
    states,
    required,
    optional = [],
    emptyMessage,
}: {
    states: ConsentState[]
    required: ConsentType[]
    optional?: ConsentType[]
    emptyMessage?: string
}) {
    const tracked = [...required, ...optional]
    const rows = tracked
        .map(type => states.find(state => state.consentType === type))
        .filter((state): state is ConsentState => Boolean(state))

    if (!rows.length) {
        return (
            <p className="flex items-start gap-3 text-sm leading-6 text-foreground/60">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-foreground/40" aria-hidden="true" />
                {emptyMessage ?? 'No consent decisions have been recorded yet.'}
            </p>
        )
    }

    return (
        <ul className="flex flex-col">
            {rows.map(state => (
                <ConsentRow key={state.consentType} state={state} required={required.includes(state.consentType)} />
            ))}
        </ul>
    )
}

export function NextSteps({ items }: { items: { label: string; description: string; href: string }[] }) {
    return (
        <div className="flex flex-col gap-3">
            {items.map(item => (
                <a key={item.href} href={item.href} className="flex items-center justify-between gap-4 rounded-md border border-foreground/10 p-4 transition hover:border-[#F4D03F]">
                    <span>
                        <b className="block text-sm font-bold">{item.label}</b>
                        <span className="mt-1 block text-xs leading-5 text-foreground/55">{item.description}</span>
                    </span>
                    <CircleDot className="shrink-0 text-foreground/30" aria-hidden="true" />
                </a>
            ))}
        </div>
    )
}

export function RequirementList({ missing }: { missing: string[] }) {
    if (!missing.length) return null
    return (
        <div className="mt-5 rounded-md border border-[#E67E22]/35 bg-[#E67E22]/10 p-4 text-sm leading-6 text-foreground/75">
            <p className="font-bold uppercase tracking-wider text-xs">Still required</p>
            <ul className="mt-2 list-disc pl-5">
                {missing.map(item => <li key={item}>{item}</li>)}
            </ul>
        </div>
    )
}

export function EmptyPanel({ title, description, actionHref, actionLabel }: {
    title: string
    description: string
    actionHref?: string
    actionLabel?: string
}) {
    return (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-foreground/20 bg-card p-6">
            <div>
                <h2 className="text-lg font-black uppercase tracking-tight">{title}</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-foreground/60">{description}</p>
            </div>
            {actionHref && actionLabel ? (
                <a href={actionHref} className="rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold uppercase tracking-wider text-[#172219]">
                    {actionLabel}
                </a>
            ) : null}
        </div>
    )
}

export function statusLabelFor(status: string | null | undefined): string {
    return accountStatusLabel(status)
}
