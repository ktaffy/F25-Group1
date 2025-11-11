const API_BASE = import.meta.env.VITE_API_BASE_URL;


interface Recipe {
    id: string
    title: string
    image: string
    readyInMinutes: number
    servings?: number
    summary?: string
    averageRating?: number
    reviewCount?: number
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

interface Review {
    user_id: string
    rating: number
    created_at: string
}

export const fetchRandomRecipes = async (number: number = 5): Promise<Recipe[]> => {
    const params = new URLSearchParams({ number: number.toString() })

    try {
        const response = await fetch(`${API_BASE}/recipes/random?${params}`)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        console.log('Random recipes response:', data)

        let recipes: Recipe[] = [];
        if (Array.isArray(data)) {
            recipes = data
        } else if (data.recipes && Array.isArray(data.recipes)) {
            recipes = data.recipes
        } else {
            console.error('Unexpected response format:', data)
            return []
        }

        const recipesWithRatings = await Promise.all(
            recipes.map(async (recipe) => {
                try {
                    const reviews = await getRecipeReviews(recipe.id);
                    const averageRating = reviews.length > 0
                        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                        : 0;

                    return {
                        ...recipe,
                        averageRating: Math.round(averageRating * 10) / 10,
                        reviewCount: reviews.length
                    };
                } catch (error) {
                    console.error(`Error fetching reviews for recipe ${recipe.id}:`, error);
                    return {
                        ...recipe,
                        averageRating: 0,
                        reviewCount: 0
                    };
                }
            })
        );

        return recipesWithRatings;
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

export const searchRecipes = async (filters: Record<string, string> = {}): Promise<Recipe[]> => {
    try {
        const params = new URLSearchParams(filters)
        const response = await fetch(`${API_BASE}/recipes/search?${params}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Search response:', data)

        let recipes: Recipe[] = [];
        if (Array.isArray(data)) {
            recipes = data
        } else if (data.items && Array.isArray(data.items)) {
            recipes = data.items
        } else if (data.results && Array.isArray(data.results)) {
            recipes = data.results
        } else if (data.recipes && Array.isArray(data.recipes)) {
            recipes = data.recipes
        } else {
            console.error('Unexpected search response format:', data)
            return []
        }

        const recipesWithRatings = await Promise.all(
            recipes.map(async (recipe) => {
                try {
                    const reviews = await getRecipeReviews(recipe.id);
                    const averageRating = reviews.length > 0
                        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
                        : 0;

                    return {
                        ...recipe,
                        averageRating: Math.round(averageRating * 10) / 10,
                        reviewCount: reviews.length
                    };
                } catch (error) {
                    console.error(`Error fetching reviews for recipe ${recipe.id}:`, error);
                    return {
                        ...recipe,
                        averageRating: 0,
                        reviewCount: 0
                    };
                }
            })
        );

        return recipesWithRatings;
    } catch (error) {
        console.error('Error searching recipes:', error)
        return []
    }
}

export const createRecipe = async (recipeData: {
    userId: string
    title: string
    image: string
    servings: number
    ready_in_minutes: number
    summary: string
    ingredients: Array<{
        name: string
        amount: number
        unit: string
        original: string
    }>
    instructions: string
    dish_types: string[]
}): Promise<Recipe> => {
    const response = await fetch(`${API_BASE}/recipes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData)
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    const newRecipe = await response.json()

    try {
        await fetch(`${API_BASE}/recipes/favorites/${newRecipe.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: recipeData.userId })
        })
    } catch (error) {
        console.error('Error auto-favoriting recipe:', error)
    }

    return newRecipe
}

export const fetchUserRecipes = async (userId: string): Promise<Recipe[]> => {
    try {
        const response = await fetch(`${API_BASE}/recipes/user?userId=${userId}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        return Array.isArray(data) ? data : []
    } catch (error) {
        console.error('Error fetching user recipes:', error)
        return []
    }
}

export const deleteRecipe = async (userId: string, recipeId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
}

export const addReview = async (recipeId: string, userId: string, rating: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/recipes/${recipeId}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, rating })
    })

    if (!response.ok) {
        if (response.status === 409) {
            throw new Error('You have already reviewed this recipe')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
    }
}

export const getRecipeReviews = async (recipeId: string): Promise<Review[]> => {
    const response = await fetch(`${API_BASE}/recipes/${recipeId}/reviews`)

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
}

export const deleteReview = async (recipeId: string, userId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/recipes/${recipeId}/reviews`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
    })

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }
}