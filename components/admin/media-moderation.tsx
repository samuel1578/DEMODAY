import Link from 'next/link'
import { FileImage, ShieldCheck } from 'lucide-react'
import { updateAdminMediaStatusAction } from '@/app/actions/admin-oversight'
import { AdminSectionNavigation } from '@/components/admin/admin-section-nav'
import { SiteShell } from '@/components/site-shell'
import { DashboardHeader, DashboardNotice, StatusPill, statusTone } from '@/components/dashboards/shared'
import { formatShortDate, humanizeToken } from '@/lib/dashboard'
import { formatBytes } from '@/lib/media'
import type { MediaStatus } from '@/lib/supabase/contracts'
import type { AdminMediaItem } from '@/lib/supabase/admin-oversight-data'

type MediaFilter = MediaStatus | 'all'

const filters: { value: MediaFilter; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected / removed' },
    { value: 'all', label: 'All statuses' },
]

const resultMessages: Record<string, { tone: 'positive' | 'attention'; message: string }> = {
    approved: { tone: 'positive', message: 'Media approved. The decision is saved in the moderation status.' },
    rejected: { tone: 'positive', message: 'Media rejected and its stored image object was removed.' },
    invalid: { tone: 'attention', message: 'That moderation request was invalid.' },
    denied: { tone: 'attention', message: 'Only an active administrator can moderate profile media.' },
    'not-found': { tone: 'attention', message: 'That media record could not be found.' },
    stale: { tone: 'attention', message: 'That media item is no longer current or has already been rejected. Refresh the queue.' },
    'storage-failed': { tone: 'attention', message: 'The image could not be removed from storage, so its status was not changed. Try again or check R2 access.' },
    'status-failed-after-removal': { tone: 'attention', message: 'The image object was removed, but the database rejected the status update. Retry the status change; image removal is safe to repeat.' },
    'retire-failed': { tone: 'attention', message: 'The media status was rejected and its image removed, but the record could not be retired. Refresh and contact support if it remains in the active queue.' },
    failed: { tone: 'attention', message: 'The media status could not be saved. Try again.' },
}

function ModerationForm({ mediaId, status }: { mediaId: string; status: 'approved' | 'rejected' }) {
    return (
        <form action={updateAdminMediaStatusAction}>
            <input type="hidden" name="mediaId" value={mediaId} />
            <input type="hidden" name="status" value={status} />
            <button className={status === 'approved'
                ? 'rounded-md bg-[#1e5128] px-4 py-2 text-sm font-bold text-white'
                : 'rounded-md border border-red-500/35 px-4 py-2 text-sm font-bold text-red-700 dark:text-red-300'}>
                {status === 'approved' ? 'Approve media' : 'Reject & remove'}
            </button>
        </form>
    )
}

function MediaCard({ item }: { item: AdminMediaItem }) {
    const canModerate = item.isCurrent && item.status !== 'rejected'
    const isIdentityDocument = item.mediaType === 'identity_document'

    return (
        <article className="grid gap-5 rounded-xl border border-foreground/10 bg-card p-5 md:grid-cols-[minmax(0,240px)_1fr]">
            <div className="flex min-h-40 items-center justify-center overflow-hidden rounded-lg border border-foreground/10 bg-background p-2">
                {item.deliveryUrl && isIdentityDocument ? (
                    <a href={item.deliveryUrl} target="_blank" rel="noreferrer" className="rounded-md border border-foreground/15 px-4 py-3 text-sm font-bold hover:border-[#F4D03F]">
                        Open private identity document
                    </a>
                ) : item.deliveryUrl ? (
                    <img src={item.deliveryUrl} alt={`${item.mediaLabel} submitted by ${item.ownerName}`} className="max-h-64 w-full rounded-md object-contain" />
                ) : (
                    <span className="flex items-center gap-2 text-sm text-foreground/45"><FileImage className="size-5" aria-hidden="true" /> No deliverable preview</span>
                )}
            </div>

            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={humanizeToken(item.status)} tone={statusTone(item.status)} />
                    <StatusPill label={item.isCurrent ? 'Current' : 'Retired'} />
                    {item.visibility === 'private' ? <StatusPill label="Private · signed delivery" tone="attention" /> : <StatusPill label="Public delivery" />}
                </div>
                <h2 className="mt-3 text-xl font-black uppercase tracking-tight">{item.mediaLabel}</h2>
                <p className="mt-1 text-sm text-foreground/65">{item.ownerName} · {humanizeToken(item.ownerRole)} · account {humanizeToken(item.ownerStatus)}</p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-[10px] uppercase tracking-wider text-foreground/45">Submitted</dt><dd className="mt-1 font-semibold">{formatShortDate(item.createdAt)}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-wider text-foreground/45">File</dt><dd className="mt-1 font-semibold">{humanizeToken(item.contentType)} · {formatBytes(item.byteSize)}</dd></div>
                    <div><dt className="text-[10px] uppercase tracking-wider text-foreground/45">Signed URLs required</dt><dd className="mt-1 font-semibold">{item.requiresSignedUrls ? 'Yes' : 'No'}</dd></div>
                </dl>
                {canModerate ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {item.status === 'pending' ? <ModerationForm mediaId={item.id} status="approved" /> : null}
                        <ModerationForm mediaId={item.id} status="rejected" />
                    </div>
                ) : null}
                {isIdentityDocument ? (
                    <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-foreground/50">
                        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Identity documents are private and are opened only through a temporary signed link. Do not copy or share the link.
                    </p>
                ) : null}
            </div>
        </article>
    )
}

export function MediaModeration({ items, filter, result }: { items: AdminMediaItem[]; filter: MediaFilter; result?: string }) {
    const notice = result ? resultMessages[result] : undefined
    const currentFilter = filters.find(item => item.value === filter) ?? filters[0]

    return (
        <SiteShell current="/admin">
            <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
                <DashboardHeader
                    eyebrow="Admin · safeguarding"
                    title="Review submitted media."
                    intro="Moderate profile photos, action images, and private identity documents. Rejecting media removes its object from R2 before recording the decision; previews are resolved from server-authorized records."
                />
                <AdminSectionNavigation current="/admin/media" />
                {notice ? <div className="mt-6"><DashboardNotice tone={notice.tone}>{notice.message}</DashboardNotice></div> : null}

                <nav aria-label="Filter media by status" className="mt-8 flex flex-wrap gap-2">
                    {filters.map(option => (
                        <Link
                            key={option.value}
                            href={option.value === 'all' ? '/admin/media?status=all' : `/admin/media?status=${option.value}`}
                            aria-current={filter === option.value ? 'page' : undefined}
                            className={`rounded-md px-4 py-2 text-sm font-bold ${filter === option.value ? 'bg-[#1e5128] text-white' : 'border border-foreground/15 hover:border-[#F4D03F]'}`}
                        >
                            {option.label}
                        </Link>
                    ))}
                </nav>

                <div className="mt-5 flex items-center justify-between gap-4">
                    <h2 className="text-xl font-black uppercase tracking-tight">{currentFilter.label} · {items.length}</h2>
                    <span className="text-xs text-foreground/45">Latest 200 matching records at most</span>
                </div>
                {items.length ? (
                    <div className="mt-4 grid gap-4">{items.map(item => <MediaCard key={item.id} item={item} />)}</div>
                ) : (
                    <p className="mt-4 rounded-xl border border-dashed border-foreground/20 bg-card p-6 text-sm leading-6 text-foreground/60">
                        No {filter === 'all' ? '' : `${filter} `}media records are available in this view. Newly submitted items appear in the pending queue.
                    </p>
                )}
            </main>
        </SiteShell>
    )
}
