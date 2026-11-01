'use client'

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { ArrowLeft, ArrowRight, Image as ImageIcon, X } from 'lucide-react'
import Link from 'next/link'
import { SiteShell } from '@/components/site-shell'
import { AdminSectionNavigation } from '@/components/admin/admin-section-nav'
import { Card, consentLabel, DashboardHeader, DashboardNotice, StatusPill, statusTone } from '@/components/dashboards/shared'
import { formatShortDate } from '@/lib/dashboard'
import type { AdminProfileReviewMedia, AdminProfileReviewStep, AdminProfileSubmissionReview } from '@/lib/admin-profile-review'

interface GalleryState {
    media: AdminProfileReviewMedia[]
    startIndex: number
}

function GalleryModal({
    media,
    startIndex,
    openerRef,
    onClose,
}: {
    media: AdminProfileReviewMedia[]
    startIndex: number
    openerRef: { current: HTMLElement | null }
    onClose: () => void
}) {
    const [index, setIndex] = useState(startIndex)
    const dialogRef = useRef<HTMLDivElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    const current = media[index]

    const showPrevious = useCallback(() => {
        setIndex(value => (value - 1 + media.length) % media.length)
    }, [media.length])
    const showNext = useCallback(() => {
        setIndex(value => (value + 1) % media.length)
    }, [media.length])

    useEffect(() => {
        const previousFocus = openerRef.current
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        closeButtonRef.current?.focus()

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
                return
            }
            if (event.key === 'ArrowLeft' && media.length > 1) {
                event.preventDefault()
                showPrevious()
                return
            }
            if (event.key === 'ArrowRight' && media.length > 1) {
                event.preventDefault()
                showNext()
                return
            }
            if (event.key !== 'Tab' || !dialogRef.current) return

            const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
            )]
            if (!focusable.length) {
                event.preventDefault()
                dialogRef.current.focus()
                return
            }
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = previousOverflow
            previousFocus?.focus()
        }
    }, [media.length, onClose, openerRef, showNext, showPrevious])

    if (!current) return null

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
            onMouseDown={event => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-gallery-title"
                aria-describedby="profile-gallery-description"
                tabIndex={-1}
                className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-white/15 bg-[#121812] text-white shadow-2xl outline-none"
            >
                <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
                    <div>
                        <h2 id="profile-gallery-title" className="text-lg font-black">Submitted image gallery</h2>
                        <p id="profile-gallery-description" className="mt-1 text-sm text-white/65">
                            {current.label} · {index + 1} of {media.length} · uploaded {formatShortDate(current.createdAt)}
                        </p>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-white/20 text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D03F]"
                        aria-label="Close image gallery"
                    >
                        <X className="size-5" aria-hidden="true" />
                    </button>
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center bg-black/25 p-3 sm:p-6">
                    {current.deliveryUrl ? (
                        <img
                            src={current.deliveryUrl}
                            alt={`${current.label}, submitted image ${index + 1} of ${media.length}`}
                            className="max-h-[68vh] max-w-full rounded-md object-contain"
                        />
                    ) : (
                        <p className="max-w-lg rounded-lg border border-white/15 p-6 text-center text-sm leading-6 text-white/70">
                            This image preview is temporarily unavailable. The review data is still available, but no delivery URL could be resolved.
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3 sm:px-6">
                    <span className="text-xs text-white/55">{current.visibility === 'private' ? 'Private signed image' : 'Public image'}</span>
                    {media.length > 1 ? (
                        <div className="flex gap-2">
                            <button type="button" onClick={showPrevious} className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D03F]">
                                <ArrowLeft className="size-4" aria-hidden="true" /> Previous image
                            </button>
                            <button type="button" onClick={showNext} className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-sm font-semibold hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D03F]">
                                Next image <ArrowRight className="size-4" aria-hidden="true" />
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

function ReviewFields({ step }: { step: AdminProfileReviewStep }) {
    const fields = step.fields ?? []
    if (!fields.length) return <p className="text-sm leading-6 text-foreground/55">{step.emptyMessage}</p>

    return (
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {fields.map(field => (
                <div key={field.label} className="min-w-0">
                    <dt className="text-xs font-bold uppercase tracking-wider text-foreground/50">{field.label}</dt>
                    <dd className="mt-1 break-words text-sm font-semibold leading-6">
                        {field.href ? (
                            <a href={field.href} target="_blank" rel="noreferrer" className="text-[#1e5128] underline decoration-current/40 underline-offset-4 hover:decoration-current dark:text-[#F4D03F]">
                                {field.value}
                            </a>
                        ) : field.value}
                    </dd>
                </div>
            ))}
        </dl>
    )
}

function ReviewConsents({ step }: { step: AdminProfileReviewStep }) {
    const consents = step.consents ?? []
    if (!consents.length) return <p className="text-sm leading-6 text-foreground/55">{step.emptyMessage}</p>

    return (
        <ul className="divide-y divide-foreground/10">
            {consents.map(consent => (
                <li key={consent.consentType} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span>
                        <b className="block text-sm font-bold">{consentLabel(consent.consentType)}</b>
                        <span className="mt-1 block text-xs text-foreground/55">Latest decision · {formatShortDate(consent.recordedAt)}</span>
                    </span>
                    <StatusPill label={consent.decision === 'granted' ? 'Granted' : 'Withdrawn'} tone={consent.decision === 'granted' ? 'positive' : 'attention'} />
                </li>
            ))}
        </ul>
    )
}

export function ProfileSubmissionReview({ review }: { review: AdminProfileSubmissionReview }) {
    const [stepIndex, setStepIndex] = useState(0)
    const [gallery, setGallery] = useState<GalleryState | null>(null)
    const galleryOpenerRef = useRef<HTMLElement | null>(null)
    const closeGallery = useCallback(() => setGallery(null), [])
    const currentStep = review.steps[stepIndex]

    function openGallery(media: AdminProfileReviewMedia[], index: number, event: ReactMouseEvent<HTMLButtonElement>) {
        galleryOpenerRef.current = event.currentTarget
        setGallery({ media, startIndex: index })
    }

    return (
        <SiteShell current="/admin">
            <main className="admin-dashboard mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
                <DashboardHeader
                    eyebrow={`${review.roleLabel} submission · ${review.accountStatus}`}
                    title={review.displayName}
                    intro={`Account created ${formatShortDate(review.submittedAt)}. Review only the submitted details relevant to this role; contact, identity-document, and other restricted records are intentionally excluded here.`}
                    secondary={(
                        <>
                            <Link href="/admin/reviews" className="flex items-center gap-2 rounded-md border border-foreground/15 px-5 py-3 font-bold">
                                <ArrowLeft className="size-4" aria-hidden="true" /> Review queue
                            </Link>
                            <Link href="/admin/media" className="flex items-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3 font-bold text-[#172219]">
                                <ImageIcon className="size-4" aria-hidden="true" /> Media moderation
                            </Link>
                        </>
                    )}
                />

                <AdminSectionNavigation current="/admin/reviews" />

                {review.dataWarnings.length ? (
                    <div className="mt-6">
                        <DashboardNotice tone="attention">
                            Some submitted records could not be loaded for this admin session: {review.dataWarnings.join(', ')}. Retry later or verify the active-admin read policies. Restricted fields are never loaded as a fallback.
                        </DashboardNotice>
                    </div>
                ) : null}

                {currentStep ? (
                    <section className="mt-8" aria-label="Submitted data review">
                        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-foreground/50">Onboarding review</p>
                                <p className="mt-1 text-sm text-foreground/60" aria-live="polite">Step {stepIndex + 1} of {review.steps.length}</p>
                            </div>
                            <div className="flex items-center gap-2" aria-hidden="true">
                                {review.steps.map((step, index) => (
                                    <span key={step.id} className={`h-1.5 w-8 rounded-full ${index <= stepIndex ? 'bg-[#1e5128] dark:bg-[#F4D03F]' : 'bg-foreground/15'}`} />
                                ))}
                            </div>
                        </div>

                        <Card title={currentStep.title}>
                            <p className="mb-6 max-w-3xl text-sm leading-6 text-foreground/60">{currentStep.description}</p>
                            {currentStep.fields ? <ReviewFields step={currentStep} /> : null}
                            {currentStep.consents ? <ReviewConsents step={currentStep} /> : null}
                            {currentStep.media ? (
                                currentStep.media.length ? (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {currentStep.media.map((item, index) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={event => openGallery(currentStep.media ?? [], index, event)}
                                                aria-label={`Open ${item.label} in gallery`}
                                                className="group overflow-hidden rounded-lg border border-foreground/10 bg-background text-left transition hover:border-[#F4D03F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e5128]"
                                            >
                                                <div className="relative aspect-[4/3] overflow-hidden bg-foreground/5">
                                                    {item.deliveryUrl ? (
                                                        <img src={item.deliveryUrl} alt="" className="size-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                                                    ) : (
                                                        <span className="flex size-full items-center justify-center text-foreground/40">
                                                            <ImageIcon className="size-8" aria-hidden="true" />
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="flex items-center justify-between gap-2 p-3">
                                                    <span>
                                                        <span className="block text-sm font-bold">{item.label}</span>
                                                        <span className="mt-1 block text-xs text-foreground/50">{formatShortDate(item.createdAt)}</span>
                                                    </span>
                                                    <StatusPill label={item.status} tone={statusTone(item.status)} />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                ) : <p className="text-sm leading-6 text-foreground/55">{currentStep.emptyMessage}</p>
                            ) : null}
                        </Card>

                        <div className="mt-5 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={() => setStepIndex(index => Math.max(0, index - 1))}
                                disabled={stepIndex === 0}
                                className="inline-flex items-center gap-2 rounded-md border border-foreground/15 px-4 py-3 text-sm font-bold transition hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ArrowLeft className="size-4" aria-hidden="true" /> Previous
                            </button>
                            {stepIndex < review.steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setStepIndex(index => Math.min(review.steps.length - 1, index + 1))}
                                    className="inline-flex items-center gap-2 rounded-md bg-[#1e5128] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#163d1e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D03F]"
                                >
                                    Next <ArrowRight className="size-4" aria-hidden="true" />
                                </button>
                            ) : (
                                <Link href="/admin/reviews" className="inline-flex items-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold text-[#172219]">
                                    Back to review queue <ArrowRight className="size-4" aria-hidden="true" />
                                </Link>
                            )}
                        </div>
                    </section>
                ) : (
                    <div className="mt-8">
                        <DashboardNotice tone="neutral">{review.notSubmittedMessage ?? 'No role-specific submission is available yet.'}</DashboardNotice>
                    </div>
                )}
            </main>
            {gallery ? (
                <GalleryModal
                    media={gallery.media}
                    startIndex={gallery.startIndex}
                    openerRef={galleryOpenerRef}
                    onClose={closeGallery}
                />
            ) : null}
        </SiteShell>
    )
}
