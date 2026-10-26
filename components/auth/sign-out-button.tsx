'use client'

import { signOutAction } from '@/app/actions/auth'

export function SignOutButton() {
    return (
        <form action={signOutAction}>
            <button type="submit" className="mobile-menu-action rounded-md border border-foreground/20 px-4 py-2.5 text-sm font-extrabold transition hover:border-[#F4D03F] hover:text-[#F4D03F]">
                Sign out
            </button>
        </form>
    )
}
