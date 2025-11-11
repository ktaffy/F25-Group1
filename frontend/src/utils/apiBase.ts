const DEFAULT_FALLBACK = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : 'http://localhost:3001'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

export function getApiBaseUrl(): string {
    const raw = import.meta.env.VITE_API_BASE_URL?.trim()
    if (!raw) {
        return DEFAULT_FALLBACK
    }

    const cleaned = trimTrailingSlash(raw)
    if (/^https?:\/\//i.test(cleaned)) {
        return cleaned
    }

    if (typeof window === 'undefined') {
        return `http://${cleaned.replace(/^\/+/, '')}`
    }

    if (cleaned.startsWith('//')) {
        return trimTrailingSlash(`${window.location.protocol}${cleaned}`)
    }

    if (cleaned.startsWith(':')) {
        return trimTrailingSlash(`${window.location.protocol}//${window.location.hostname}${cleaned}`)
    }

    if (cleaned.startsWith('/')) {
        return trimTrailingSlash(`${window.location.origin}${cleaned}`)
    }

    return trimTrailingSlash(`${window.location.protocol}//${cleaned}`)
}
