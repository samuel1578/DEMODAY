'use client'

import { useState } from 'react'
import { ArrowRight, BadgeCheck, ClipboardCheck, Eye, ShieldCheck, UserRound, UsersRound } from 'lucide-react'
import { Reveal } from '@/components/reveal'

const journeys = {
    Player: {
        icon: UserRound,
        image: 'https://images.pexels.com/photos/30461448/pexels-photo-30461448.jpeg',
        imageAlt: 'Player representing the athlete pathway',
        intro: 'A fair route from registration to a real opportunity to be seen.',
        steps: [
            ['01', 'Build your profile', 'Choose your sport, position, and region. Share your playing experience so your place in the pathway starts with the right context.'],
            ['02', 'Get verified and placed', 'Your identity, age category, and eligibility are checked. Teams are formed around geography and position to create balanced competition.'],
            ['03', 'Play your game', 'Compete at an organized Demo Day with verified officials, structured fixtures, and a safeguarding officer present.'],
            ['04', 'Get evaluated fairly', 'Officials record sport-specific performance data. Verified scouts assess players against shared criteria, with multiple evaluations for standouts.'],
            ['05', 'See what comes next', 'Your results can support sport-specific rankings and progression to regional or elite events, and help surface relevant opportunities.'],
        ],
    },
    Scout: {
        icon: Eye,
        image: 'https://images.pexels.com/photos/38761310/pexels-photo-38761310.jpeg',
        imageAlt: 'Scout observing the game',
        intro: 'A verified, structured way to assess talent beyond who you already know.',
        steps: [
            ['01', 'Complete verification', 'Scouts and other adults with direct athlete contact are vetted before they can access the platform or an event.'],
            ['02', 'Observe live competition', 'Watch organized, geographically grounded fixtures where eligible athletes compete in a consistent environment.'],
            ['03', 'Record your assessment', 'Use predetermined criteria for the sport. Add technical and tactical observations alongside the recorded performance data.'],
            ['04', 'Build a fuller picture', 'Independent evaluations help reduce reliance on one person’s opinion. Assessments contribute to an auditable, sport-specific ranking.'],
            ['05', 'Follow safeguarding rules', 'Any athlete or family contact follows the Scout Code of Conduct and documented channels; communications about recruitment are visible to safeguarding staff.'],
        ],
    },
    Guardian: {
        icon: UsersRound,
        image: '/guardians.jpeg',
        imageAlt: 'Guardians supporting young athletes',
        intro: 'Clear consent, visible safeguards, and a reliable way to stay informed.',
        steps: [
            ['01', 'Confirm consent', 'For athletes under 18, a guardian’s verified identity and consent are required before the athlete account can be activated.'],
            ['02', 'Choose media permissions', 'Consent to registration and consent to use photos or video are separate. Media permission can be withheld or revoked independently.'],
            ['03', 'Follow participation', 'Keep track of your young athlete’s participation and receive safeguarding communications through the program.'],
            ['04', 'Know who is responsible', 'Adults with direct contact are vetted, and a designated safeguarding officer is present at every event day involving minors.'],
            ['05', 'Raise a concern', 'Use the independent reporting channel to contact the Child Safeguarding Officer about a safety concern.'],
        ],
    },
}

type Role = keyof typeof journeys

const sharedSafeguards = [
    { icon: BadgeCheck, title: 'Verified adults', text: 'Scouts, coaches, and other adults are vetted before access.' },
    { icon: ClipboardCheck, title: 'Recorded decisions', text: 'Evaluations and progression are documented, not hidden.' },
    { icon: ShieldCheck, title: 'Minor-first safeguards', text: 'Guardian consent and event-day safeguarding are built in.' },
]

