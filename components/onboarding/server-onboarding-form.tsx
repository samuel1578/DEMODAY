'use client'

import Link from 'next/link'
import { useActionState, useState, type ReactNode } from 'react'
import { ArrowRight, Check, Copy, ShieldCheck } from 'lucide-react'
import { submitOnboardingAction } from '@/app/actions/onboarding'
import { PhotoUploadField } from '@/components/onboarding/photo-upload-field'
import type { MediaType } from '@/lib/supabase/contracts'
import { isUnder18, type OnboardingActionState } from '@/lib/supabase/onboarding-validation'

export type OnboardingRole = 'player' | 'guardian' | 'scout'
type FormValues = Record<string, string | string[]>

interface ServerOnboardingFormProps {
    role: OnboardingRole
    initialValues?: FormValues
    inviteToken?: string
    /** Current R2 media for this owner, resolved server-side. */
    media?: Partial<Record<MediaType, { mediaId: string; deliveryUrl: string | null }>>
    /** Set when the deployment has no R2 credentials yet. */
    mediaDisabledReason?: string | null
}

const regions = [
    'Ahafo', 'Ashanti', 'Bono', 'Bono East', 'Central', 'Eastern', 'Greater Accra',
    'North East', 'Northern', 'Savannah', 'Upper East', 'Upper West', 'Volta', 'Western', 'Western North',
]
const sportOptions = [
    { value: 'football', label: 'Football' },
    { value: 'basketball', label: 'Basketball' },
    { value: 'american-football', label: 'American Football' },
]
const positions: Record<string, { value: string; label: string }[]> = {
    football: [
        { value: 'goalkeeper', label: 'Goalkeeper' }, { value: 'right-back', label: 'Right Back' },
        { value: 'centre-back', label: 'Centre Back' }, { value: 'left-back', label: 'Left Back' },
        { value: 'defensive-midfield', label: 'Defensive Midfield' }, { value: 'central-midfield', label: 'Central Midfield' },
        { value: 'attacking-midfield', label: 'Attacking Midfield' }, { value: 'right-wing', label: 'Right Wing' },
        { value: 'left-wing', label: 'Left Wing' }, { value: 'forward', label: 'Forward' }, { value: 'striker', label: 'Striker' },
    ],
    basketball: [
        { value: 'point-guard', label: 'Point Guard' }, { value: 'shooting-guard', label: 'Shooting Guard' },
        { value: 'small-forward', label: 'Small Forward' }, { value: 'power-forward', label: 'Power Forward' }, { value: 'center', label: 'Center' },
    ],
    'american-football': [
        { value: 'quarterback', label: 'Quarterback' }, { value: 'running-back', label: 'Running Back' },
        { value: 'wide-receiver', label: 'Wide Receiver' }, { value: 'tight-end', label: 'Tight End' },
        { value: 'offensive-line', label: 'Offensive Line' }, { value: 'defensive-line', label: 'Defensive Line' },
        { value: 'linebacker', label: 'Linebacker' }, { value: 'cornerback', label: 'Cornerback' },
        { value: 'safety', label: 'Safety' }, { value: 'kicker', label: 'Kicker' }, { value: 'return-specialist', label: 'Return Specialist' },
    ],
}

const initialActionState: OnboardingActionState = { status: 'idle' }
const controlClass = 'mt-2 w-full rounded-md border border-foreground/15 bg-background px-4 py-3 text-sm outline-none transition focus:border-[#F4D03F]'
const labelClass = 'block text-xs font-bold uppercase tracking-wider'

