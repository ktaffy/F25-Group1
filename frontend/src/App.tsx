import { useEffect, useState } from 'react'
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import LandingPage from './pages/LandingPage'
import PlanPage from './pages/PlanPage'
import FavoritesPage from './pages/FavoritesPage'
import CookingPage from './pages/CookingPage'
import SchedulePreviewPage from './pages/SchedulePreviewPage'
import CreateRecipePage from './pages/CreateRecipePage'
import ProfilePage from './pages/ProfilePage'
import MyRecipesPage from './pages/MyRecipesPage'
import { fetchUserFavorites } from './api'
import './App.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('missing Supabase env variables')
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

type Page = 'landing' | 'favorites' | 'plan' | 'cooking' | 'createRecipe' | 'schedulePreview' | 'profile' | 'myRecipes'

interface Recipe {
  id: number | string
  title: string
  image: string
  readyInMinutes: number
  servings?: number
  summary?: string
  averageRating?: number
  reviewCount?: number
}

interface Schedule {
  previewId?: string
  items: Array<{
    recipeId: string
    recipeName: string
    stepIndex: number
    text: string
    attention: 'foreground' | 'background'
    startSec: number
    endSec: number
  }>
  totalDurationSec: number
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [currentPage, setCurrentPage] = useState<Page>('landing')
  const [cart, setCart] = useState<Recipe[]>([])
  const [favorites, setFavorites] = useState<Recipe[]>([])
  const [cookingSchedule, setCookingSchedule] = useState<Schedule | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])
  // Ensure we always have the freshest user metadata (e.g., username updates)
  useEffect(() => {
    (async () => {
      if (!session) return
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        setSession({ ...session, user: data.user })
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id])

  useEffect(() => {
    const userId = session?.user.id

    if (!userId) {
      setFavorites([])
      return
    }

    let cancelled = false

    const loadFavorites = async () => {
      try {
        const favoriteRecipes = await fetchUserFavorites(userId)
        if (!cancelled) {
          const normalizedFavorites: Recipe[] = favoriteRecipes.map((favorite) => ({
            ...favorite,
            id: typeof favorite.id === 'string' ? parseInt(favorite.id, 10) : favorite.id
          })) as Recipe[]
          setFavorites(normalizedFavorites)
        }
      } catch (error) {
        console.error('Error loading user favorites:', error)
      }
    }

    loadFavorites()

    return () => {
      cancelled = true
    }
  }, [session?.user.id])

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        const trimmedUsername = username.trim()
        if (!trimmedUsername) {
          setMessage('Username is required')
          setLoading(false)
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: trimmedUsername }
          }
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error: any) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setCart([])
    setCookingSchedule(null)
    setCurrentPage('landing')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAuth()
    }
  }

  const displayName = session?.user.user_metadata?.username || session?.user.email || ''

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            cart={cart}
            setCart={setCart}
            favorites={favorites}
            setFavorites={setFavorites}
            currentUserId={session?.user.id || ''}
          />
        )
      case 'favorites':
        return (
          <FavoritesPage
            favorites={favorites}
            setFavorites={setFavorites}
            cart={cart}
            setCart={setCart}
            currentUserId={session?.user.id || ''}
            setCurrentPage={setCurrentPage}
          />
        )
      case 'plan':
        return (
          <PlanPage
            cart={cart}
            setCart={setCart}
            setCurrentPage={setCurrentPage}
            setCookingSchedule={setCookingSchedule}
          />
        )
      case 'schedulePreview':
        return (
          <SchedulePreviewPage
            schedule={cookingSchedule}
            setCurrentPage={setCurrentPage}
          />
        )
      case 'cooking':
        return (
          <CookingPage
            schedule={cookingSchedule}
            setCurrentPage={setCurrentPage}
          />
        )
      case 'createRecipe':
        return (
          <CreateRecipePage
            setCurrentPage={setCurrentPage}
            userId={session?.user.id || ''}
          />
        )
      case 'profile':
        return (
          <ProfilePage
            supabase={supabase}
            user={session!.user}
            onUserUpdated={setSession}
            setCurrentPage={setCurrentPage}
          />
        )
      case 'myRecipes':
        return (
          <MyRecipesPage
            userId={session?.user.id || ''}
            setCurrentPage={setCurrentPage}
          />
          )
      default:
        return (
          <LandingPage
            cart={cart}
            setCart={setCart}
            favorites={favorites}
            setFavorites={setFavorites}
            currentUserId={session?.user.id || ''}
          />
        )
    }
  }

  if (session) {
    return (
      <div className="app">
        <nav className="app-nav">
          <div className="nav-left">
            <button
              onClick={() => setCurrentPage('landing')}
              className={currentPage === 'landing' ? 'nav-button active' : 'nav-button'}
            >
              Recipes
            </button>
            <button
              onClick={() => setCurrentPage('favorites')}
              className={currentPage === 'favorites' ? 'nav-button active' : 'nav-button'}
            >
              ❤️ Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setCurrentPage('myRecipes')}
              className={currentPage === 'myRecipes' ? 'nav-button active' : 'nav-button'}
            >
              📝 My Recipes
            </button>
            <button
              onClick={() => setCurrentPage('createRecipe')}
              className={currentPage === 'createRecipe' ? 'nav-button active' : 'nav-button'}
            >
              ➕ Create Recipe
            </button>
            <button
              onClick={() => setCurrentPage('plan')}
              className={currentPage === 'plan' ? 'nav-button active' : 'nav-button'}
            >
              Plan ({cart.length})
            </button>
          </div>
          <div className="nav-right">
            <button
              className="nav-button user-email"
              onClick={() => setCurrentPage('profile')}
            >
              {displayName}
            </button>
            <button onClick={handleSignOut} className="nav-button sign-out">
              Sign Out
            </button>
          </div>
        </nav>

        <main className="app-main">
          {renderPage()}
        </main>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
          </p>
        </div>

        <div>
          <div className="form-group">
            <label className="form-label">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="form-input"
              placeholder="you@example.com"
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label className="form-label">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="form-input"
                placeholder="Pick something unique"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className="message message-error">
              {message}
            </div>
          )}

          <button
            onClick={handleAuth}
            disabled={
              loading ||
              !email ||
              !password ||
              (isSignUp && !username.trim())
            }
            className="auth-button"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Loading...
              </>
            ) : (
              isSignUp ? 'Create Account' : 'Sign In'
            )}
          </button>
        </div>

        <div className="toggle-container">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="toggle-button"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
