'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SignOutButton } from '@/components/auth/sign-out-button'

export function AuthNavControls({ dark }: { dark: boolean }) {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        fetch('/api/auth/session', { cache: 'no-store', signal: controller.signal })
            .then(response => setAuthenticated(response.ok))
            .catch(() => setAuthenticated(false))
        return () => controller.abort()
    }, [])

    if (authenticated === null) return <span className="mobile-menu-action h-10 w-20" aria-hidden="true" />
    if (authenticated) return <SignOutButton />

    return (
        <>
            <Link href="/sign-in" className={`mobile-menu-action rounded-md border px-4 py-2.5 text-sm font-extrabold transition ${dark ? 'border-white/25 text-white hover:border-[#F4D03F] hover:text-[#F4D03F]' : 'border-[#172219]/20 text-[#172219] hover:border-[#1e5128] hover:text-[#1e5128]'}`}>Sign in</Link>
            <Link href="/sign-up" className="mobile-menu-action rounded-md bg-[#F4D03F] px-4 py-2.5 text-sm font-extrabold text-[#172219]">Sign up</Link>
        </>
    )
}
