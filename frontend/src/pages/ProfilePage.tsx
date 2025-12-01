import { useEffect, useState } from 'react'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import './ProfilePage.css'

type Page = 'landing' | 'favorites' | 'plan' | 'cooking' | 'createRecipe' | 'schedulePreview' | 'profile'

interface ProfilePageProps {
    supabase: SupabaseClient
    user: User
    onUserUpdated: (session: any) => void
    setCurrentPage: (page: Page) => void
}

function generateDefaultUsername(userId: string) {
    const letters = ['m', 'n', 'k', 'p', 'r']
    const sum = Array.from(userId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    const letter = letters[sum % letters.length]
    const number = (sum % 900) + 1
    return `${letter}${number}`
}

function ProfilePage({ supabase, user, onUserUpdated, setCurrentPage }: ProfilePageProps) {
    const [username, setUsername] = useState('')
    const [status, setStatus] = useState<{ type: 'idle' | 'saving' | 'success' | 'error'; message?: string }>({
        type: 'idle',
    })

    useEffect(() => {
        const ensureUsername = async () => {
            const existing = (user.user_metadata as any)?.username as string | undefined
            if (existing) {
                setUsername(existing)
                return
            }

            const fallback = generateDefaultUsername(user.id)
            setUsername(fallback)
            try {
                await supabase.auth.updateUser({ data: { username: fallback } })
            } catch (err) {
                console.error('Failed to set default username', err)
            }
        }

        ensureUsername()
    }, [supabase.auth, user])

    const handleSave = async () => {
        const nextName = username.trim() || generateDefaultUsername(user.id)
        setUsername(nextName)
        setStatus({ type: 'saving' })
        try {
            const { error } = await supabase.auth.updateUser({ data: { username: nextName } })
            if (error) {
                throw error
            }
            const { data } = await supabase.auth.getSession()
            if (data.session) {
                onUserUpdated(data.session)
            }
            setStatus({ type: 'success', message: 'Username updated' })
        } catch (err: any) {
            setStatus({ type: 'error', message: err.message || 'Could not update username' })
        }
    }

    return (
        <div className="profile-page">
            <div className="profile-card">
                <header className="profile-header">
                    <div>
                        <p className="eyebrow">Profile</p>
                        <h1>Your Account</h1>
                        <p className="subhead">Manage the basics tied to your account.</p>
                    </div>
                    <button className="secondary-btn" onClick={() => setCurrentPage('landing')}>
                        ← Back to Recipes
                    </button>
                </header>

                <div className="profile-form">
                    <div className="form-row">
                        <label>Email</label>
                        <input type="text" value={user.email ?? ''} disabled />
                    </div>

                    <div className="form-row">
                        <label>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Choose a username"
                        />
                        <p className="help-text">Used for reviews and any social features.</p>
                    </div>
                </div>

                <div className="profile-actions">
                    <button
                        className="primary-btn"
                        onClick={handleSave}
                        disabled={status.type === 'saving'}
                    >
                        {status.type === 'saving' ? 'Saving...' : 'Save Changes'}
                    </button>
                    {status.type === 'success' && <span className="status success">{status.message}</span>}
                    {status.type === 'error' && <span className="status error">{status.message}</span>}
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
