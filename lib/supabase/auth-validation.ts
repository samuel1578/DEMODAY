export const publicSignupRoles = ['player', 'guardian', 'scout'] as const

export type PublicSignupRole = (typeof publicSignupRoles)[number]

export type AuthActionState = {
    status: 'idle' | 'error'
    message: string
}

export const initialAuthActionState: AuthActionState = {
    status: 'idle',
    message: '',
}

export type SignupInput = {
    role: PublicSignupRole
    firstName: string
    lastName: string
    email: string
    password: string
}

type ValidationResult<T> = { value: T } | { error: string }

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const namePattern = /^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}'.’\-]*$/u

function readString(formData: FormData, key: string): string | null {
    const value = formData.get(key)
    return typeof value === 'string' ? value : null
}

export function normalizeAndValidateEmail(value: string | null): ValidationResult<string> {
    const email = value?.trim().toLowerCase() ?? ''
    if (email.length > 254 || !emailPattern.test(email)) {
        return { error: 'Enter a valid email address.' }
    }
    return { value: email }
}

export function validateSignupForm(formData: FormData): ValidationResult<SignupInput> {
    const role = readString(formData, 'role')
    const firstName = readString(formData, 'firstName')?.trim() ?? ''
    const lastName = readString(formData, 'lastName')?.trim() ?? ''
    const emailResult = normalizeAndValidateEmail(readString(formData, 'email'))
    const password = readString(formData, 'password') ?? ''

    if (!role || !publicSignupRoles.includes(role as PublicSignupRole)) {
        return { error: 'Choose a valid account type.' }
    }
    if (firstName.length < 1 || firstName.length > 80 || !namePattern.test(firstName)) {
        return { error: 'Enter a valid first name (up to 80 characters).' }
    }
    if (lastName.length < 1 || lastName.length > 80 || !namePattern.test(lastName)) {
        return { error: 'Enter a valid last name (up to 80 characters).' }
    }
    if ('error' in emailResult) return emailResult
    if (password.length < 8 || password.length > 128) {
        return { error: 'Use a password between 8 and 128 characters.' }
    }

    return {
        value: {
            role: role as PublicSignupRole,
            firstName,
            lastName,
            email: emailResult.value,
            password,
        },
    }
}

export function validateSignInForm(formData: FormData): ValidationResult<{ email: string; password: string }> {
    const emailResult = normalizeAndValidateEmail(readString(formData, 'email'))
    const password = readString(formData, 'password') ?? ''
    if ('error' in emailResult) return emailResult
    if (!password || password.length > 128) return { error: 'Enter your password.' }
    return { value: { email: emailResult.value, password } }
}
