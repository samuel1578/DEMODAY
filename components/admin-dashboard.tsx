import Link from 'next/link'
import { CalendarDays, ImageIcon, ShieldCheck, Users } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { AdminSectionNavigation } from '@/components/admin/admin-section-nav'
import {
  Card,
  DashboardHeader,
  StatCard,
  StatGrid,
} from '@/components/dashboards/shared'
import { formatShortDate, humanizeToken } from '@/lib/dashboard'
import { summarizeAdminOverview } from '@/lib/admin-overview'
import type { AuditLogEntry } from '@/lib/supabase/contracts'
import type { AdminOverviewData } from '@/lib/supabase/admin-oversight-data'

const auditActionLabels: Partial<Record<AuditLogEntry['action'], string>> = {
  profile_status_changed: 'Account review updated',
  scout_vetting_changed: 'Scout vetting updated',
  guardian_link_status_changed: 'Guardian link updated',
  consent_recorded: 'Consent recorded',
  event_status_changed: 'Event updated',
  media_status_changed: 'Media moderation updated',
}

function AdminActionCard({ href, eyebrow, title, description, action }: {
  href: string
  eyebrow: string
  title: string
  description: string
  action: string
}) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-foreground/10 bg-card p-6">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2 text-xl font-black uppercase tracking-tight">{title}</h2>
      <p className="mt-3 flex-1 text-sm leading-6 text-foreground/60">{description}</p>
      <Link href={href} className="mt-5 inline-flex w-fit items-center rounded-md bg-[#1e5128] px-4 py-2.5 text-sm font-bold text-white">
        {action}
      </Link>
    </article>
  )
}

export function AdminDashboard({ data }: { data: AdminOverviewData }) {
  const summary = summarizeAdminOverview({
    profiles: data.profiles,
    scoutVettings: data.scoutVettings,
    events: data.events,
    guardianLinks: data.guardianLinks,
    pendingMedia: data.pendingMediaLoaded,
  })

  return (
    <SiteShell current="/admin">
      <main className="admin-dashboard mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <DashboardHeader
          eyebrow="Demo Day administration"
          title="Run the network."
          intro="A live operations view for account reviews, events, media moderation, and guardian safeguarding. Each section opens its dedicated database-backed workflow."
          secondary={(
            <Link href="/admin/reviews" className="inline-flex items-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3 font-bold text-[#172219]">
              <Users className="size-4" aria-hidden="true" /> Open review queue
            </Link>
          )}
        />

        <AdminSectionNavigation current="/admin" />

        <section aria-label="Administration summary">
          <StatGrid>
            <StatCard
              label="Accounts in review window"
              value={String(summary.profiles.loaded)}
              hint={`Latest ${summary.profiles.loaded} profiles loaded${summary.profiles.capped ? ' · window may be incomplete' : ''}.`}
            />
            <StatCard
              label="Awaiting account review"
              value={String(summary.profiles.awaitingReview)}
              hint="Pending or reviewed in the loaded profile window."
            />
            <StatCard
              label="Scout vetting queue"
              value={String(summary.scoutVetting.awaitingReview)}
              hint={`Awaiting independent vetting · ${summary.scoutVetting.loaded} scout records loaded.`}
            />
            <StatCard
              label="Pending media loaded"
              value={String(summary.pendingMediaLoaded)}
              hint="Latest moderation queue records · up to 200."
            />
          </StatGrid>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Network totals">
          <StatCard label="Events" value={String(summary.events.total)} hint={`${summary.events.byStatus.published} published · ${summary.events.spotlight} spotlight.`} />
          <StatCard label="Guardian links" value={String(summary.guardianLinks.total)} hint={`${summary.guardianLinks.byStatus.pending} pending · ${summary.guardianLinks.expiredPending} expired requests.`} />
          <StatCard label="Approved or active accounts" value={String(summary.profiles.byStatus.approved + summary.profiles.byStatus.active)} hint="Account status in the loaded profile window above." />
          <StatCard label="Rejected account reviews" value={String(summary.profiles.byStatus.rejected)} hint="Account status in the loaded profile window above." />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Admin workspaces">
          <AdminActionCard
            href="/admin/reviews"
            eyebrow="Accounts"
            title="Profile reviews"
            description="Review player, scout, guardian, and admin accounts; make account and scout-vetting decisions."
            action="Review profiles"
          />
          <AdminActionCard
            href="/admin/events"
            eyebrow="Calendar"
            title="Event management"
            description="Create and publish events, manage their status, and choose the homepage spotlight."
            action="Manage events"
          />
          <AdminActionCard
            href="/admin/media"
            eyebrow="Safeguarding"
            title="Media moderation"
            description="Review pending profile media and remove rejected images from delivery. Private documents remain server-signed."
            action="Review media"
          />
          <AdminActionCard
            href="/admin/guardians"
            eyebrow="Safeguarding"
            title="Guardian oversight"
            description="Inspect guardian-athlete link status, expiry, and recorded consent decisions. Reject or revoke links; athlete approval remains the consent authority."
            action="Review guardian links"
          />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <Card title="Account mix · loaded window">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Object.entries(summary.profiles.byRole).map(([role, count]) => (
                <div key={role} className="rounded-lg border border-foreground/10 p-4">
                  <span className="text-xs uppercase tracking-wider text-foreground/50">{humanizeToken(role)}s</span>
                  <strong className="mt-2 block text-2xl font-black text-[#1e5128] dark:text-[#F4D03F]">{count}</strong>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-foreground/50">
              These figures describe only the latest loaded profile window, not a guaranteed organization-wide total.
            </p>
          </Card>

          <Card title="Recent operations">
            {data.audit.length ? (
              <ul className="divide-y divide-foreground/10">
                {data.audit.map(entry => (
                  <li key={entry.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <span className="flex min-w-0 items-start gap-2">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#1e5128] dark:text-[#F4D03F]" aria-hidden="true" />
                      <span className="min-w-0">
                        <b className="block text-sm">{auditActionLabels[entry.action] ?? `${humanizeToken(entry.action)} updated`}</b>
                        <span className="text-xs text-foreground/50">{humanizeToken(entry.entity_type)}{entry.new_status ? ` · ${entry.new_status}` : ''}</span>
                      </span>
                    </span>
                    <time className="shrink-0 text-xs text-foreground/45" dateTime={entry.created_at}>{formatShortDate(entry.created_at)}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm leading-6 text-foreground/60">No admin activity has been recorded yet.</p>
            )}
          </Card>
        </section>

        <p className="mt-6 flex items-center gap-2 text-xs text-foreground/50">
          <CalendarDays className="size-4" aria-hidden="true" /> Event figures use the current database event list. Profile figures are explicitly bounded to the latest review window.
          <ImageIcon className="ml-2 size-4" aria-hidden="true" /> Media queue loading is capped at 200 items.
        </p>
      </main>
    </SiteShell>
  )
}
