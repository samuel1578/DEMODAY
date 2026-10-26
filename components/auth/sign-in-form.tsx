'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { ArrowRight } from 'lucide-react'
import { signInAction } from '@/app/actions/auth'
import { initialAuthActionState } from '@/lib/supabase/auth-validation'

export function SignInForm() {
    const [state, formAction, pending] = useActionState(signInAction, initialAuthActionState)

    return (
        <div className="sign-in-card rounded-xl border border-foreground/10 bg-card p-6 shadow-2xl sm:p-9">
            <div className="mb-7">
                <p className="eyebrow">Secure access</p>
                <h2 className="mt-3 text-3xl font-black uppercase">Sign in</h2>
                <p className="mt-2 text-sm text-foreground/60">Use the email and password for your Demo Day account.</p>
            </div>

            <form action={formAction} className="flex flex-col gap-4">
                <label className="text-xs font-bold uppercase tracking-wider" htmlFor="sign-in-email">
                    Email
                    <input id="sign-in-email" name="email" type="email" autoComplete="email" maxLength={254} required className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-4 py-3 font-normal normal-case tracking-normal outline-none focus:border-[#F4D03F]" />
                </label>
                <label className="text-xs font-bold uppercase tracking-wider" htmlFor="sign-in-password">
                    Password
                    <input id="sign-in-password" name="password" type="password" autoComplete="current-password" maxLength={128} required className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-4 py-3 font-normal normal-case tracking-normal outline-none focus:border-[#F4D03F]" />
                </label>
                {state.status === 'error' && <p role="alert" className="rounded-md bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{state.message}</p>}
                <button disabled={pending} className="mt-2 flex items-center justify-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3.5 font-bold text-[#172219] disabled:cursor-wait disabled:opacity-60" type="submit">
                    {pending ? 'Signing in…' : 'Sign in'} <ArrowRight aria-hidden="true" />
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-foreground/60">
                New here? <Link href="/sign-up" className="font-black text-[#1e5128] underline decoration-2 underline-offset-2">Create your account</Link>
            </p>
        </div>
    )
}
