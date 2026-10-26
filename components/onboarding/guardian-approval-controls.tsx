'use client'

import { useActionState } from 'react'
import { recordGuardianConsentsAction, updateGuardianLinkAction } from '@/app/actions/onboarding'
import type { OnboardingActionState } from '@/lib/supabase/onboarding-validation'

const consentInitialState: OnboardingActionState = { status: 'idle' }
const consentCopy = [
    ['participation', 'Participation consent', 'I consent to the linked athlete taking part in Demo Day assessment and competition.'],
    ['media', 'Media use consent', 'I give specific consent for images and video of the linked athlete to be used in Demo Day profiles, scout reports and event coverage.'],
    ['safeguarding', 'Safeguarding communications', 'I accept event-day protocols, safeguarding notices and escalation contacts for the linked athlete.'],
    ['financial', 'No outside offers declaration', 'I understand that undocumented financial offers or gifts linked to a minor must be reported immediately.'],
] as const

export function GuardianLinkDecision({ linkId }: { linkId: string }) {
    return (
        <div className="mt-5 flex flex-wrap gap-3">
            <form action={updateGuardianLinkAction}>
                <input type="hidden" name="linkId" value={linkId} />
                <input type="hidden" name="status" value="approved" />
                <button className="rounded-md bg-[#F4D03F] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#172219]">Approve link</button>
            </form>
            <form action={updateGuardianLinkAction}>
                <input type="hidden" name="linkId" value={linkId} />
                <input type="hidden" name="status" value="rejected" />
                <button className="rounded-md border border-foreground/20 px-4 py-2.5 text-xs font-bold uppercase tracking-wider">Reject</button>
            </form>
        </div>
    )
}

export function GuardianConsentsForm({ playerUserId, playerName }: { playerUserId: string; playerName: string }) {
    const [state, action, pending] = useActionState(recordGuardianConsentsAction, consentInitialState)
    if (state.status === 'success') {
        return <p className="mt-5 rounded-md border border-[#F4D03F]/35 bg-background p-4 text-sm leading-6 text-foreground/70" role="status">{state.message}</p>
    }

    return (
        <form action={action} className="mt-5 rounded-md border border-foreground/10 bg-background p-5">
            <input type="hidden" name="playerUserId" value={playerUserId} />
            <h3 className="text-sm font-black uppercase tracking-wider">Record current guardian consent</h3>
            <p className="mt-2 text-xs leading-5 text-foreground/55">These decisions apply to {playerName}. All four required consents must be granted. Submitting appends a new history entry; it does not approve either account.</p>
            <div className="mt-4 grid gap-3">
                {consentCopy.map(([type, title, copy]) => (
                    <label key={type} className="flex items-start gap-3 rounded border border-foreground/10 p-3 text-sm">
                        <input className="mt-1 size-4 accent-[#F4D03F]" type="checkbox" name={`consent_${type}`} value="yes" required />
                        <span><b className="block text-xs uppercase tracking-wider">{title}</b><span className="mt-1 block text-xs leading-5 text-foreground/55">{copy}</span></span>
                    </label>
                ))}
                <label className="flex items-start gap-3 rounded border border-foreground/10 p-3 text-sm">
                    <input className="mt-1 size-4 accent-[#F4D03F]" type="checkbox" name="consent_discovery" value="yes" />
                    <span><b className="block text-xs uppercase tracking-wider">Profile discovery (optional)</b><span className="mt-1 block text-xs leading-5 text-foreground/55">I consent to the athlete’s allowlisted profile being discoverable by vetted scouts.</span></span>
                </label>
            </div>
            {state.message && <p className="mt-4 text-sm text-[#E67E22]" role="alert">{state.message}</p>}
            <button disabled={pending} className="mt-5 rounded-md bg-[#F4D03F] px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#172219] disabled:opacity-60">
                {pending ? 'Recording…' : 'Record guardian consent'}
            </button>
        </form>
    )
}
