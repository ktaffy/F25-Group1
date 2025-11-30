import { useEffect, useMemo, useState } from 'react'
import { fetchRecipeDetails } from '../api'
import './SchedulePreviewPage.css'

type Page = 'landing' | 'plan' | 'cooking' | 'schedulePreview'

interface ScheduleItem {
    recipeId: string
    recipeName: string
    stepIndex: number
    text: string
    attention: 'foreground' | 'background'
    startSec: number
    endSec: number
}

interface Schedule {
    previewId?: string
    items: ScheduleItem[]
    totalDurationSec: number
}

interface SchedulePreviewPageProps {
    schedule: Schedule | null
    setCurrentPage: (page: Page) => void
}

interface Ingredient {
    name: string
    amount?: number
    unit?: string
    original?: string
}

interface RecipeIngredientGroup {
    recipeId: string
    recipeName: string
    items: string[]
}

const MATERIAL_LIBRARY = [
    { keyword: 'oven', label: 'Oven-safe dish or oven' },
    { keyword: 'skillet', label: 'Skillet or frying pan' },
    { keyword: 'pan', label: 'Saucepan' },
    { keyword: 'pot', label: 'Large pot' },
    { keyword: 'baking sheet', label: 'Baking sheet or tray' },
    { keyword: 'knife', label: "Chef's knife" },
    { keyword: 'cutting board', label: 'Cutting board' },
    { keyword: 'mixing bowl', label: 'Mixing bowl' },
    { keyword: 'whisk', label: 'Whisk' },
    { keyword: 'spatula', label: 'Spatula' },
    { keyword: 'tongs', label: 'Tongs' },
    { keyword: 'foil', label: 'Foil or parchment' },
    { keyword: 'measuring cup', label: 'Measuring cups' },
    { keyword: 'measuring spoon', label: 'Measuring spoons' },
    { keyword: 'colander', label: 'Colander / strainer' },
    { keyword: 'blender', label: 'Blender or food processor' }
] as const

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function formatIngredient(ingredient: Ingredient) {
    if (ingredient.original) return ingredient.original
    const parts = [
        Number.isFinite(ingredient.amount) ? ingredient.amount : '',
        ingredient.unit,
        ingredient.name
    ]

    return parts
        .map(part => (typeof part === 'number' ? part.toString() : (part || '').trim()))
        .filter(Boolean)
        .join(' ')
}

function deriveMaterials(items: ScheduleItem[]): string[] {
    const lowerTexts = items.map(item => `${item.recipeName} ${item.text}`.toLowerCase())
    const found: string[] = []

    MATERIAL_LIBRARY.forEach(entry => {
        if (lowerTexts.some(text => text.includes(entry.keyword)) && !found.includes(entry.label)) {
            found.push(entry.label)
        }
    })

    return found
}

