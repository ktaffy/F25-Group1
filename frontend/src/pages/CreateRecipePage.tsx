import { useState } from 'react'
import { createRecipe } from '../api'
import './CreateRecipePage.css'

type Page = 'landing' | 'favorites' | 'plan' | 'cooking' | 'createRecipe'

interface Ingredient {
    name: string
    amount: number
    unit: string
    original: string
}

interface CreateRecipePageProps {
    setCurrentPage: (page: Page) => void
    userId: string
}

function CreateRecipePage({ setCurrentPage, userId }: CreateRecipePageProps) {
    const [title, setTitle] = useState('')
    const [image, setImage] = useState('')
    const [servings, setServings] = useState<number>(4)
    const [readyInMinutes, setReadyInMinutes] = useState<number>(30)
    const [summary, setSummary] = useState('')
    const [instructions, setInstructions] = useState('')
    const [dishTypes, setDishTypes] = useState<string[]>([])
    const [ingredients, setIngredients] = useState<Ingredient[]>([
        { name: '', amount: 0, unit: '', original: '' }
    ])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const addIngredient = () => {
        setIngredients([...ingredients, { name: '', amount: 0, unit: '', original: '' }])
    }

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index))
    }

    const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
        const updated = [...ingredients]
        updated[index] = { ...updated[index], [field]: value }
        setIngredients(updated)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!title.trim()) {
            setError('Title is required')
            return
        }
        if (ingredients.length === 0 || !ingredients[0].name) {
            setError('At least one ingredient is required')
            return
        }
        if (!instructions.trim()) {
            setError('Instructions are required')
            return
        }

        setLoading(true)
        try {
            const recipeData = {
                userId,
                title: title.trim(),
                image: image.trim() || 'https://via.placeholder.com/312x231',
                servings,
                ready_in_minutes: readyInMinutes,
                summary: summary.trim(),
                ingredients: ingredients.filter(ing => ing.name.trim()),
                instructions: instructions.trim(),
                dish_types: dishTypes
            }

            await createRecipe(recipeData)

            alert('Recipe created successfully!')
            setCurrentPage('favorites')
        } catch (err) {
            console.error('Error creating recipe:', err)
            setError('Failed to create recipe. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const toggleDishType = (type: string) => {
        if (dishTypes.includes(type)) {
            setDishTypes(dishTypes.filter(t => t !== type))
        } else {
            setDishTypes([...dishTypes, type])
        }
    }

    const dishTypeOptions = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'appetizer', 'side dish', 'main course']

    return (
        <div className="create-recipe-page" style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
            <div className="create-recipe-header">
                <h1 className="create-recipe-title">Create Your Recipe</h1>
                <p className="create-recipe-subtitle">Share your culinary masterpiece</p>
            </div>

            <form onSubmit={handleSubmit} className="recipe-form">
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Basic Info Section */}
                <div className="form-section">
                    <h2 className="section-title">Basic Information</h2>

                    <div className="form-group">
                        <label htmlFor="title">Recipe Title *</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Grandma's Chocolate Chip Cookies"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="image">Image URL</label>
                        <input
                            id="image"
                            type="url"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="servings">Servings *</label>
                            <input
                                id="servings"
                                type="number"
                                min="1"
                                value={servings}
                                onChange={(e) => setServings(Number(e.target.value))}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="readyInMinutes">Ready in (minutes) *</label>
                            <input
                                id="readyInMinutes"
                                type="number"
                                min="1"
                                value={readyInMinutes}
                                onChange={(e) => setReadyInMinutes(Number(e.target.value))}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="summary">Summary</label>
                        <textarea
                            id="summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Brief description of your recipe..."
                            rows={3}
                        />
                    </div>
                </div>

                {/* Ingredients Section */}
                <div className="form-section">
                    <h2 className="section-title">Ingredients *</h2>

                    {ingredients.map((ingredient, index) => (
                        <div key={index} className="ingredient-row">
                            <input
                                type="text"
                                placeholder="Ingredient name"
                                value={ingredient.name}
                                onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                                className="ingredient-name"
                            />
                            <input
                                type="number"
                                placeholder="Amount"
                                value={ingredient.amount || ''}
                                onChange={(e) => updateIngredient(index, 'amount', Number(e.target.value))}
                                className="ingredient-amount"
                            />
                            <input
                                type="text"
                                placeholder="Unit"
                                value={ingredient.unit}
                                onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                className="ingredient-unit"
                            />
                            {ingredients.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeIngredient(index)}
                                    className="remove-ingredient-btn"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addIngredient}
                        className="add-ingredient-btn"
                    >
                        + Add Ingredient
                    </button>
                </div>

                {/* Instructions Section */}
                <div className="form-section">
                    <h2 className="section-title">Instructions *</h2>
                    <div className="form-group">
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Enter instructions, one step per line..."
                            rows={8}
                            required
                        />
                    </div>
                </div>

                {/* Dish Types Section */}
                <div className="form-section">
                    <h2 className="section-title">Dish Types</h2>
                    <div className="dish-types-grid">
                        {dishTypeOptions.map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => toggleDishType(type)}
                                className={`dish-type-btn ${dishTypes.includes(type) ? 'active' : ''}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Form Actions */}
                <div className="form-actions" style={{ position: 'relative', zIndex: 10 }}>
                    <button
                        type="button"
                        onClick={() => setCurrentPage('favorites')}
                        className="cancel-btn"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="spinner"></div>
                                Creating...
                            </>
                        ) : (
                            'Create Recipe'
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default CreateRecipePage
