import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { GuardianConsentsForm, GuardianLinkDecision } from '@/components/onboarding/guardian-approval-controls'
import { SiteShell } from '@/components/site-shell'
import { requireAuthenticatedUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

type GuardianRequest = {
    link_id: string
    guardian_user_id: string
    guardian_first_name: string | null
    guardian_last_name: string | null
    link_status: string
    requested_at: string
    expires_at: string | null
}

type LinkRow = {
    id: string
    player_user_id: string
    status: string
    requested_at: string
}

export default async function GuardianApprovalPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
    const query = await searchParams
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()
    const { data: account, error } = await supabase.from('profiles')
        .select('role,status').eq('user_id', user.id).maybeSingle()
    if (error || !account) notFound()

    if (account.role === 'player') {
        const { data, error: requestError } = await supabase.rpc('get_my_guardian_link_requests')
        const requests = !requestError && Array.isArray(data) ? data as GuardianRequest[] : []
        const now = Date.now()
        const pendingRequests = requests.filter(request => request.link_status === 'pending'
            && (!request.expires_at || Date.parse(request.expires_at) > now))
        const expiredRequests = requests.filter(request => request.link_status === 'pending'
            && !!request.expires_at && Date.parse(request.expires_at) <= now)
        return (
            <SiteShell current="/account/pending">
                <main className="mx-auto max-w-4xl px-5 py-14 lg:px-8">
                    <p className="eyebrow">Player safeguarding</p>
                    <h1 className="display-title mt-4">Guardian link requests.</h1>
                    <p className="mt-5 max-w-3xl text-sm leading-6 text-foreground/65">Approve a request only when you recognize the guardian and the relationship is accurate. Approval opens limited linked access only after the guardian account is independently approved. It does not approve your player account.</p>
                    {query.result === 'updated' && <p className="mt-6 rounded-md border border-[#F4D03F]/30 bg-background p-4 text-sm" role="status">Your guardian link decision was saved.</p>}
                    {query.result === 'unchanged' && <p className="mt-6 rounded-md border border-[#E67E22]/35 bg-[#E67E22]/10 p-4 text-sm" role="alert">That request could not be changed. It may have expired or already been decided.</p>}
                    <section className="mt-8 grid gap-4">
                        {pendingRequests.map(request => (
                            <article key={request.link_id} className="rounded-xl border border-foreground/10 bg-card p-6">
                                <p className="eyebrow">Pending request</p>
                                <h2 className="mt-2 text-xl font-black">{[request.guardian_first_name, request.guardian_last_name].filter(Boolean).join(' ') || 'Guardian account'}</h2>
                                <p className="mt-2 text-xs text-foreground/50">Requested {new Date(request.requested_at).toLocaleDateString()} · expires {request.expires_at ? new Date(request.expires_at).toLocaleDateString() : 'not set'}</p>
                                <GuardianLinkDecision linkId={request.link_id} />
                            </article>
                        ))}
                        {expiredRequests.length > 0 && (
                            <div className="rounded-xl border border-[#E67E22]/35 bg-[#E67E22]/10 p-5 text-sm leading-6 text-foreground/70">
                                {expiredRequests.length} guardian request{expiredRequests.length === 1 ? ' has' : 's have'} expired and cannot be approved. Ask the player to generate and share a fresh invitation.
                            </div>
                        )}
                        {!requestError && pendingRequests.length === 0 && expiredRequests.length === 0 && (
                            <div className="rounded-xl border border-foreground/10 bg-card p-6 text-sm leading-6 text-foreground/65">
                                No pending guardian requests. If an under-18 invitation expired or was lost, complete your profile again to create a replacement invitation.
                            </div>
                        )}
                        {requestError && <p className="rounded-md border border-[#E67E22]/35 bg-[#E67E22]/10 p-4 text-sm">Guardian request status could not be loaded. Try again later.</p>}
                    </section>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link href="/account/onboarding" className="rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold text-[#172219]">Profile and invitation</Link>
                        <Link href="/account/pending" className="rounded-md border border-foreground/15 px-5 py-3 text-sm font-bold">Account status</Link>
                    </div>
                </main>
            </SiteShell>
        )
    }

    if (account.role === 'guardian') {
        const { data: guardianProfile } = await supabase.from('guardian_profiles')
            .select('user_id').eq('user_id', user.id).maybeSingle()
        if (!guardianProfile) redirect('/account/onboarding')

        const { data: linkData, error: linkError } = await supabase.from('guardian_player_links')
            .select('id,player_user_id,status,requested_at')
            .eq('guardian_user_id', user.id)
            .order('requested_at', { ascending: false })
        const links = !linkError ? (linkData ?? []) as LinkRow[] : []
        const approvedIds = links.filter(link => link.status === 'approved').map(link => link.player_user_id)
        const names = new Map<string, string>()
        if (approvedIds.length && ['approved', 'active'].includes(account.status)) {
            const { data: players } = await supabase.from('profiles')
                .select('user_id,first_name,last_name')
                .in('user_id', approvedIds)
            for (const player of players ?? []) {
                names.set(player.user_id, [player.first_name, player.last_name].filter(Boolean).join(' ') || 'Linked player')
            }
        }

        return (
            <SiteShell current="/account/pending">
                <main className="mx-auto max-w-4xl px-5 py-14 lg:px-8">
                    <p className="eyebrow">Guardian safeguarding</p>
                    <h1 className="display-title mt-4">Player links and consent.</h1>
                    <p className="mt-5 max-w-3xl text-sm leading-6 text-foreground/65">Claiming an invite sends a pending request to the player. Delegated consent becomes available only after the player approves the link and your account review is approved. Each consent submission is appended to history; no account or scout-review status is changed here.</p>
                    {account.status !== 'approved' && account.status !== 'active' && (
                        <p className="mt-6 rounded-md border border-[#F4D03F]/30 bg-background p-4 text-sm leading-6 text-foreground/70">Your account review is {account.status}. You may see link state, but cannot read linked player details or record delegated consent until account review is approved.</p>
                    )}
                    {linkError && <p className="mt-6 rounded-md border border-[#E67E22]/35 bg-[#E67E22]/10 p-4 text-sm" role="alert">Player link status could not be loaded. Try again later.</p>}
                    <section className="mt-8 grid gap-5">
                        {links.map(link => {
                            const playerName = names.get(link.player_user_id)
                            return (
                                <article key={link.id} className="rounded-xl border border-foreground/10 bg-card p-6">
                                    <p className="eyebrow">{link.status} link</p>
                                    <h2 className="mt-2 text-xl font-black">{playerName ?? (link.status === 'approved' ? 'Approved player link' : 'Player invitation request')}</h2>
                                    <p className="mt-2 text-xs text-foreground/50">Requested {new Date(link.requested_at).toLocaleDateString()}</p>
                                    {link.status === 'approved' && (account.status === 'approved' || account.status === 'active') && (
                                        <GuardianConsentsForm playerUserId={link.player_user_id} playerName={playerName ?? 'the linked player'} />
                                    )}
                                </article>
                            )
                        })}
                        {!linkError && links.length === 0 && (
                            <div className="rounded-xl border border-foreground/10 bg-card p-6 text-sm leading-6 text-foreground/65">No player links have been requested yet. Open a player’s one-time invitation to connect.</div>
                        )}
                    </section>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <Link href="/account/onboarding" className="rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold text-[#172219]">Guardian profile</Link>
                        <Link href="/account/pending" className="rounded-md border border-foreground/15 px-5 py-3 text-sm font-bold">Account status</Link>
                    </div>
                </main>
            </SiteShell>
        )
    }

    redirect('/account/pending')
}
