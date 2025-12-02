import { useState, useEffect } from 'react'
import { fetchUserRecipes, deleteRecipe, updateRecipe } from '../api'
import { createClient } from '@supabase/supabase-js'
import './MyRecipesPage.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

type Page = 'landing' | 'favorites' | 'plan' | 'cooking' | 'createRecipe' | 'myRecipes'

interface Recipe {
    id: number | string
    title: string
    image: string
    readyInMinutes: number
    servings?: number
    summary?: string
    instructions?: string | Array<{ step: string } | string>
    ingredients?: any[]
    dish_types?: string[]
    averageRating?: number
    reviewCount?: number
}

interface Ingredient {
    name: string
    amount: number
    unit: string
    original: string
}

interface MyRecipesPageProps {
    userId: string
    setCurrentPage: (page: Page) => void
}

function MyRecipesPage({ userId, setCurrentPage }: MyRecipesPageProps) {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
    const [error, setError] = useState<string | null>(null)

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
    const [uploadingImage, setUploadingImage] = useState(false)
    const [savingChanges, setSavingChanges] = useState(false)

    useEffect(() => {
        loadRecipes()
    }, [userId])

    const loadRecipes = async () => {
        setLoading(true)
        try {
            const data = await fetchUserRecipes(userId)
            setRecipes(data)
        } catch (error) {
            console.error('Error loading recipes:', error)
            setError('Failed to load recipes')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (recipeId: string) => {
        if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
            return
        }

        try {
            await deleteRecipe(userId, recipeId)
            setRecipes(recipes.filter(r => r.id !== recipeId))
        } catch (error) {
            console.error('Error deleting recipe:', error)
            alert('Failed to delete recipe')
        }
    }

    const startEditing = (recipe: Recipe) => {
        setEditingRecipe(recipe)
        setTitle(recipe.title)
        setImagePreview(recipe.image)
        setServings(recipe.servings || 4)
        setReadyInMinutes(recipe.readyInMinutes || 30)

        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = recipe.summary || ''
        const plainSummary = tempDiv.textContent || tempDiv.innerText || ''
        setSummary(plainSummary)

        // Normalize instructions (can be array, HTML, or plain text)
        let plainInstructions = ''
        const rawInstructions: any = recipe.instructions

        if (Array.isArray(rawInstructions)) {
            plainInstructions = rawInstructions
                .map((step: any) => (typeof step === 'string' ? step : step?.step || ''))
                .filter(Boolean)
                .join('\n')
        } else if (typeof rawInstructions === 'string') {
            tempDiv.innerHTML = rawInstructions
            const listItems = tempDiv.querySelectorAll('li')
            if (listItems.length > 0) {
                plainInstructions = Array.from(listItems).map(li => li.textContent || '').join('\n')
            } else {
                plainInstructions = tempDiv.textContent || tempDiv.innerText || rawInstructions
            }
        }
        setInstructions(plainInstructions.trim())

        if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
            const parsedIngredients = recipe.ingredients.map((ing: any) => ({
                name: ing.name || '',
                amount: ing.amount || 0,
                unit: ing.unit || '',
                original: ing.original || `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`.trim()
            }))
            setIngredients(parsedIngredients.length > 0 ? parsedIngredients : [{ name: '', amount: 0, unit: '', original: '' }])
        } else {
            setIngredients([{ name: '', amount: 0, unit: '', original: '' }])
        }

        if (recipe.dish_types && Array.isArray(recipe.dish_types)) {
            setDishTypes(recipe.dish_types)
        } else {
            setDishTypes([])
        }
    }

    const cancelEditing = () => {
        setEditingRecipe(null)
        setTitle('')
        setImageFile(null)
        setImagePreview('')
        setSummary('')
        setInstructions('')
        setIngredients([{ name: '', amount: 0, unit: '', original: '' }])
        setDishTypes([])
        setError(null)
    }

    const addIngredient = () => {
        setIngredients([...ingredients, { name: '', amount: 0, unit: '', original: '' }])
    }

    const removeIngredient = (index: number) => {
        if (ingredients.length > 1) {
            setIngredients(ingredients.filter((_, i) => i !== index))
        }
    }

    const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
        const updated = [...ingredients]
        updated[index] = { ...updated[index], [field]: value }

        const ing = updated[index]
        updated[index].original = `${ing.amount || ''} ${ing.unit || ''} ${ing.name || ''}`.trim()

        setIngredients(updated)
    }

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

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile) return null

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

    const handleUpdate = async () => {
        if (!editingRecipe) return

        setError(null)
        setSavingChanges(true)

        try {
            const imageUrl = await uploadImage()

            const instructionSteps = instructions
                .split('\n')
                .map(step => step.trim())
                .filter(step => step.length > 0)

            const formattedInstructions = instructionSteps.length > 0
                ? `<ol>${instructionSteps.map(step => `<li>${step}</li>`).join('')}</ol>`
                : instructions.trim()
            
            const validIngredients = ingredients.filter(ing => ing.name.trim())

            const updates = {
                title: title.trim(),
                servings,
                ready_in_minutes: readyInMinutes,
                summary: formatSummary(summary),
                instructions: formattedInstructions,
                ingredients: validIngredients,
                dish_types: dishTypes,
                ...(imageUrl && { image: imageUrl }),
            }

            const updated = await updateRecipe(userId, String(editingRecipe.id), updates)

            setRecipes(recipes.map(r => r.id === editingRecipe.id ? updated : r))
            cancelEditing()
            alert('Recipe updated successfully!')
        } catch (err) {
            console.error('Error updating recipe:', err)
            setError('Failed to update recipe')
        } finally {
            setSavingChanges(false)
        }
    }

    if (loading) {
        return (
            <div className="my-recipes-page">
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading your recipes...</p>
                </div>
            </div>
        )
    }

    if (editingRecipe) {
        return (
            <div className="my-recipes-page">
                <div className="edit-recipe-header">
                    <h1>Edit Recipe</h1>
                    <button onClick={cancelEditing} className="cancel-edit-btn">✕ Cancel</button>
                </div>

                {error && (
                    <div className="error-message" style={{
                        padding: '1rem',
                        background: '#fee2e2',
                        color: '#dc2626',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                    }}>
                        {error}
                    </div>
                )}

                <div className="edit-form">
                    <div className="form-group">
                        <label>Recipe Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Recipe title"
                        />
                    </div>

                    <div className="form-group">
                        <label>Recipe Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                            id="edit-image-upload"
                        />
                        <label htmlFor="edit-image-upload" className="image-upload-label">
                            {imagePreview ? (
                                <div>
                                    <img src={imagePreview} alt="Preview" style={{ maxWidth: '200px', borderRadius: '8px' }} />
                                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>Click to change</p>
                                </div>
                            ) : (
                                <div>
                                    <p>📷 Click to upload new image</p>
                                </div>
                            )}
                        </label>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Servings</label>
                            <input
                                type="number"
                                value={servings}
                                onChange={(e) => setServings(Number(e.target.value))}
                                min="1"
                            />
                        </div>

                        <div className="form-group">
                            <label>Ready in (minutes)</label>
                            <input
                                type="number"
                                value={readyInMinutes}
                                onChange={(e) => setReadyInMinutes(Number(e.target.value))}
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Summary</label>
                        <textarea
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Brief description..."
                            rows={3}
                        />
                    </div>

                    {/* Ingredients Section */}
                    <div className="form-group">
                        <label>Ingredients *</label>
                        {ingredients.map((ingredient, index) => (
                            <div key={index} className="ingredient-row" style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1fr 1fr auto',
                                gap: '0.75rem',
                                marginBottom: '0.75rem',
                                alignItems: 'center'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Ingredient name"
                                    value={ingredient.name}
                                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Amount"
                                    value={ingredient.amount || ''}
                                    onChange={(e) => updateIngredient(index, 'amount', Number(e.target.value))}
                                />
                                <input
                                    type="text"
                                    placeholder="Unit"
                                    value={ingredient.unit}
                                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                />
                                {ingredients.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeIngredient(index)}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            background: '#fee2e2',
                                            color: '#dc2626',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '1.25rem'
                                        }}
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addIngredient}
                            style={{
                                padding: '0.75rem 1rem',
                                background: '#eff6ff',
                                color: '#2563eb',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                marginTop: '0.5rem'
                            }}
                        >
                            + Add Ingredient
                        </button>
                    </div>

                    <div className="form-group">
                        <label>Instructions *</label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Enter instructions, one step per line..."
                            rows={8}
                        />
                    </div>

                    <div className="form-actions">
                        <button onClick={cancelEditing} className="cancel-btn" disabled={savingChanges || uploadingImage}>
                            Cancel
                        </button>
                        <button onClick={handleUpdate} className="save-btn" disabled={savingChanges || uploadingImage}>
                            {uploadingImage ? 'Uploading Image...' : savingChanges ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="my-recipes-page">
            <div className="my-recipes-header">
                <h1>My Recipes</h1>
                <button onClick={() => setCurrentPage('createRecipe')} className="create-new-btn">
                    ➕ Create New Recipe
                </button>
            </div>

            {recipes.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">👨‍🍳</div>
                    <h2>No recipes yet</h2>
                    <p>Start creating your own recipes and they'll appear here!</p>
                    <button onClick={() => setCurrentPage('createRecipe')} className="create-first-btn">
                        Create Your First Recipe
                    </button>
                </div>
            ) : (
                <div className="recipes-grid">
                    {recipes.map((recipe) => (
                        <div key={recipe.id} className="recipe-card">
                            <img src={recipe.image} alt={recipe.title} className="recipe-image" />
                            <div className="recipe-content">
                                <h3 className="recipe-title">{recipe.title}</h3>
                                <div className="recipe-meta">
                                    <span>⏱️ {recipe.readyInMinutes} min</span>
                                    {recipe.servings && <span>👥 {recipe.servings} servings</span>}
                                </div>
                                <div className="recipe-actions">
                                    <button onClick={() => startEditing(recipe)} className="edit-btn">
                                        ✏️ Edit
                                    </button>
                                    <button onClick={() => handleDelete(String(recipe.id))} className="delete-btn">
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MyRecipesPage
