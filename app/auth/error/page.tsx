import Link from 'next/link'
import { SiteShell } from '@/components/site-shell'

export default function AuthErrorPage() {
    return (
        <SiteShell current="/auth/error">
            <main className="mx-auto max-w-3xl px-5 py-20 lg:px-8">
                <section className="rounded-xl border border-foreground/10 bg-card p-8 sm:p-12">
                    <p className="eyebrow">Verification link</p>
                    <h1 className="display-title mt-4">This link could not be verified.</h1>
                    <p className="mt-5 text-base leading-7 text-foreground/65">
                        It may have expired or already been used. Sign in if your email is confirmed, or return to account creation to request a new message.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/sign-in" className="rounded-md bg-[#F4D03F] px-5 py-3 text-sm font-bold text-[#172219]">Sign in</Link>
                        <Link href="/sign-up" className="rounded-md border border-foreground/15 px-5 py-3 text-sm font-bold">Create an account</Link>
                    </div>
                </section>
            </main>
        </SiteShell>
    )
}
