import Link from 'next/link'

const sections = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/reviews', label: 'Profile reviews' },
    { href: '/admin/events', label: 'Events' },
    { href: '/admin/media', label: 'Media moderation' },
    { href: '/admin/guardians', label: 'Guardian oversight' },
] as const

export function AdminSectionNavigation({ current }: { current: (typeof sections)[number]['href'] }) {
    return (
        <nav aria-label="Admin sections" className="mt-6 overflow-x-auto border-b border-foreground/10 pb-3">
            <ul className="flex min-w-max gap-2">
                {sections.map(section => {
                    const active = current === section.href
                    return (
                        <li key={section.href}>
                            <Link
                                href={section.href}
                                aria-current={active ? 'page' : undefined}
                                className={`inline-flex min-h-10 items-center rounded-md px-4 py-2 text-sm font-bold transition ${active
                                    ? 'bg-[#1e5128] text-white'
                                    : 'border border-foreground/10 bg-card text-foreground/70 hover:border-[#F4D03F] hover:text-foreground'}`}
                            >
                                {section.label}
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </nav>
    )
}
