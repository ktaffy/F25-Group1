import { useState } from 'react'
import { generateSchedule } from '../api'
import './PlanPage.css'

type Page = 'landing' | 'plan' | 'cooking'

interface Recipe {
    id: number
    title: string
    image: string
    readyInMinutes: number
}

interface Schedule {
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

interface PlanPageProps {
    cart: Recipe[]
    setCart: (cart: Recipe[]) => void
    setCurrentPage: (page: Page) => void
    setCookingSchedule: (schedule: Schedule) => void
}

function PlanPage({ cart, setCart, setCurrentPage, setCookingSchedule }: PlanPageProps) {
    const [loading, setLoading] = useState(false)

    const removeFromCart = (recipeId: number) => {
        setCart(cart.filter(item => item.id !== recipeId))
    }

    const beginCooking = async () => {
        if (cart.length === 0) return

        setLoading(true)
        try {
            const recipeIds = cart.map(recipe => recipe.id)
            const schedule = await generateSchedule(recipeIds as any)
            setCookingSchedule(schedule)
            setCurrentPage('cooking')
        } catch (error) {
            console.error('Error generating schedule:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="cart-page">
            <div className="cart-header">
                <h1 className="cart-title">Your Cooking Plan</h1>
                <p className="cart-subtitle">Review your plan before heading to the kitchen</p>
            </div>

            {cart.length === 0 ? (
                <div className="empty-cart">
                    <div className="empty-cart-icon">🛒</div>
                    <h2>Your plan is empty</h2>
                    <p>Add some delicious recipes to build your plan!</p>
                    <button onClick={() => setCurrentPage('landing')} className="browse-button">
                        Browse Recipes
                    </button>
                </div>
            ) : (
                <div className="cart-content">
                    <div className="cart-items">
                        {cart.map(recipe => (
                            <div key={recipe.id} className="cart-item">
                                <div className="cart-item-image">
                                    <img src={recipe.image} alt={recipe.title} />
                                </div>
                                <div className="cart-item-details">
                                    <h3 className="cart-item-title">{recipe.title}</h3>
                                    <p className="cart-item-time">⏱️ Ready in: {recipe.readyInMinutes} minutes</p>
                                </div>
                                <button
                                    onClick={() => removeFromCart(recipe.id)}
                                    className="remove-button"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="cart-actions">
                        <div className="cart-summary">
                            <h2>Ready to Cook?</h2>
                            <p className="total-info">
                                {cart.length} recipe{cart.length !== 1 ? 's' : ''} in your plan
                            </p>
                        </div>

                        <button
                            onClick={beginCooking}
                            disabled={loading}
                            className="begin-cooking-btn"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner"></div>
                                    Generating Schedule...
                                </>
                            ) : (
                                'Begin Cooking'
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PlanPage