function SchedulePreviewPage({ schedule, setCurrentPage }: SchedulePreviewPageProps) {
    const [ingredientsByRecipe, setIngredientsByRecipe] = useState<RecipeIngredientGroup[]>([])
    const [loadingIngredients, setLoadingIngredients] = useState(false)

    if (!schedule) {
        return (
            <div className="schedule-preview-page">
                <div className="schedule-preview-card">
                    <h1>Schedule Preview</h1>
                    <p>No schedule loaded. Please return to your plan.</p>
                    <div className="preview-actions">
                        <button onClick={() => setCurrentPage('plan')} className="secondary-btn">
                            Back to Plan
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const sortedItems = [...schedule.items].sort((a, b) => a.startSec - b.startSec || a.endSec - b.endSec)
    const materials = useMemo(() => deriveMaterials(sortedItems), [sortedItems])

    useEffect(() => {
        let cancelled = false

        const loadIngredients = async () => {
            if (!schedule) return

            setLoadingIngredients(true)
            try {
                const recipeIds = Array.from(new Set(schedule.items.map(item => item.recipeId)))
                const details = await Promise.all(
                    recipeIds.map(async id => {
                        try {
                            return await fetchRecipeDetails(id)
                        } catch (error) {
                            console.error('Error loading recipe details', error)
                            return null
                        }
                    })
                )

                if (cancelled) return

                const grouped: RecipeIngredientGroup[] = details
                    .map((detail, index) => {
                        if (!detail) return null
                        const recipeId = recipeIds[index]
                        const recipeName =
                            detail.title ||
                            schedule.items.find(item => item.recipeId === recipeId)?.recipeName ||
                            'Recipe'

                        const items = Array.isArray((detail as any).ingredients)
                            ? (detail as any).ingredients
                                  .map((ing: Ingredient) => formatIngredient(ing))
                                  .filter(Boolean)
                            : []

                        return {
                            recipeId: recipeId.toString(),
                            recipeName,
                            items
                        }
                    })
                    .filter(Boolean) as RecipeIngredientGroup[]

                setIngredientsByRecipe(grouped)
            } finally {
                if (!cancelled) {
                    setLoadingIngredients(false)
                }
            }
        }

        loadIngredients()

        return () => {
            cancelled = true
        }
    }, [schedule])

    return (
        <div className="schedule-preview-page">
            <header className="schedule-preview-header">
                <div>
                    <p className="eyebrow">Preview</p>
                    <h1>Cooking Schedule</h1>
                    <p className="subhead">
                        Scroll through your full cooking plan before you start.
                    </p>
                </div>
                <div className="summary-pill">
                    <span>Total Time</span>
                    <strong>{formatTime(schedule.totalDurationSec)}</strong>
                </div>
            </header>

            <div className="preview-actions">
                <button onClick={() => setCurrentPage('plan')} className="secondary-btn">
                    ← Back to Plan
                </button>
                <button onClick={() => setCurrentPage('cooking')} className="primary-btn">
                    Begin Cooking
                </button>
            </div>

            <div className="preview-layout">
                <div className="timeline">
                    {sortedItems.map((item) => (
                        <div key={`${item.recipeId}-${item.stepIndex}`} className="timeline-row">
                            <div className="time-badge">
                                <span className="time-start">{formatTime(item.startSec)}</span>
                                <span className="time-end">{formatTime(item.endSec)}</span>
                            </div>
                            <div className="timeline-card">
                                <div className="timeline-card-header">
                                    <div>
                                        <p className="recipe-name">{item.recipeName}</p>
                                        <p className="step-number">Step {item.stepIndex + 1}</p>
                                    </div>
                                    <span className={`attention ${item.attention}`}>
                                        {item.attention === 'foreground' ? 'Active' : 'Background'}
                                    </span>
                                </div>
                                <p className="step-text">{item.text}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <aside className="preview-sidebar">
                    <div className="sidebar-section">
                        <div className="sidebar-header">
                            <p className="eyebrow">Materials</p>
                            <h3>Tools & Gear</h3>
                        </div>
                        {materials.length > 0 ? (
                            <ul className="material-list">
                                {materials.map(item => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="sidebar-empty">No special equipment detected. Basic kitchen tools should do it.</p>
                        )}
                    </div>

                    <div className="sidebar-section">
                        <div className="sidebar-header">
                            <p className="eyebrow">Ingredients</p>
                            <h3>Shopping Checklist</h3>
                        </div>

                        {loadingIngredients ? (
                            <p className="sidebar-empty">Loading ingredients...</p>
                        ) : ingredientsByRecipe.length > 0 ? (
                            <div className="ingredient-groups">
                                {ingredientsByRecipe.map(group => (
                                    <div key={group.recipeId} className="ingredient-group">
                                        <p className="ingredient-recipe">{group.recipeName}</p>
                                        <ul>
                                            {group.items.map((ing, idx) => (
                                                <li key={`${group.recipeId}-${idx}`}>{ing}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="sidebar-empty">Ingredients will appear once the preview is ready.</p>
                        )}
                    </div>
                </aside>
            </div>

            <div className="preview-actions bottom-actions">
                <button onClick={() => setCurrentPage('plan')} className="secondary-btn">
                    ← Back to Plan
                </button>
                <button onClick={() => setCurrentPage('cooking')} className="primary-btn">
                    Begin Cooking
                </button>
            </div>
        </div>
    )
}

export default SchedulePreviewPage