export function ServerOnboardingForm({
    role,
    initialValues = {},
    inviteToken,
    media = {},
    mediaDisabledReason = null,
}: ServerOnboardingFormProps) {
    const [state, formAction, pending] = useActionState(submitOnboardingAction, initialActionState)
    const [values, setValues] = useState<FormValues>({
        ...initialValues,
        ...(inviteToken ? { inviteToken } : {}),
    })

    function setValue(name: string, value: string) {
        setValues(previous => ({ ...previous, [name]: value }))
    }

    function toggleValue(name: string, value: string) {
        setValues(previous => {
            const current = Array.isArray(previous[name]) ? previous[name] as string[] : []
            return {
                ...previous,
                [name]: current.includes(value) ? current.filter(item => item !== value) : [...current, value],
            }
        })
    }

    function error(name: string) {
        return state.fieldErrors?.[name] ? <span className="mt-2 block text-xs font-bold text-[#E67E22]">{state.fieldErrors[name]}</span> : null
    }

    function input(name: string, label: string, type = 'text', required = false, options?: { min?: string; max?: string; placeholder?: string }) {
        const value = typeof values[name] === 'string' ? values[name] as string : ''
        return (
            <label key={name} className="block">
                <span className={labelClass}>{label}{required && <span className="ml-1 text-[#E67E22]">*</span>}</span>
                <input
                    className={controlClass}
                    name={name}
                    type={type}
                    value={value}
                    required={required}
                    min={options?.min}
                    max={options?.max}
                    step={name === 'weightKg' ? '0.01' : undefined}
                    placeholder={options?.placeholder}
                    onChange={event => setValue(name, event.target.value)}
                />
                {error(name)}
            </label>
        )
    }

    function select(name: string, label: string, options: { value: string; label: string }[], required = false) {
        const value = typeof values[name] === 'string' ? values[name] as string : ''
        return (
            <label key={name} className="block">
                <span className={labelClass}>{label}{required && <span className="ml-1 text-[#E67E22]">*</span>}</span>
                <select className={controlClass} name={name} value={value} required={required} onChange={event => setValue(name, event.target.value)}>
                    <option value="">Select an option</option>
                    {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {error(name)}
            </label>
        )
    }

    function textarea(name: string, label: string, required = false, rows = 4) {
        const value = typeof values[name] === 'string' ? values[name] as string : ''
        return (
            <label key={name} className="block sm:col-span-2">
                <span className={labelClass}>{label}{required && <span className="ml-1 text-[#E67E22]">*</span>}</span>
                <textarea className={`${controlClass} resize-y`} name={name} rows={rows} value={value} required={required} onChange={event => setValue(name, event.target.value)} />
                {error(name)}
            </label>
        )
    }

    function multi(name: string, label: string, options: { value: string; label: string }[], required = false) {
        const selected = Array.isArray(values[name]) ? values[name] as string[] : []
        return (
            <fieldset className="sm:col-span-2" key={name}>
                <legend className={labelClass}>{label}{required && <span className="ml-1 text-[#E67E22]">*</span>}</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                    {options.map(option => {
                        const active = selected.includes(option.value)
                        return (
                            <label key={option.value} className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${active ? 'border-[#F4D03F] bg-[#F4D03F] text-[#172219]' : 'border-foreground/15 text-foreground/70 hover:border-[#F4D03F]/60'}`}>
                                <input
                                    className="sr-only"
                                    type="checkbox"
                                    name={name}
                                    value={option.value}
                                    checked={active}
                                    onChange={() => toggleValue(name, option.value)}
                                />
                                {option.label}
                            </label>
                        )
                    })}
                </div>
                {error(name)}
            </fieldset>
        )
    }

    function consent(name: string, title: string, copy: string, required = true) {
        const checked = values[name] === 'yes'
        return (
            <label key={name} className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 sm:col-span-2 ${checked ? 'border-[#F4D03F]/70 bg-[#1e5128]/15' : 'border-foreground/12 bg-card'}`}>
                <input
                    className="mt-1 size-4 accent-[#F4D03F]"
                    type="checkbox"
                    name={name}
                    value="yes"
                    checked={checked}
                    required={required}
                    onChange={event => setValue(name, event.target.checked ? 'yes' : '')}
                />
                <span>
                    <span className={labelClass}>{title}{required && <span className="ml-1 text-[#E67E22]">*</span>}</span>
                    <span className="mt-2 block text-sm leading-6 text-foreground/60">{copy}</span>
                    {error(name)}
                </span>
            </label>
        )
    }

    function photo(mediaType: MediaType, label: string, hint: string, required = false) {
        return (
            <PhotoUploadField
                key={mediaType}
                mediaType={mediaType}
                label={label}
                hint={hint}
                required={required}
                disabledReason={mediaDisabledReason}
                initial={media[mediaType] ?? null}
            />
        )
    }

    if (state.status === 'success') {
        return (
            <section className="rounded-xl border border-[#F4D03F]/40 bg-card p-7 sm:p-10" aria-live="polite">
                <Check className="size-9 text-[#1e5128]" aria-hidden="true" />
                <h2 className="mt-4 text-2xl font-black uppercase tracking-tight">Profile submitted</h2>
                <p className="mt-3 text-sm leading-6 text-foreground/65">{state.message}</p>
                {state.guardianInviteUrl && <InviteCopyBox path={state.guardianInviteUrl} />}
                <div className="mt-7 flex flex-wrap gap-3">
                    <Link className="rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold text-[#172219]" href="/account/pending">Continue to account status</Link>
                    {role === 'player' && <Link className="rounded-md border border-foreground/15 px-5 py-3 text-sm font-bold" href="/account/guardian-approval">Guardian requests</Link>}
                </div>
            </section>
        )
    }

    const playerDob = typeof values.dateOfBirth === 'string' ? values.dateOfBirth : ''
    const minor = role === 'player' && isUnder18(playerDob)

    return (
        <form action={formAction} className="rounded-xl border border-foreground/10 bg-card p-6 sm:p-9">
            <div className="mb-8 flex items-start gap-3 rounded-md border border-[#F4D03F]/25 bg-background p-4 text-xs leading-5 text-foreground/60">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#F4D03F]" aria-hidden="true" />
                Your authenticated account role determines which profile can be submitted. Only fields supported by the protected profile tables are collected here; account review remains independent.
            </div>
            {state.message && <p className="mb-6 rounded-md border border-[#E67E22]/40 bg-[#E67E22]/10 p-4 text-sm text-foreground/80" role="alert">{state.message}</p>}
            {state.fieldErrors?.form && <p className="mb-6 text-sm font-bold text-[#E67E22]">{state.fieldErrors.form}</p>}

            {role === 'player' && (
                <>
                    <Section title="Sport and location" description="The date of birth is stored in the restricted player-private table; scouts never receive it.">
                        {select('sport', 'Sport', sportOptions, true)}
                        {input('dateOfBirth', 'Date of birth', 'date', true, { max: new Date().toISOString().slice(0, 10) })}
                        {select('gender', 'Gender', [{ value: 'female', label: 'Female' }, { value: 'male', label: 'Male' }], true)}
                        {select('region', 'Region', regions.map(value => ({ value, label: value })), true)}
                        {input('district', 'Constituency / district', 'text', true, { placeholder: 'e.g. Ayawaso North' })}
                        {input('community', 'Community / town')}
                        {input('school', 'School or academy')}
                    </Section>
                    <Section title="Playing profile" description="These fields support sport-specific player discovery and event placement.">
                        {select('primaryPosition', 'Primary position', positions[typeof values.sport === 'string' ? values.sport : 'football'] ?? [], true)}
                        {select('secondaryPosition', 'Secondary position (optional)', positions[typeof values.sport === 'string' ? values.sport : 'football'] ?? [])}
                        {select('dominantSide', 'Dominant hand / foot', [
                            { value: 'right', label: 'Right' }, { value: 'left', label: 'Left' }, { value: 'both', label: 'Both' },
                        ], true)}
                        {input('jerseyNumber', 'Preferred squad number', 'number', false, { min: '0', max: '99' })}
                        {input('heightCm', 'Height (cm)', 'number', false, { min: '100', max: '260' })}
                        {input('weightKg', 'Weight (kg)', 'number', false, { min: '25', max: '300' })}
                        {select('experienceLevel', 'Highest level played', [
                            { value: 'park', label: 'Park / community' }, { value: 'school', label: 'School team' },
                            { value: 'district', label: 'District / regional' }, { value: 'academy', label: 'Academy / club' },
                            { value: 'none', label: 'Never competed' },
                        ], true)}
                        {input('yearsPlaying', 'Years playing', 'number', false, { min: '0', max: '80' })}
                        {input('previousClub', 'Previous club or team')}
                        {textarea('bio', 'About your game')}
                        {textarea('goals', 'What are you working towards?')}
                        {input('highlightUrl', 'Highlight video URL', 'url')}
                        {textarea('achievements', 'Key achievements')}
                    </Section>
                    <Section title="Profile photo" description="Photos are stored in R2 and referenced by object key. An under-18 athlete’s photo is stored in a private bucket and served through a short-lived signed URL.">
                        {photo('profile_photo', 'Profile photo', 'Face clearly visible, plain background where possible.')}
                        {photo('action_photo', 'Action photo (optional)', 'One clear action shot from a match or session.')}
                    </Section>
                    {minor ? (
                        <div className="mt-8 rounded-md border border-[#E67E22]/40 bg-[#E67E22]/10 p-5 text-sm leading-6 text-foreground/75">
                            <b className="block text-foreground">Under-18 safeguarding gate</b>
                            A one-time guardian invitation will be generated after submission. A guardian must claim it, you must approve their link, the guardian account must pass its separate review, and the guardian must record the required consents before dashboard access is available. Do not enter guardian consent on someone else’s behalf.
                        </div>
                    ) : (
                        <Section title="Your consents" description="Required consents are recorded as append-only history. Profile discovery is a separate, optional choice.">
                            {consent('consentParticipation', 'Participation consent', 'I agree to the Demo Day athlete terms and eligibility rules.')}
                            {consent('consentMedia', 'Media use consent', 'I give specific consent for images, video and performance data to be used in Demo Day profiles, scout reports and event coverage.')}
                            {consent('consentSafeguarding', 'Safeguarding communications', 'I accept safeguarding notices, event-day protocols and escalation contacts.')}
                            {consent('consentFinancial', 'No outside offers declaration', 'I understand that undocumented financial offers linked to trials or selection must be reported immediately.')}
                            {consent('consentDiscovery', 'Profile discovery (optional)', 'I consent to my allowlisted profile being discoverable by vetted scouts.', false)}
                        </Section>
                    )}
                </>
            )}

            {role === 'scout' && (
                <>
                    <Section title="Identity" description="Scout applications stay locked until both account review and independent safeguarding vetting are approved.">
                        {input('dateOfBirth', 'Date of birth', 'date', true, { max: new Date().toISOString().slice(0, 10) })}
                        {input('phone', 'Phone', 'tel', true, { placeholder: '+233 24 000 0000' })}
                        {input('nationality', 'Nationality')}
                        {select('region', 'Based in region', regions.map(value => ({ value, label: value })))}
                    </Section>
                    <Section title="Professional standing" description="References and professional affiliation are provided for trusted review.">
                        {input('organisation', 'Club, academy or organisation', 'text', true)}
                        {select('scoutRole', 'Your role', [
                            { value: 'scout', label: 'Scout' }, { value: 'coach', label: 'Coach' },
                            { value: 'recruiter', label: 'Recruiter' }, { value: 'analyst', label: 'Analyst' },
                            { value: 'club-official', label: 'Club official' },
                        ], true)}
                        {select('affiliationType', 'Affiliation', [
                            { value: 'club-academy', label: 'Club / academy' }, { value: 'national-federation', label: 'National federation' },
                            { value: 'college', label: 'College / collegiate program' }, { value: 'independent', label: 'Independent scout' },
                            { value: 'media', label: 'Media / analyst' },
                        ], true)}
                        {input('yearsExperience', 'Years in talent identification', 'number', false, { min: '0', max: '80' })}
                        {input('referenceName', 'Professional reference', 'text', true)}
                        {input('referenceContact', 'Reference phone or email', 'text', true)}
                    </Section>
                    <Section title="What you look for" description="All interest categories are stored as typed rows, not packed client-provided JSON.">
                        {multi('sports', 'Sports you cover', sportOptions, true)}
                        {multi('positions', 'Positions you are hunting', Object.values(positions).flat(), false)}
                        {multi('ageBands', 'Age bands', [
                            { value: 'u14', label: 'Under 14' }, { value: 'u16', label: 'Under 16' },
                            { value: 'u18', label: 'Under 18' }, { value: 'u21', label: 'Under 21' },
                            { value: 'senior', label: 'Senior' },
                        ], true)}
                        {multi('regions', 'Regions you cover', regions.map(value => ({ value, label: value })))}
                    </Section>
                    <Section title="Profile photo" description="Your photo is referenced by ID and never stored in the database.">
                        {photo('profile_photo', 'Profile photo', 'A face attached to a name keeps the network accountable.')}
                    </Section>
                    <Section title="Vetting document" description="Your government ID is used only for independent safeguarding vetting. It is stored as private media and is never published or shared with athletes.">
                        {photo('identity_document', 'Government ID photo', 'Passport or national ID. Private media: delivery requires a signed URL.')}
                    </Section>
                    <Section title="Safeguarding consents" description="These decisions are saved to the immutable consent history with this account as the actor and subject.">
                        {consent('consentScoutCode', 'Scout Code of Conduct', 'I accept the Demo Day Scout Code of Conduct: no unsupervised one-to-one contact with minors outside sanctioned sessions, no gifts or financial offers outside documented processes, and immediate disclosure of conflicts of interest.')}
                        {consent('consentBackgroundCheck', 'Background check consent', 'I consent to safeguarding background checks and to my referee being contacted.')}
                        {consent('consentNoContactPolicy', 'Communication logging', 'I understand all scout-athlete-family contact about trials, transfers or recruitment is logged and visible to the safeguarding officer.')}
                    </Section>
                </>
            )}

            {role === 'guardian' && (
                <>
                    <Section title="Guardian details" description="This information is private and is not published on a player profile.">
                        {select('relationship', 'Relationship to the athlete', [
                            { value: 'parent', label: 'Parent' }, { value: 'guardian', label: 'Legal guardian' },
                            { value: 'grandparent', label: 'Grandparent' }, { value: 'sibling', label: 'Older sibling (18+)' },
                            { value: 'other', label: 'Other carer' },
                        ], true)}
                        {input('phone', 'Phone', 'tel', true, { placeholder: '+233 24 000 0000' })}
                        {input('secondaryPhone', 'Secondary phone (optional)', 'tel')}
                        {select('region', 'Region', regions.map(value => ({ value, label: value })), true)}
                        {input('address', 'Home address', 'text', true)}
                        {input('emergencyContactName', 'Emergency contact name', 'text', true)}
                        {input('emergencyContactPhone', 'Emergency contact phone', 'tel', true)}
                        {textarea('medicalNotes', 'Medical or allergy notes (optional)')}
                    </Section>
                    <Section title="Profile photo" description="Your photo is referenced by ID and never stored in the database.">
                        {photo('profile_photo', 'Profile photo', 'Guardian identity confirmation is part of the safeguarding record.')}
                    </Section>
                    <Section title="Link to a player" description="A guardian invitation only creates a pending request. The player approves the link and your account review remains independent.">
                        {inviteToken ? (
                            <>
                                <input type="hidden" name="inviteToken" value={inviteToken} />
                                <p className="text-sm leading-6 text-foreground/65 sm:col-span-2">A one-time player invitation is attached to this form and will be claimed when your guardian profile is submitted.</p>
                            </>
                        ) : (
                            <label className="block sm:col-span-2">
                                <span className={labelClass}>Player invitation token (optional)</span>
                                <input className={controlClass} name="inviteToken" value={typeof values.inviteToken === 'string' ? values.inviteToken : ''} onChange={event => setValue('inviteToken', event.target.value)} autoComplete="off" />
                                <span className="mt-2 block text-xs leading-5 text-foreground/50">If you opened a player invitation, return to that link after signing in to claim it. The raw invitation is not stored by the database.</span>
                                {error('inviteToken')}
                            </label>
                        )}
                    </Section>
                </>
            )}

            <div className="mt-10 flex flex-col gap-4 border-t border-foreground/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-xs leading-5 text-foreground/50">Submitting saves only role-supported profile fields and consent history. It does not approve your account or grant dashboard access.</p>
                <button disabled={pending} className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-[#F4D03F] px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-[#172219] transition hover:brightness-105 disabled:cursor-wait disabled:opacity-60">
                    {pending ? 'Saving…' : 'Save profile'} <ArrowRight className="size-4" />
                </button>
            </div>
        </form>
    )
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <section className="border-t border-foreground/10 py-7 first:border-t-0 first:pt-0">
            <h2 className="text-lg font-black uppercase tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-foreground/55">{description}</p>
            <div className="mt-6 grid gap-x-6 gap-y-5 sm:grid-cols-2">{children}</div>
        </section>
    )
}

function InviteCopyBox({ path }: { path: string }) {
    const [copied, setCopied] = useState(false)

    async function copy() {
        try {
            await navigator.clipboard.writeText(new URL(path, window.location.origin).toString())
            setCopied(true)
        } catch {
            setCopied(false)
        }
    }

    return (
        <div className="mt-6 rounded-md border border-[#F4D03F]/40 bg-background p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-[#F4D03F]">One-time guardian invitation — save it now</p>
            <code className="mt-3 block break-all text-xs leading-5 text-foreground/70">{path}</code>
            <button type="button" onClick={copy} className="mt-3 inline-flex items-center gap-2 rounded-md border border-foreground/15 px-4 py-2 text-xs font-bold uppercase tracking-wider">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}{copied ? 'Copied' : 'Copy invitation'}
            </button>
            <p className="mt-3 text-xs leading-5 text-foreground/50">This raw token is shown only in this response and cannot be retrieved later. If it is lost or expires, resubmit your profile to generate a replacement.</p>
        </div>
    )
}
