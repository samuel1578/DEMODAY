'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { SiteShell } from '@/components/site-shell'

const roles = [
  { id: 'player', label: 'Player', detail: 'Build your profile and track your pathway.' },
  { id: 'scout', label: 'Scout', detail: 'Find verified talent with better signals.' },
  { id: 'guardian', label: 'Guardian', detail: 'Stay informed and support every milestone.' },
  { id: 'admin', label: 'Demo Day CEO', detail: 'Manage events, people, and the network.' },
]

export default function SignIn() {
  const [role, setRole] = useState('player')
  const [submitted, setSubmitted] = useState(false)
  const destination = role === 'admin' ? '/admin' : `/${role}`
  return <SiteShell current="/sign-in"><main className="sign-in-page mx-auto grid min-h-[calc(100vh-180px)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[.85fr_1.15fr] lg:px-8"><section className="sign-in-intro"><p className="eyebrow">One platform. Clear roles.</p><h1 className="display-title mt-5 max-w-xl">Your next move starts here.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-foreground/65">Choose your pathway to enter a focused dashboard built for your part in the Demo Day ecosystem.</p><div className="mt-10 flex items-center gap-3 text-sm text-foreground/60"><ShieldCheck className="text-[#F4D03F]" /> Verified, role-based access</div></section><section className="sign-in-card rounded-xl border border-foreground/10 bg-card p-6 shadow-2xl sm:p-9"><div className="mb-7"><p className="eyebrow">Demo access</p><h2 className="mt-3 text-3xl font-black uppercase">Sign in or join</h2><p className="mt-2 text-sm text-foreground/60">This demo routes each role to its own experience.</p></div><div className="grid gap-2 sm:grid-cols-2">{roles.map(item => <button key={item.id} data-role={item.id} aria-pressed={role === item.id} type="button" onClick={() => setRole(item.id)} className={`sign-in-role-choice rounded-lg border p-4 text-left transition ${role === item.id ? 'border-[#F4D03F] bg-[#1e5128] text-white' : 'border-foreground/10 hover:border-[#F4D03F]/60'}`}><span className="block font-bold uppercase tracking-wide">{item.label}</span><span className="mt-1 block text-xs opacity-65">{item.detail}</span></button>)}</div><form className="mt-7 flex flex-col gap-4" onSubmit={event => { event.preventDefault(); setSubmitted(true) }}><label className="text-xs font-bold uppercase tracking-wider">Email<input required type="email" placeholder="you@example.com" className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-4 py-3 outline-none focus:border-[#F4D03F]" /></label><label className="text-xs font-bold uppercase tracking-wider">Password<input required type="password" placeholder="••••••••" className="mt-2 w-full rounded-md border border-foreground/15 bg-background px-4 py-3 outline-none focus:border-[#F4D03F]" /></label><button className="mt-2 flex items-center justify-center gap-2 rounded-md bg-[#F4D03F] px-5 py-3.5 font-bold text-[#172219]" type="submit">{submitted ? 'Demo access ready' : `Continue as ${roles.find(item => item.id === role)?.label}`} <ArrowRight /></button></form>{submitted && <Link href={destination} className="mt-4 flex justify-center text-sm font-bold text-[#1e5128] underline">Open your {roles.find(item => item.id === role)?.label} dashboard</Link>}<p className="mt-6 text-center text-sm text-foreground/60">New here? <Link href="/sign-up" className="font-black text-[#1e5128] underline decoration-2 underline-offset-2">Create your role profile</Link></p></section></main></SiteShell>
}
