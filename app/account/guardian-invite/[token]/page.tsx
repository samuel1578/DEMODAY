import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteShell } from '@/components/site-shell'
import { ClaimGuardianInviteForm } from '@/components/onboarding/claim-guardian-invite-form'
import { createClient } from '@/lib/supabase/server'

const tokenPattern = /^[A-Za-z0-9_-]{43}$/

export default async function GuardianInvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    if (!tokenPattern.test(token)) notFound()

    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    const signedInUser = !authError ? authData.user : null
    let role: string | null = null
    let hasGuardianProfile = false

    if (signedInUser) {
        const { data: account } = await supabase.from('profiles')
            .select('role').eq('user_id', signedInUser.id).maybeSingle()
        role = account?.role ?? null
        if (role === 'guardian') {
            const { data: guardianProfile } = await supabase.from('guardian_profiles')
                .select('user_id').eq('user_id', signedInUser.id).maybeSingle()
            hasGuardianProfile = !!guardianProfile
        }
    }

    return (
        <SiteShell current="/account/pending">
            <main className="mx-auto max-w-3xl px-5 py-16 lg:px-8">
                <section className="rounded-xl border border-foreground/10 bg-card p-8 sm:p-10">
                    <p className="eyebrow">Guardian invitation</p>
                    <h1 className="display-title mt-4">A player invited you to request a guardian link.</h1>
                    <p className="mt-5 text-sm leading-6 text-foreground/65">
                        Claiming this one-time invitation creates only a pending link request. The player must approve it. Guardian account review is separate, and delegated consent remains unavailable until the guardian account is approved.
                    </p>

                    {!signedInUser ? (
                        <div className="mt-7 rounded-md border border-[#F4D03F]/30 bg-background p-5 text-sm leading-6 text-foreground/70">
                            <p>Sign in to an account with the saved Guardian role, or create one first. After authentication, open this same invitation again to claim it.</p>
                            <div className="mt-5 flex flex-wrap gap-3">
                                <Link href="/sign-in" className="rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold text-[#172219]">Sign in</Link>
                                <Link href="/sign-up" className="rounded-md border border-foreground/15 px-5 py-3 text-sm font-bold">Create account</Link>
                            </div>
                        </div>
                    ) : role !== 'guardian' ? (
                        <p className="mt-7 rounded-md border border-[#E67E22]/40 bg-[#E67E22]/10 p-5 text-sm leading-6" role="alert">
                            This invitation can only be claimed by an account whose saved role is Guardian. Sign out and use the correct account, or ask the player to issue a new invite if needed.
                        </p>
                    ) : hasGuardianProfile ? (
                        <ClaimGuardianInviteForm token={token} />
                    ) : (
                        <div className="mt-7 rounded-md border border-[#F4D03F]/30 bg-background p-5">
                            <p className="text-sm leading-6 text-foreground/70">Complete your guardian profile to claim the invitation. The invitation token will be attached to the form and claimed in the same database transaction as your profile save.</p>
                            <Link href={`/account/onboarding?invite=${encodeURIComponent(token)}`} className="mt-5 inline-flex rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold text-[#172219]">
                                Complete guardian profile
                            </Link>
                        </div>
                    )}
                </section>
            </main>
        </SiteShell>
    )
}
