const API_BASE = '/api'

interface Recipe {
    id: string
    title: string
    image: string
    readyInMinutes: number
    servings?: number
    summary?: string
}

interface CookingStep {
    recipeId: string
    recipeName: string
    stepIndex: number
    text: string
    attention: 'foreground' | 'background'
    startSec: number
    endSec: number
}

interface Schedule {
    items: CookingStep[]
    totalDurationSec: number
}

export const fetchRandomRecipes = async (number: number = 5): Promise<Recipe[]> => {
    const params = new URLSearchParams({ number: number.toString() })

    try {
        const response = await fetch(`${API_BASE}/recipes/random?${params}`)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('API Response:', data)
        return data
    } catch (error) {
        console.error('Error fetching recipes:', error)
        return []
    }
}

export const fetchRecipeDetails = async (id: string): Promise<Recipe> => {
    const response = await fetch(`${API_BASE}/recipes/${id}`)
    return response.json()
}

export const fetchRecipeSteps = async (id: string) => {
    const response = await fetch(`${API_BASE}/recipes/${id}/steps`)
    return response.json()
}

export const generateSchedule = async (recipeIds: string[]): Promise<Schedule> => {
    const response = await fetch(`${API_BASE}/schedule`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeIds })
    })
    return response.json()
}

export const searchRecipes = async (query: string, limit: number = 20): Promise<Recipe[]> => {
    const params = new URLSearchParams({ query, limit: limit.toString() })
    const response = await fetch(`${API_BASE}/recipes/search?${params}`)
    const data = await response.json()
    return data.items || data
}