export function HowItWorksJourney() {
    const [activeRole, setActiveRole] = useState<Role>('Player')
    const journey = journeys[activeRole]
    const RoleIcon = journey.icon

    return (
        <>
            <section className="bg-[#1e5128] px-5 py-16 text-white lg:px-8 lg:py-24">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
                        <Reveal className="max-w-3xl">
                            <p className="eyebrow">How Demo Day works</p>
                            <h1 className="mt-6 text-6xl font-black uppercase leading-[.88] tracking-[-.07em] sm:text-8xl">Know your <span className="text-[#F4D03F]">next move.</span></h1>
                            <p className="mt-7 max-w-xl text-lg leading-8 text-white/70">The pathway looks different depending on your role. Choose yours to see what happens, what to expect, and how each step is protected.</p>
                        </Reveal>
                        <div className="w-full lg:w-[22rem] lg:pt-2">
                            <p className="menu-type mb-3 text-white/60">I’m here as a</p>
                            <div role="group" aria-label="Choose your role" className="grid grid-cols-3 border border-white/20 bg-black/10 p-1">
                                {(Object.keys(journeys) as Role[]).map((role) => (
                                    <button
                                        key={role}
                                        type="button"
                                        aria-pressed={activeRole === role}
                                        aria-controls="role-journey-panel"
                                        onClick={() => setActiveRole(role)}
                                        className={`min-h-11 px-2 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F4D03F] ${activeRole === role ? 'bg-[#F4D03F] text-[#172219]' : 'text-white/70 hover:text-white'}`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-[#172219] px-5 py-16 text-white lg:px-8 lg:py-24">
                <div id="role-journey-panel" aria-labelledby={`role-journey-heading-${activeRole.toLowerCase()}`} className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
                    <Reveal>
                        <div className="flex size-12 items-center justify-center bg-[#e9c46a] text-[#172219]"><RoleIcon /></div>
                        <p className="eyebrow mt-8">The {activeRole.toLowerCase()} journey</p>
                        <h2 id={`role-journey-heading-${activeRole.toLowerCase()}`} className="mt-4 text-4xl font-black uppercase leading-none">{activeRole === 'Guardian' ? 'Your athlete. A clearer path.' : activeRole === 'Scout' ? 'See the game. Record the evidence.' : 'Your game deserves a fair look.'}</h2>
                        <p className="mt-5 max-w-md leading-7 text-white/65">{journey.intro}</p>
                        <div className="mt-8 overflow-hidden rounded-xl border border-white/10">
                            <img
                                src={journey.image}
                                alt={journey.imageAlt}
                                className="aspect-[4/3] w-full object-cover"
                            />
                        </div>
                    </Reveal>
                    <div key={activeRole} className="animate-in fade-in duration-300">
                        {journey.steps.map(([number, title, description]) => (
                            <article key={number} className="grid gap-3 border-t border-white/15 py-6 sm:grid-cols-[3rem_1fr] sm:gap-5">
                                <span className="menu-type pt-1 text-[#F4D03F]">{number}</span>
                                <div>
                                    <h3 className="text-xl font-black uppercase">{title}</h3>
                                    <p className="mt-2 max-w-2xl leading-7 text-white/60">{description}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="border-y border-black/10 bg-[#e9c46a] px-5 py-14 text-[#172219] lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 max-w-xl">
                        <p className="menu-type text-[#1e5128]">Every role. The same standard.</p>
                        <h2 className="mt-3 text-3xl font-black uppercase leading-none">A fair process is a protected process.</h2>
                    </div>
                    <div className="grid gap-7 md:grid-cols-3">
                        {sharedSafeguards.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="border-t border-[#172219]/25 pt-4">
                                <Icon className="size-5" aria-hidden="true" />
                                <h3 className="mt-4 font-black uppercase">{title}</h3>
                                <p className="mt-2 max-w-sm text-sm leading-6 text-[#172219]/75">{text}</p>
                            </div>
                        ))}
                    </div>
                    <a href="/safeguarding" className="mt-9 inline-flex items-center gap-2 font-bold underline decoration-1 underline-offset-4">Our safeguarding standards <ArrowRight className="size-4" /></a>
                </div>
            </section>
        </>
    )
}