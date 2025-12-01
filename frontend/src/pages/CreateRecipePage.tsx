import { useState } from 'react'
import { createRecipe } from '../api'
import { createClient } from '@supabase/supabase-js'
import './CreateRecipePage.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

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
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [servings, setServings] = useState<number>(4)
    const [readyInMinutes, setReadyInMinutes] = useState<number>(30)
    const [summary, setSummary] = useState('')
    const [instructions, setInstructions] = useState('')
    const [dishTypes, setDishTypes] = useState<string[]>([])
    const [ingredients, setIngredients] = useState<Ingredient[]>([
        { name: '', amount: 0, unit: '', original: '' }
    ])
    const [loading, setLoading] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select an image file')
                return
            }

            if (file.size > 5 * 1024 * 1024) {
                setError('Image size must be less than 5MB')
                return
            }

            setImageFile(file)

            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            setError(null)
        }
    }

    const uploadImage = async (): Promise<string> => {
        if (!imageFile) {
            return 'https://via.placeholder.com/312x231'
        }

        setUploadingImage(true)
        try {
            const fileExt = imageFile.name.split('.').pop()
            const fileName = `${userId}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('recipe-images')
                .upload(filePath, imageFile)

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('recipe-images')
                .getPublicUrl(filePath)

            return data.publicUrl
        } catch (err) {
            console.error('Error uploading image:', err)
            throw new Error('Failed to upload image')
        } finally {
            setUploadingImage(false)
        }
    }

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

    const formatSummary = (text: string): string => {
        if (!text.trim()) return ''

        let formatted = text.trim()

        if (servings) {
            formatted = `This recipe serves <b>${servings}</b>. ` + formatted
        }

        if (readyInMinutes) {
            const hours = Math.floor(readyInMinutes / 60)
            const mins = readyInMinutes % 60
            const timeStr = hours > 0
                ? `${hours} hour${hours > 1 ? 's' : ''}${mins > 0 ? ` and ${mins} minutes` : ''}`
                : `${mins} minutes`
            formatted = formatted + ` From preparation to the plate, this recipe takes approximately <b>${timeStr}</b>.`
        }

        return formatted
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
            const imageUrl = await uploadImage()

            const instructionSteps = instructions
                .split('\n')
                .map(step => step.trim())
                .filter(step => step.length > 0)

            const formattedInstructions = instructionSteps.length > 0
                ? `<ol>${instructionSteps.map(step => `<li>${step}</li>`).join('')}</ol>`
                : instructions.trim()

            const recipeData = {
                userId,
                title: title.trim(),
                image: imageUrl,
                servings,
                ready_in_minutes: readyInMinutes,
                summary: formatSummary(summary),
                ingredients: ingredients.filter(ing => ing.name.trim()),
                instructions: formattedInstructions,
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

                    {/* NEW IMAGE UPLOAD SECTION */}
                    <div className="form-group">
                        <label htmlFor="image">Recipe Image</label>
                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                        />
                        <label
                            htmlFor="image"
                            className="image-upload-label"
                            style={{
                                display: 'block',
                                padding: '3rem 2rem',
                                border: '2px dashed #d1d5db',
                                borderRadius: '12px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                backgroundColor: '#fafafa',
                                transition: 'all 0.2s'
                            }}
                        >
                            {imagePreview ? (
                                <div>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{
                                            maxWidth: '300px',
                                            maxHeight: '200px',
                                            borderRadius: '8px',
                                            marginBottom: '1rem'
                                        }}
                                    />
                                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                        Click to change image
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</div>
                                    <p style={{ color: '#6b7280', fontSize: '1rem', margin: 0 }}>
                                        Click to upload an image
                                    </p>
                                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                        PNG, JPG up to 5MB
                                    </p>
                                </div>
                            )}
                        </label>
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
                        {uploadingImage ? (
                            <>
                                <span className="spinner"></span>
                                Uploading Image...
                            </>
                        ) : loading ? (
                            <>
                                <span className="spinner"></span>
                                Creating Recipe...
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
