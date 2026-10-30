import Link from 'next/link'
import { ArrowRight, BadgeCheck, ClipboardCheck, Eye, ShieldCheck } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'
import { createSeoMetadata } from '@/lib/seo'

export const metadata = createSeoMetadata({
    title: 'Sports Scouting in Ghana for Teams and Scouts',
    description:
        'Learn how Demo Day scouts discover and evaluate sports talent in Ghana through structured events, shared criteria, verification, and safeguarding.',
    path: '/scouts',
})

const scoutSteps = [
    {
        icon: BadgeCheck,
        title: 'Complete verification',
        description: 'Scouts and adults with direct athlete contact are vetted before they can access the platform or attend an event.',
    },
    {
        icon: Eye,
        title: 'Observe live competition',
        description: 'Watch organized fixtures where eligible athletes compete in a consistent evaluation environment.',
    },
    {
        icon: ClipboardCheck,
        title: 'Record structured assessments',
        description: 'Use sport-specific criteria and document technical and tactical observations alongside performance evidence.',
    },
    {
        icon: ShieldCheck,
        title: 'Follow safeguarding standards',
        description: 'Athlete and family contact follows the Scout Code of Conduct and documented communication channels.',
    },
]

const questions = [
    {
        question: 'What is Demo Day?',
        answer:
            'Demo Day is a sports talent discovery platform in Ghana. It gives athletes a structured way to be evaluated and helps teams and verified scouts discover talent beyond personal connections.',
    },
    {
        question: 'How does Demo Day verify scouts?',
        answer:
            'Scouts and other adults with direct athlete contact are vetted before they can access the platform or attend an event.',
    },
    {
        question: 'How are athletes evaluated?',
        answer:
            'Evaluations use sport-specific criteria. Scouts record observations alongside performance data, and multiple perspectives help build a fuller picture of each athlete.',
    },
    {
        question: 'Which sports does Demo Day support?',
        answer:
            'The athlete profile currently includes football, basketball, and American football. Football is the lead sport; basketball is a parallel pilot, and the American football pilot is planned for a later phase.',
    },
]

export default function ScoutsPage() {
    return (
        <SiteShell current="/scouts">
            <section className="bg-[#1e5128] px-5 py-16 text-white lg:px-8 lg:py-24">
                <div className="mx-auto max-w-7xl">
                    <p className="eyebrow text-[#F4D03F]">For scouts and teams in Ghana</p>
                    <h1 className="mt-6 max-w-4xl text-5xl font-black uppercase leading-[.92] tracking-[-.06em] sm:text-7xl">
                        Sports scouting built on evidence, not connections.
                    </h1>
                    <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75">
                        Demo Day connects teams and verified scouts with athletes through organized evaluation events, shared criteria, and documented performance context.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-md bg-[#F4D03F] px-6 py-3.5 font-bold text-[#172219]">
                            Create a scout account <ArrowRight aria-hidden="true" />
                        </Link>
                        <Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-md border border-white/30 px-6 py-3.5 font-bold">
                            See the full pathway <ArrowRight aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
                <div className="max-w-3xl">
                    <p className="eyebrow">A clear scout pathway</p>
                    <h2 className="section-title mt-4">Discover talent with more context.</h2>
                    <p className="mt-5 leading-7 text-muted-foreground">
                        Demo Day is a Ghana-focused sports talent discovery network—not an open directory. Scouts are verified before access, and athlete assessments follow a structured process designed to make evidence easier to compare.
                    </p>
                </div>
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {scoutSteps.map(({ icon: Icon, title, description }) => (
                        <article key={title} className="rounded-xl border border-foreground/10 p-6">
                            <Icon aria-hidden="true" className="size-6 text-[#1e5128]" />
                            <h3 className="mt-5 text-lg font-black uppercase">{title}</h3>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="border-y border-white/10 bg-white/[.03] px-5 py-16 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <p className="eyebrow">Scout questions</p>
                    <h2 className="section-title mt-4">What teams and scouts ask.</h2>
                    <div className="mt-8 divide-y divide-foreground/10 border-y border-foreground/10">
                        {questions.map(({ question, answer }) => (
                            <article key={question} className="py-6">
                                <h3 className="text-lg font-black">{question}</h3>
                                <p className="mt-2 leading-7 text-muted-foreground">{answer}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </SiteShell>
    )
}
