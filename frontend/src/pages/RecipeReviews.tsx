import { useState, useEffect } from 'react'
import { addReview, getRecipeReviews, deleteReview } from '../api'
import './RecipeReviews.css'

interface Review {
    user_id: string
    rating: number
    created_at: string
    username?: string
}

interface RecipeReviewsProps {
    recipeId: string
    currentUserId: string
}

function RecipeReviews({ recipeId, currentUserId }: RecipeReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [userRating, setUserRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [hasUserReviewed, setHasUserReviewed] = useState(false)

    useEffect(() => {
        loadReviews()
    }, [recipeId])

    const loadReviews = async () => {
        try {
            const reviewsData = await getRecipeReviews(recipeId)
            setReviews(reviewsData)

            // Check if current user has already reviewed
            const userReview = reviewsData.find(review => review.user_id === currentUserId)
            if (userReview) {
                setHasUserReviewed(true)
                setUserRating(userReview.rating)
            }
        } catch (err) {
            console.error('Error loading reviews:', err)
        }
    }

    const handleSubmitReview = async () => {
        if (userRating === 0) {
            setError('Please select a rating')
            return
        }

        setLoading(true)
        setError('')
        try {
            await addReview(recipeId, currentUserId, userRating)
            await loadReviews() // Reload reviews to show the new one
            setHasUserReviewed(true)
        } catch (err: any) {
            setError(err.message || 'Failed to submit review')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteReview = async () => {
        setLoading(true)
        try {
            await deleteReview(recipeId, currentUserId)
            setUserRating(0)
            setHasUserReviewed(false)
            await loadReviews()
        } catch (err: any) {
            setError(err.message || 'Failed to delete review')
        } finally {
            setLoading(false)
        }
    }

    const calculateAverageRating = () => {
        if (reviews.length === 0) return 0
        const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
        return (sum / reviews.length).toFixed(1)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    return (
        <div className="recipe-reviews">
            <h3 className="reviews-title">Reviews & Ratings</h3>

            {/* Rating Summary */}
            <div className="rating-summary">
                <div className="average-rating">
                    <span className="rating-number">{calculateAverageRating()}</span>
                    <span className="rating-stars">
                        {'★'.repeat(Math.round(Number(calculateAverageRating())))}
                        {'☆'.repeat(5 - Math.round(Number(calculateAverageRating())))}
                    </span>
                    <span className="rating-count">({reviews.length} reviews)</span>
                </div>
            </div>

            {/* User Review Section */}
            {!hasUserReviewed ? (
                <div className="add-review-section">
                    <h4>Rate this recipe</h4>
                    <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                className={`star ${star <= (hoverRating || userRating) ? 'active' : ''}`}
                                onClick={() => setUserRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                disabled={loading}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    {userRating > 0 && (
                        <button
                            onClick={handleSubmitReview}
                            disabled={loading}
                            className="submit-review-btn"
                        >
                            {loading ? 'Submitting...' : `Submit ${userRating} Star Rating`}
                        </button>
                    )}
                </div>
            ) : (
                <div className="user-review-section">
                    <h4>Your Rating</h4>
                    <div className="user-rating">
                        <span className="user-rating-stars">
                            {'★'.repeat(userRating)}
                            {'☆'.repeat(5 - userRating)}
                        </span>
                        <button
                            onClick={handleDeleteReview}
                            disabled={loading}
                            className="delete-review-btn"
                        >
                            Remove Rating
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* Reviews List */}
            {reviews.length > 0 && (
                <div className="reviews-list">
                    <h4>All Reviews</h4>
                    {reviews.map((review, index) => (
                        <div key={index} className="review-item">
                            <div className="review-header">
                                <span className="review-rating">
                                    {'★'.repeat(review.rating)}
                                    {'☆'.repeat(5 - review.rating)}
                                </span>
                                <span className="review-date">
                                    {formatDate(review.created_at)}
                                </span>
                            </div>
                            {review.user_id === currentUserId && (
                                <span className="your-review-badge">Your review</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default RecipeReviews