import { useEffect, useState } from 'react'
import { fetchRandomRecipes, fetchRecipeDetails, searchRecipes } from '../api'
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
    favorites: Recipe[]
    setFavorites: (favorites: Recipe[]) => void
}

function LandingPage({ cart, setCart, favorites, setFavorites }: LandingPageProps) {
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [resultsPerPage, setResultsPerPage] = useState(10)
    const [showAdvanced, setShowAdvanced] = useState(false)
    
    // Advanced search filters
    const [cuisine, setCuisine] = useState('')
    const [diet, setDiet] = useState('')
    const [mealType, setMealType] = useState('')

    useEffect(() => {
        loadRandomRecipes()
    }, [])

    const loadRandomRecipes = async () => {
        setLoading(true)
        try {
            const data = await fetchRandomRecipes(resultsPerPage)
            // Convert string IDs to numbers
            const recipesWithNumericIds = data.map(recipe => ({
                ...recipe,
                id: typeof recipe.id === 'string' ? parseInt(recipe.id) : recipe.id
            }))
            setRecipes(recipesWithNumericIds)
            setSearchQuery('')
            setCuisine('')
            setDiet('')
            setMealType('')
        } catch (error) {
            console.error('Error loading recipes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = async () => {
        setLoading(true)
        try {
            const filters: Record<string, string> = {
                number: resultsPerPage.toString()
            }
            
            // Add search query if present
            if (searchQuery.trim()) {
                filters.query = searchQuery.trim()
            }
            
            // Add advanced filters
            if (cuisine) filters.cuisine = cuisine
            if (diet) filters.diet = diet
            if (mealType) filters.type = mealType
            
            const data = await searchRecipes(filters)
            // Convert string IDs to numbers
            const recipesWithNumericIds = data.map(recipe => ({
                ...recipe,
                id: typeof recipe.id === 'string' ? parseInt(recipe.id) : recipe.id
            }))
            setRecipes(recipesWithNumericIds)
        } catch (error) {
            console.error('Error searching recipes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    const previewRecipe = async (recipe: Recipe) => {
        try {
            // Convert number ID to string for API call
            const fullRecipe = await fetchRecipeDetails(String(recipe.id))
            // Convert string ID back to number for state
            setSelectedRecipe({
                ...fullRecipe,
                id: typeof fullRecipe.id === 'string' ? parseInt(fullRecipe.id) : fullRecipe.id
            })
        } catch (error) {
            console.error('Error fetching recipe details:', error)
        }
    }

    const addToCart = (recipe: Recipe) => {
        if (!cart.find(item => item.id === recipe.id)) {
            setCart([...cart, recipe])
        }
    }

    const toggleFavorite = (recipe: Recipe) => {
        if (favorites.find(item => item.id === recipe.id)) {
            setFavorites(favorites.filter(item => item.id !== recipe.id))
        } else {
            setFavorites([...favorites, recipe])
        }
    }

    return (
        <div className="landing-page">
            <div className="landing-header">
                <h1 className="landing-title">Discover Recipes</h1>
                <p className="landing-subtitle">Find amazing recipes to add to your cooking schedule</p>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>
                {/* Main Search Bar */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Search recipes (e.g., pasta, chicken, vegan)..."
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            fontSize: '1rem',
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: 'white',
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        Search
                    </button>
                    <button
                        onClick={loadRandomRecipes}
                        disabled={loading}
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: '#374151',
                            backgroundColor: '#f3f4f6',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                        }}
                    >
                        Clear
                    </button>
                </div>

                {/* Advanced Search Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        style={{
                            padding: '0.5rem 1rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#3b82f6',
                            backgroundColor: 'transparent',
                            border: '1px solid #3b82f6',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {showAdvanced ? '▼' : '▶'} Advanced Search
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Results per page:
                        </label>
                        <select
                            value={resultsPerPage}
                            onChange={(e) => setResultsPerPage(Number(e.target.value))}
                            style={{
                                padding: '0.5rem',
                                fontSize: '0.875rem',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                backgroundColor: 'white',
                                color: resultsPerPage ? '#111827' : '#9ca3af'
                            }}
                        >
                            <option value="" disabled hidden>Select Results</option>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                </div>

                {/* Advanced Search Panel */}
                {showAdvanced && (
                    <div style={{
                        padding: '1.5rem',
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        marginBottom: '1rem'
                    }}>
                        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                            Filter Options
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            {/* Cuisine Type */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                                    Cuisine
                                </label>
                                <select
                                    value={cuisine}
                                    onChange={(e) => setCuisine(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        fontSize: '0.875rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        backgroundColor: 'white',
                                        color: cuisine ? '#111827' : '#9ca3af'
                                    }}
                                >
                                    <option value="" disabled hidden>Select Cuisine</option>
                                    <option value="">Any Cuisine</option>
                                    <option value="african">African</option>
                                    <option value="american">American</option>
                                    <option value="british">British</option>
                                    <option value="cajun">Cajun</option>
                                    <option value="caribbean">Caribbean</option>
                                    <option value="chinese">Chinese</option>
                                    <option value="eastern european">Eastern European</option>
                                    <option value="european">European</option>
                                    <option value="french">French</option>
                                    <option value="german">German</option>
                                    <option value="greek">Greek</option>
                                    <option value="indian">Indian</option>
                                    <option value="irish">Irish</option>
                                    <option value="italian">Italian</option>
                                    <option value="japanese">Japanese</option>
                                    <option value="jewish">Jewish</option>
                                    <option value="korean">Korean</option>
                                    <option value="latin american">Latin American</option>
                                    <option value="mediterranean">Mediterranean</option>
                                    <option value="mexican">Mexican</option>
                                    <option value="middle eastern">Middle Eastern</option>
                                    <option value="nordic">Nordic</option>
                                    <option value="southern">Southern</option>
                                    <option value="spanish">Spanish</option>
                                    <option value="thai">Thai</option>
                                    <option value="vietnamese">Vietnamese</option>
                                </select>
                            </div>

                            {/* Diet Type */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                                    Diet
                                </label>
                                <select
                                    value={diet}
                                    onChange={(e) => setDiet(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        fontSize: '0.875rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        backgroundColor: 'white',
                                        color: diet ? '#111827' : '#9ca3af'
                                    }}
                                >
                                    <option value="" disabled hidden>Select Diet</option>
                                    <option value="">Any Diet</option>
                                    <option value="gluten free">Gluten Free</option>
                                    <option value="ketogenic">Ketogenic</option>
                                    <option value="vegetarian">Vegetarian</option>
                                    <option value="lacto-vegetarian">Lacto-Vegetarian</option>
                                    <option value="ovo-vegetarian">Ovo-Vegetarian</option>
                                    <option value="vegan">Vegan</option>
                                    <option value="pescetarian">Pescetarian</option>
                                    <option value="paleo">Paleo</option>
                                    <option value="primal">Primal</option>
                                    <option value="low fodmap">Low FODMAP</option>
                                    <option value="whole30">Whole30</option>
                                </select>
                            </div>

                            {/* Meal Type */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                                    Meal Type
                                </label>
                                <select
                                    value={mealType}
                                    onChange={(e) => setMealType(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        fontSize: '0.875rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '6px',
                                        backgroundColor: 'white',
                                        color: mealType ? '#111827' : '#9ca3af'
                                    }}
                                >
                                    <option value="" disabled hidden>Select Meal Type</option>
                                    <option value="">Any Meal Type</option>
                                    <option value="main course">Main Course</option>
                                    <option value="side dish">Side Dish</option>
                                    <option value="dessert">Dessert</option>
                                    <option value="appetizer">Appetizer</option>
                                    <option value="salad">Salad</option>
                                    <option value="bread">Bread</option>
                                    <option value="breakfast">Breakfast</option>
                                    <option value="soup">Soup</option>
                                    <option value="beverage">Beverage</option>
                                    <option value="sauce">Sauce</option>
                                    <option value="marinade">Marinade</option>
                                    <option value="fingerfood">Fingerfood</option>
                                    <option value="snack">Snack</option>
                                    <option value="drink">Drink</option>
                                </select>
                            </div>
                        </div>

                        {/* Active Filters Display */}
                        {(cuisine || diet || mealType) && (
                            <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Active filters:</span>
                                {cuisine && (
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        fontSize: '0.75rem',
                                        backgroundColor: '#dbeafe',
                                        color: '#1e40af',
                                        borderRadius: '9999px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        Cuisine: {cuisine}
                                        <button
                                            onClick={() => setCuisine('')}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#1e40af',
                                                cursor: 'pointer',
                                                padding: 0,
                                                fontSize: '1rem'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {diet && (
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        fontSize: '0.75rem',
                                        backgroundColor: '#dcfce7',
                                        color: '#166534',
                                        borderRadius: '9999px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        Diet: {diet}
                                        <button
                                            onClick={() => setDiet('')}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#166534',
                                                cursor: 'pointer',
                                                padding: 0,
                                                fontSize: '1rem'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {mealType && (
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        fontSize: '0.75rem',
                                        backgroundColor: '#fef3c7',
                                        color: '#92400e',
                                        borderRadius: '9999px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        Type: {mealType}
                                        <button
                                            onClick={() => setMealType('')}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#92400e',
                                                cursor: 'pointer',
                                                padding: 0,
                                                fontSize: '1rem'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                )}
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

                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => addToCart(selectedRecipe)}
                                        className="add-to-cart-button"
                                        disabled={cart.some(item => item.id === selectedRecipe.id)}
                                    >
                                        {cart.some(item => item.id === selectedRecipe.id) ? 'Added to Cart' : 'Add to Cart'}
                                    </button>
                                    <button
                                        onClick={() => toggleFavorite(selectedRecipe)}
                                        style={{
                                            padding: '12px 20px',
                                            fontSize: '18px',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            backgroundColor: favorites.some(item => item.id === selectedRecipe.id) ? '#fecaca' : '#f3f4f6',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {favorites.some(item => item.id === selectedRecipe.id) ? '❤️' : '🤍'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading recipes...</p>
                </div>
            ) : recipes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
                        No recipes found. Try adjusting your search or filters!
                    </p>
                </div>
            ) : (
                <>
                    <div className="recipe-grid">
                        {recipes.map(recipe => (
                            <div key={recipe.id} className="recipe-card" style={{ position: 'relative' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleFavorite(recipe)
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        background: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        fontSize: '20px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                        transition: 'transform 0.2s',
                                        zIndex: 10
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                                >
                                    {favorites.some(item => item.id === recipe.id) ? '❤️' : '🤍'}
                                </button>

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
                                'Load More Random Recipes'
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default LandingPage