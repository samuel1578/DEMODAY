'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { ArrowRight } from 'lucide-react'
import { signUpAction } from '@/app/actions/auth'
import { initialAuthActionState, publicSignupRoles, type PublicSignupRole } from '@/lib/supabase/auth-validation'

const roleDetails: Record<PublicSignupRole, { label: string; description: string }> = {
    player: { label: 'Player', description: 'Create an athlete account.' },
    guardian: { label: 'Guardian', description: 'Create a guardian account.' },
    scout: { label: 'Scout', description: 'Request scout access; vetting is required.' },
}

export function SignUpForm() {
    const [state, formAction, pending] = useActionState(signUpAction, initialAuthActionState)

    return (
        <section className="sign-in-card rounded-xl border border-foreground/10 bg-card p-6 shadow-2xl sm:p-9">
            <div className="mb-7">
                <p className="eyebrow">Create an account</p>
                <h2 className="mt-3 text-3xl font-black uppercase">Choose your role</h2>
                <p className="mt-2 text-sm leading-6 text-foreground/60">Sign up and go straight to pending review. Dashboard access remains locked until your profile is complete and approved.</p>
            </div>

            <form action={formAction} className="flex flex-col gap-4">
                <fieldset>
                    <legend className="mb-2 text-xs font-bold uppercase tracking-wider">Account type</legend>
                    <div className="grid gap-2 sm:grid-cols-3">
                        {publicSignupRoles.map(role => (
                            <label key={role} className="sign-up-role-option cursor-pointer rounded-lg border border-foreground/10 p-3 has-[:checked]:border-[#F4D03F] has-[:checked]:bg-[#1e5128] has-[:checked]:text-white">
                                <input className="sr-only" type="radio" name="role" value={role} defaultChecked={role === 'player'} required />
                                <span className="block font-bold uppercase tracking-wide">{roleDetails[role].label}</span>
                                <span className="mt-1 block text-xs opacity-70">{roleDetails[role].description}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-bold uppercase tracking-wider" htmlFor="signup-first-name">
                        First name
                        <input id="signup-first-name" name="firstName" type="text" autoComplete="given-name" minLength={1} maxLength={80} required className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-4 py-3 font-normal normal-case tracking-normal outline-none focus:border-[#F4D03F]" />
                    </label>
                    <label className="text-xs font-bold uppercase tracking-wider" htmlFor="signup-last-name">
                        Last name
                        <input id="signup-last-name" name="lastName" type="text" autoComplete="family-name" minLength={1} maxLength={80} required className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-4 py-3 font-normal normal-case tracking-normal outline-none focus:border-[#F4D03F]" />
                    </label>
                </div>
                <label className="text-xs font-bold uppercase tracking-wider" htmlFor="signup-email">
                    Email
                    <input id="signup-email" name="email" type="email" autoComplete="email" maxLength={254} required className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-4 py-3 font-normal normal-case tracking-normal outline-none focus:border-[#F4D03F]" />
                </label>
                <label className="text-xs font-bold uppercase tracking-wider" htmlFor="signup-password">
                    Password
                    <input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-4 py-3 font-normal normal-case tracking-normal outline-none focus:border-[#F4D03F]" />
                    <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-foreground/50">Use at least 8 characters. Your password is handled by Supabase Auth and is never saved to profile data.</span>
                </label>
                {state.status === 'error' && <p role="alert" className="rounded-md bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{state.message}</p>}
                <button disabled={pending} type="submit" className="mt-2 flex items-center justify-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3.5 font-bold text-[#172219] disabled:cursor-wait disabled:opacity-60">
                    {pending ? 'Creating account…' : 'Create account'} <ArrowRight aria-hidden="true" />
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-foreground/60">
                Already registered? <Link href="/sign-in" className="font-black text-[#1e5128] underline decoration-2 underline-offset-2">Sign in</Link>
            </p>
        </section>
    )
}
