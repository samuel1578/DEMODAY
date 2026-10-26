'use client'

import { useActionState } from 'react'
import { claimGuardianInviteAction } from '@/app/actions/onboarding'
import type { OnboardingActionState } from '@/lib/supabase/onboarding-validation'

const initialState: OnboardingActionState = { status: 'idle' }

export function ClaimGuardianInviteForm({ token }: { token: string }) {
    const [state, action, pending] = useActionState(claimGuardianInviteAction, initialState)
    if (state.status === 'success') {
        return <p className="mt-6 rounded-md border border-[#F4D03F]/40 bg-background p-4 text-sm leading-6 text-foreground/75" role="status">{state.message}</p>
    }
    return (
        <form action={action} className="mt-6">
            <input type="hidden" name="inviteToken" value={token} />
            {state.message && <p className="mb-4 rounded-md border border-[#E67E22]/40 bg-[#E67E22]/10 p-4 text-sm" role="alert">{state.message}</p>}
            <button disabled={pending} className="rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold text-[#172219] disabled:opacity-60">
                {pending ? 'Claiming…' : 'Claim invitation and request link'}
            </button>
        </form>
    )
}
