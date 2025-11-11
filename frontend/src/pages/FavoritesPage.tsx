import type { Dispatch, SetStateAction } from 'react'
import './FavoritesPage.css'
import { removeFavorite as removeFavoriteApi } from '../api'

type Page = 'landing' | 'favorites' | 'plan' | 'cooking'

interface Recipe {
    id: number
    title: string
    image: string
    readyInMinutes: number
}

interface FavoritesPageProps {
    favorites: Recipe[]
    setFavorites: Dispatch<SetStateAction<Recipe[]>>
    cart: Recipe[]
    setCart: (cart: Recipe[]) => void
    setCurrentPage: (page: Page) => void
    currentUserId: string
}

function FavoritesPage({ favorites, setFavorites, cart, setCart, setCurrentPage, currentUserId }: FavoritesPageProps) {
    const removeFromFavorites = async (recipeId: number) => {
        if (!currentUserId) return
        const previousFavorites = [...favorites]
        setFavorites(prev => prev.filter(item => item.id !== recipeId))
        try {
            await removeFavoriteApi(currentUserId, recipeId)
        } catch (error) {
            console.error('Error removing favorite:', error)
            setFavorites(previousFavorites)
        }
    }

    const addToCart = (recipe: Recipe) => {
        if (!cart.find(item => item.id === recipe.id)) {
            setCart([...cart, recipe])
        }
    }

    return (
        <div className="favorites-page">
            <div className="favorites-header">
                <h1 className="favorites-title">Your Favorites</h1>
                <p className="favorites-subtitle">Your collection of favorite recipes</p>
            </div>

            {favorites.length === 0 ? (
                <div className="empty-favorites">
                    <div className="empty-favorites-icon">❤️</div>
                    <h2>No favorites yet</h2>
                    <p>Start adding recipes to your favorites!</p>
                    <button onClick={() => setCurrentPage('landing')} className="browse-button">
                        Browse Recipes
                    </button>
                </div>
            ) : (
                <div className="favorites-content">
                    <div className="favorites-items">
                        {favorites.map(recipe => (
                            <div key={recipe.id} className="favorites-item">
                                <div className="favorites-item-image">
                                    <img src={recipe.image} alt={recipe.title} />
                                </div>
                                <div className="favorites-item-details">
                                    <h3 className="favorites-item-title">{recipe.title}</h3>
                                    <p className="favorites-item-time">⏱️ Ready in: {recipe.readyInMinutes} minutes</p>
                                </div>
                                <div className="favorites-item-actions">
                                    <button
                                        onClick={() => addToCart(recipe)}
                                        disabled={cart.some(item => item.id === recipe.id)}
                                        className="add-to-cart-button"
                                    >
                                        {cart.some(item => item.id === recipe.id) ? '✓ In Plan' : 'Add to Plan'}
                                    </button>
                                    <button
                                        onClick={() => removeFromFavorites(recipe.id)}
                                        className="remove-favorite-button"
                                    >
                                        💔 Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default FavoritesPage
