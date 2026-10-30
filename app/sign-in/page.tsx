import type { Metadata } from 'next'
import { ShieldCheck } from 'lucide-react'
import { SignInForm } from '@/components/auth/sign-in-form'
import { SiteShell } from '@/components/site-shell'

export const metadata: Metadata = {
  title: 'Sign In',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default function SignInPage() {
  return (
    <SiteShell current="/sign-in">
      <main className="sign-in-page mx-auto grid min-h-[calc(100vh-180px)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[.85fr_1.15fr] lg:px-8">
        <section className="sign-in-intro">
          <p className="eyebrow">One platform. Clear roles.</p>
          <h1 className="display-title mt-5 max-w-xl">Your next move starts here.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-foreground/65">
            Sign in to continue. Your saved account role and approval state—not a role selector—determine which workspace you can access.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm text-foreground/60">
            <ShieldCheck className="text-[#F4D03F]" aria-hidden="true" /> Verified, role-based access
          </div>
        </section>
        <SignInForm />
      </main>
    </SiteShell>
  )
}
