'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAccountDestination } from '@/lib/supabase/auth'
import { validateSignInForm, validateSignupForm, type AuthActionState } from '@/lib/supabase/auth-validation'

export async function signUpAction(
    _previousState: AuthActionState,
    formData: FormData,
): Promise<AuthActionState> {
    const validation = validateSignupForm(formData)
    if ('error' in validation) return { status: 'error', message: validation.error }

    let hasSession = false
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.signUp({
            email: validation.value.email,
            password: validation.value.password,
            options: {
                data: {
                    role: validation.value.role,
                    first_name: validation.value.firstName,
                    last_name: validation.value.lastName,
                },
            },
        })

        if (error || !data.user) {
            return { status: 'error', message: 'We could not create your account. Check your details and try again.' }
        }
        hasSession = Boolean(data.session)
    } catch {
        return { status: 'error', message: 'Registration is temporarily unavailable. Please try again later.' }
    }

    if (!hasSession) {
        return {
            status: 'error',
            message: 'Direct signup is not enabled. Disable “Confirm email” under Supabase Authentication → Providers → Email, then try again.',
        }
    }

    // With Confirm email disabled, Supabase returns a session and treats the new
    // email as confirmed. The database profile remains pending, so this account
    // still cannot access a role dashboard.
    redirect('/account/pending')
}

export async function signInAction(
    _previousState: AuthActionState,
    formData: FormData,
): Promise<AuthActionState> {
    const validation = validateSignInForm(formData)
    if ('error' in validation) return { status: 'error', message: validation.error }

    try {
        const supabase = await createClient()
        const { data, error } = await supabase.auth.signInWithPassword(validation.value)

        if (error || !data.user) {
            return { status: 'error', message: 'Email or password was not recognized.' }
        }

        if (!data.user.email_confirmed_at) {
            await supabase.auth.signOut()
            return {
                status: 'error',
                message: 'This account is not active. Contact support for help.',
            }
        }

        const destination = await getAccountDestination(data.user, supabase)
        redirect(destination)
    } catch (error) {
        if (error && typeof error === 'object' && 'digest' in error) throw error
        return { status: 'error', message: 'Sign-in is temporarily unavailable. Please try again.' }
    }
}

export async function signOutAction(_formData: FormData): Promise<void> {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/sign-in')
}
