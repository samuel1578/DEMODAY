'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow'
import { Reveal } from '@/components/reveal'
import { SiteShell } from '@/components/site-shell'
import { roleCards, roleFlows } from '@/data/onboarding'
import type { RoleId } from '@/lib/onboarding'

export default function SignUp() {
  const [role, setRole] = useState<RoleId | null>(null)

  if (role)
    return (
      <SiteShell current="/sign-up">
        <main className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-16">
          <OnboardingFlow key={role} role={role} flow={roleFlows[role]} onExit={() => setRole(null)} />
        </main>
      </SiteShell>
    )

  return (
    <SiteShell current="/sign-up">
      <main className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">Choose your pathway</p>
          <h1 className="display-title mt-5">Create your place in the network.</h1>
          <p className="mt-6 text-lg leading-8 text-foreground/65">
            Every role gets a tailored onboarding. Athletes, guardians and scouts each answer a different set of questions — because safeguarding, scouting and consent are not the same job.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {roleCards.map(card => (
            <article
              key={card.id}
              className="sign-up-role-card group overflow-hidden rounded-xl border border-foreground/10 bg-card text-left transition hover:-translate-y-1 hover:border-[#F4D03F]"
            >
              <img src={card.image} alt="" className="aspect-[4/3] w-full object-cover opacity-80 transition group-hover:opacity-100" />
              <div className="p-6">
                <b className="text-lg uppercase tracking-wide">{card.label}</b>
                <span className="mt-3 block text-sm leading-6 text-foreground/60">{card.detail}</span>
                <button
                  type="button"
                  onClick={() => setRole(card.id as RoleId)}
                  className="sign-up-role-start mt-5 flex items-center gap-2 rounded-md bg-[#F4D03F] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#172219]"
                >
                  Start <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <section className="sign-up-benefits mt-14 grid gap-4 rounded-xl border border-foreground/10 bg-card p-6 sm:grid-cols-3 sm:p-8">
          {[
            ['Separate consents', 'Participation consent and media/image consent are recorded independently — and either can be withdrawn.'],
            ['Guardian gatekeeping', 'Under-18 accounts stay dormant until a verified guardian confirms identity and consent.'],
            ['Vetted access', 'Scout profiles stay locked until safeguarding vetting clears. No exceptions.'],
          ].map(([title, body], index) => (
            <Reveal key={title} delay={index * 0.18} className="motion-hover-card rounded-xl p-4">
              <Check className="text-[#F4D03F]" />
              <h3 className="mt-3 text-lg font-black uppercase tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-foreground/55">{body}</p>
            </Reveal>
          ))}
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-foreground/60">
          <span>Demo Day CEO?</span>
          <Link href="/sign-in" className="flex items-center gap-2 font-black text-[#1e5128] underline decoration-2 underline-offset-2">
            Sign in from the console <ArrowLeft className="size-4" />
          </Link>
        </div>
      </main>
    </SiteShell>
  )
}
