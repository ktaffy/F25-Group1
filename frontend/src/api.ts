const API_BASE = 'http://localhost:4000'

interface Recipe {
    id: number
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

export const fetchRandomRecipes = async (number: number = 5, tags: string = ''): Promise<Recipe[]> => {
    const params = new URLSearchParams({ number: number.toString() })
    if (tags) params.append('tags', tags)

    try {
        const response = await fetch(`${API_BASE}/recipes/random?${params}`)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('Random recipes response:', data)
        
        // Handle different response structures
        if (Array.isArray(data)) {
            return data
        } else if (data.recipes && Array.isArray(data.recipes)) {
            return data.recipes
        } else {
            console.error('Unexpected response format:', data)
            return []
        }
    } catch (error) {
        console.error('Error fetching recipes:', error)
        return []
    }
}

export const fetchRecipeDetails = async (id: number): Promise<Recipe> => {
    const response = await fetch(`${API_BASE}/recipes/${id}`)
    return response.json()
}

export const fetchRecipeSteps = async (id: number) => {
    const response = await fetch(`${API_BASE}/recipes/${id}/steps`)
    return response.json()
}

export const generateSchedule = async (recipeIds: number[]): Promise<Schedule> => {
    const response = await fetch(`${API_BASE}/schedule`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeIds })
    })
    return response.json()
}

export const searchRecipes = async (filters: Record<string, string> = {}): Promise<Recipe[]> => {
    try {
        const params = new URLSearchParams(filters)
        const response = await fetch(`${API_BASE}/recipes/search?${params}`)
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Search response:', data)
        
        // Handle different response structures
        if (Array.isArray(data)) {
            return data
        } else if (data.items && Array.isArray(data.items)) {
            return data.items  // THIS IS THE FIX!
        } else if (data.results && Array.isArray(data.results)) {
            return data.results
        } else if (data.recipes && Array.isArray(data.recipes)) {
            return data.recipes
        } else {
            console.error('Unexpected search response format:', data)
            return []
        }
    } catch (error) {
        console.error('Error searching recipes:', error)
        return []
    }
}