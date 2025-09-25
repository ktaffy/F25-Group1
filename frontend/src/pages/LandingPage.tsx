import { useEffect, useState } from 'react'
import { fetchRandomRecipes, fetchRecipeDetails } from '../api'
import './LandingPage.css'

interface Recipe {
    id: number
    title: string
    image: string
    readyInMinutes: number
    servings?: number
    summary?: string
}

interface LandingPageProps {
    cart: Recipe[]
    setCart: (cart: Recipe[]) => void
}

function LandingPage({ cart, setCart }: LandingPageProps) {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadRandomRecipes()
    }, [])

    const loadRandomRecipes = async () => {
        setLoading(true)
        try {
            const data = await fetchRandomRecipes(10)
            setRecipes(data)
        } catch (error) {
            console.error('Error loading recipes:', error)
        } finally {
            setLoading(false)
        }
    }

    const previewRecipe = async (recipe: Recipe) => {
        try {
            const fullRecipe = await fetchRecipeDetails(recipe.id)
            setSelectedRecipe(fullRecipe)
        } catch (error) {
            console.error('Error fetching recipe details:', error)
        }
    }

    const addToCart = (recipe: Recipe) => {
        if (!cart.find(item => item.id === recipe.id)) {
            setCart([...cart, recipe])
        }
    }

    return (
        <div className="landing-page">
            <div className="landing-header">
                <h1 className="landing-title">Discover Recipes</h1>
                <p className="landing-subtitle">Find amazing recipes to add to your cooking schedule</p>
            </div>

            {selectedRecipe && (
                <div className="recipe-preview-overlay">
                    <div className="recipe-preview">
                        <div className="preview-header">
                            <h2 className="preview-title">{selectedRecipe.title}</h2>
                            <button
                                onClick={() => setSelectedRecipe(null)}
                                className="close-button"
                            >
                                ×
                            </button>
                        </div>

                        <div className="preview-content">
                            <img src={selectedRecipe.image} alt={selectedRecipe.title} className="preview-image" />

                            <div className="preview-details">
                                <div className="recipe-meta">
                                    <span className="meta-item">⏱️ {selectedRecipe.readyInMinutes} minutes</span>
                                    {selectedRecipe.servings && (
                                        <span className="meta-item">👥 {selectedRecipe.servings} servings</span>
                                    )}
                                </div>

                                {selectedRecipe.summary && (
                                    <div
                                        className="recipe-summary"
                                        dangerouslySetInnerHTML={{ __html: selectedRecipe.summary }}
                                    />
                                )}

                                <button
                                    onClick={() => addToCart(selectedRecipe)}
                                    className="add-to-cart-button"
                                    disabled={cart.some(item => item.id === selectedRecipe.id)}
                                >
                                    {cart.some(item => item.id === selectedRecipe.id) ? 'Added to Cart' : 'Add to Cart'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="recipe-grid">
                {recipes.map(recipe => (
                    <div key={recipe.id} className="recipe-card">
                        <div className="card-image-container">
                            <img src={recipe.image} alt={recipe.title} className="card-image" />
                            <div className="card-overlay">
                                <button
                                    onClick={() => previewRecipe(recipe)}
                                    className="preview-button"
                                >
                                    Preview
                                </button>
                            </div>
                        </div>

                        <div className="card-content">
                            <h3 className="card-title">{recipe.title}</h3>
                            <p className="card-time">⏱️ {recipe.readyInMinutes} minutes</p>

                            <button
                                onClick={() => addToCart(recipe)}
                                className="card-add-button"
                                disabled={cart.some(item => item.id === recipe.id)}
                            >
                                {cart.some(item => item.id === recipe.id) ? 'Added' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="load-more-container">
                <button
                    onClick={loadRandomRecipes}
                    disabled={loading}
                    className="load-more-button"
                >
                    {loading ? (
                        <>
                            <div className="spinner"></div>
                            Loading...
                        </>
                    ) : (
                        'Load More Recipes'
                    )}
                </button>
            </div>
        </div>
    )
}

export default LandingPage