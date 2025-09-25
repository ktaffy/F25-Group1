import { useState, useEffect } from 'react'
import './CookingPage.css'

type Page = 'landing' | 'cart' | 'cooking'

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

interface CookingPageProps {
    schedule: Schedule | null
    setCurrentPage: (page: Page) => void
}

function CookingPage({ schedule, setCurrentPage }: CookingPageProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [timer, setTimer] = useState(0)
    const [isTimerRunning, setIsTimerRunning] = useState(false)

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null
        if (isTimerRunning) {
            interval = setInterval(() => {
                setTimer(timer => timer + 1)
            }, 1000)
        } else if (!isTimerRunning && timer !== 0) {
            clearInterval(interval!)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [isTimerRunning, timer])

    if (!schedule || !schedule.items) {
        return (
            <div className="cooking-page">
                <div className="loading-state">
                    <h2>Loading cooking schedule...</h2>
                </div>
            </div>
        )
    }

    const currentStep = schedule.items[currentStepIndex]
    const progress = ((currentStepIndex + 1) / schedule.items.length) * 100
    const stepDuration = currentStep.endSec - currentStep.startSec

    const nextStep = () => {
        if (currentStepIndex < schedule.items.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1)
            setTimer(0)
            setIsTimerRunning(false)
        }
    }

    const prevStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(currentStepIndex - 1)
            setTimer(0)
            setIsTimerRunning(false)
        }
    }

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatDuration = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`
        const mins = Math.floor(seconds / 60)
        const remainingSecs = seconds % 60
        return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins}m`
    }

    return (
        <div className="cooking-page">
            <div className="cooking-header">
                <h1>Cooking in Progress</h1>
                <div className="overall-progress">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="progress-text">
                        Step {currentStepIndex + 1} of {schedule.items.length} •
                        Total time: {formatDuration(schedule.totalDurationSec)}
                    </p>
                </div>
            </div>

            <div className="current-step-container">
                <div className="step-header">
                    <h2 className="recipe-name">{currentStep.recipeName}</h2>
                    <div className={`attention-badge ${currentStep.attention}`}>
                        {currentStep.attention === 'foreground' ? '👨‍🍳 Active' : '⏰ Passive'}
                    </div>
                </div>

                <div className="step-content">
                    <div className="step-number">Step {currentStep.stepIndex + 1}</div>
                    <p className="step-instruction">{currentStep.text}</p>

                    <div className="timer-section">
                        <div className="timer-info">
                            <span className="duration">Duration: {formatDuration(stepDuration)}</span>
                            <span className="timing">
                                {formatDuration(currentStep.startSec)} - {formatDuration(currentStep.endSec)}
                            </span>
                        </div>

                        <div className="timer-controls">
                            <div className="timer-display">
                                <span className="timer-time">{formatTime(timer)}</span>
                            </div>
                            <div className="timer-buttons">
                                <button
                                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                                    className={`timer-btn ${isTimerRunning ? 'pause' : 'play'}`}
                                >
                                    {isTimerRunning ? 'Pause' : 'Start'}
                                </button>
                                <button
                                    onClick={() => setTimer(0)}
                                    className="timer-btn reset"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="navigation-controls">
                <button
                    onClick={prevStep}
                    disabled={currentStepIndex === 0}
                    className="nav-btn prev"
                >
                    ← Previous
                </button>

                <div className="step-indicator">
                    {schedule.items.map((_, index) => (
                        <div
                            key={index}
                            className={`step-dot ${index === currentStepIndex ? 'active' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
                            onClick={() => {
                                setCurrentStepIndex(index)
                                setTimer(0)
                                setIsTimerRunning(false)
                            }}
                        />
                    ))}
                </div>

                {currentStepIndex < schedule.items.length - 1 ? (
                    <button onClick={nextStep} className="nav-btn next">
                        Next →
                    </button>
                ) : (
                    <button
                        onClick={() => setCurrentPage('cart')}
                        className="nav-btn finish"
                    >
                        Finish
                    </button>
                )}
            </div>
        </div>
    )
}

export default CookingPage