import { SignUpForm } from '@/components/auth/sign-up-form'
import { SiteShell } from '@/components/site-shell'

export default function SignUpPage() {
  return (
    <SiteShell current="/sign-up">
      <main className="mx-auto grid min-h-[calc(100vh-180px)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[.85fr_1.15fr] lg:px-8">
        <section>
          <p className="eyebrow">Join the network</p>
          <h1 className="display-title mt-5 max-w-xl">Build your place in the game.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-foreground/65">
            Start with a secure account. Complete your role-specific profile after sign-up; account review and scout vetting are checked separately before dashboard access.
          </p>
          <p className="mt-8 max-w-lg text-sm leading-6 text-foreground/50">
            With email confirmation disabled in Supabase, sign-up starts an authenticated session and sends you to account status. Athlete, guardian, and scout profile details are submitted separately from your login credentials.
          </p>
        </section>
        <SignUpForm />
      </main>
    </SiteShell>
  )
}
