
import { useState, useEffect, useRef, useCallback } from 'react'
import * as sessionApi from '../api/sessionApi'
import type { SessionState } from '../types/sessionTypes'
import './CookingPage.css'

type Page = 'landing' | 'plan' | 'cooking'

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

type ApiError = Error & { status?: number }

function CookingPage({ schedule, setCurrentPage }: CookingPageProps) {
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [sessionState, setSessionState] = useState<SessionState | null>(null)
    const [error, setError] = useState<string | null>(null)
    // removed manualStep, not needed
    const [viewStepIndex, setViewStepIndex] = useState<number | null>(null) // for local prev/next
    const [elapsed, setElapsed] = useState<number>(0)
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const createNewSession = useCallback(async () => {
        if (!schedule) return null
        try {
            const id = await sessionApi.createSession(schedule)
            setSessionId(id)
            localStorage.setItem('cookingSessionId', id)
            setError(null)
            return id
        } catch (err) {
            console.error(err)
            setError('Failed to initialize cooking session')
            return null
        }
    }, [schedule])

    // Restore sessionId from localStorage if present
    useEffect(() => {
        const storedId = localStorage.getItem('cookingSessionId')
        if (storedId) setSessionId(storedId)
    }, [])

    // Create session if not present
    useEffect(() => {
        if (!sessionId && schedule) {
            createNewSession()
        }
    }, [sessionId, schedule, createNewSession])

    // Subscribe to session updates
    useEffect(() => {
        if (!sessionId) return
        let cleanup: (() => void) | undefined
        (async () => {
            try {
                const state = await sessionApi.getSessionState(sessionId)
                setSessionState(state)
                setElapsed(state.elapsedSec)
                cleanup = sessionApi.subscribeToSession(sessionId, (state) => {
                    setSessionState(state)
                    setElapsed(state.elapsedSec)
                })
            } catch (err) {
                const status = (err as ApiError)?.status
                if (status === 404) {
                    localStorage.removeItem('cookingSessionId')
                    setSessionId(null)
                    setSessionState(null)
                    await createNewSession()
                    return
                }
                setError('Failed to subscribe to session')
            }
        })()
        return () => { if (cleanup) cleanup() }
    }, [sessionId, createNewSession])

    // Elapsed clock and step progression
    useEffect(() => {
        if (!sessionId || !sessionState) return
        
        if (sessionState.session.status === 'running') {
            timerRef.current = setInterval(() => {
                setElapsed(e => {
                    const newElapsed = e + 1
                    // Request fresh state when time advances to ensure UI updates
                    if (sessionState.current.foreground && 
                        newElapsed >= sessionState.current.foreground.endSec) {
                        sessionApi.getSessionState(sessionId).then(state => {
                            setSessionState(state)
                            setElapsed(state.elapsedSec)
                        })
                    }
                    return newElapsed
                })
            }, 1000)
        } else if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [sessionState && sessionState.session.status, sessionId])

    // Clean up session on quit
    const handleQuit = async () => {
        if (sessionId) {
            try {
                await sessionApi.endSession(sessionId)
                // Get final state to show completion screen
                const finalState = await sessionApi.getSessionState(sessionId)
                setSessionState(finalState)
                localStorage.removeItem('cookingSessionId')
            } catch {
                // If we can't get the final state, just clean up and return to plan
                localStorage.removeItem('cookingSessionId')
                setSessionId(null)
                setSessionState(null)
                setCurrentPage('plan')
            }
        }
    }

    // Next: skip step via API, then refresh state
    const handleNext = async () => {
        if (sessionId && sessionState && sessionState.session.status === 'running') {
            await sessionApi.skipStep(sessionId)
            // Always fetch latest state after skip
            const state = await sessionApi.getSessionState(sessionId)
            setSessionState(state)
            setElapsed(state.elapsedSec)
            setViewStepIndex(null)
        }
    }
    // Prev: show previous step locally (does not rewind timer)
    const handlePrev = () => {
        if (!sessionState || !sessionState.current.foreground) return
        if (sessionState.session.status !== 'running') return
        const prevIndex = sessionState.current.foreground.stepIndex - 1
        if (prevIndex < 0) return
        setViewStepIndex(prevIndex)
    }

    // If viewStepIndex is set, show that step locally

    const handleStart = async () => {
        if (!sessionId || !sessionState) return
        if (sessionState.session.status === 'idle' || sessionState.session.status === 'paused') {
            try {
                if (sessionState.session.status === 'idle') {
                    await sessionApi.startSession(sessionId)
                } else {
                    await sessionApi.resumeSession(sessionId)
                }
                // Always fetch latest state after start/resume
                const state = await sessionApi.getSessionState(sessionId)
                setSessionState(state)
                setElapsed(state.elapsedSec)
            } catch (err) {
                setError('Failed to start/resume session')
            }
        }
    }

    const handlePause = async () => {
        if (!sessionId || !sessionState || sessionState.session.status !== 'running') return
        try {
            await sessionApi.pauseSession(sessionId)
        } catch (err) {
            setError('Failed to pause session')
        }
    }

    const formatDuration = (seconds: number): string => {
        if (seconds < 60) return `${seconds}s`
        const mins = Math.floor(seconds / 60)
        const remainingSecs = seconds % 60
        return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins}m`
    }

    if (error) {
        return (
            <div className="cooking-page">
                <div className="error-state">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={handleQuit}>Quit</button>
                </div>
            </div>
        )
    }

    if (!schedule || !sessionState) {
        return (
            <div className="cooking-page">
                <div className="loading-state">
                    <h2>Loading cooking session...</h2>
                </div>
            </div>
        )
    }

    // Show completion screen only when session truly finished
    const noActiveOrUpcomingStep = !sessionState.current.foreground && !sessionState.nextForeground
    const isSessionComplete =
        sessionState.session.status === 'ended' ||
        (
            (sessionState.session.status === 'running' || sessionState.session.status === 'paused') &&
            (noActiveOrUpcomingStep || elapsed >= schedule.totalDurationSec)
        )
    if (isSessionComplete) {
        const recipeNames = Array.from(new Set(schedule.items.map(item => item.recipeName))).join(', ')
        return (
            <div className="cooking-page">
                <div className="completion-screen">
                    <h1 className="cooking-title">Cooking Complete! 🎉</h1>
                    <p className="completion-message">
                        <strong>We hope you enjoyed cooking {recipeNames}!</strong>
                    </p>
                    <button onClick={() => setCurrentPage('landing')} className="nav-btn finish">
                        Return to Recipes
                    </button>
                </div>
            </div>
        )
    }

    let currentStep = sessionState.current.foreground
    if (viewStepIndex !== null && schedule && schedule.items[viewStepIndex]) {
        currentStep = {
            ...schedule.items[viewStepIndex],
            remainingSec: (schedule.items[viewStepIndex].endSec - schedule.items[viewStepIndex].startSec)
        }
    }
    const backgroundSteps = sessionState.current.background || []
    const nextStep = sessionState.nextForeground
    const progress = (elapsed / schedule.totalDurationSec) * 100

    return (
        <div className="cooking-page">
            <div className="cooking-header">
                <h1 className="cooking-title">Cooking in Progress</h1>
                <div className="overall-progress">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="progress-text">
                        <span>Time Elapsed: {formatDuration(elapsed)}</span>
                        <span>Total: {formatDuration(schedule.totalDurationSec)}</span>
                    </p>
                </div>
            </div>

            {currentStep && (
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
                                <span className="duration">Time Remaining: {formatDuration(currentStep.remainingSec)}</span>
                                <span className="timing">
                                    {formatDuration(currentStep.startSec)} - {formatDuration(currentStep.endSec)}
                                </span>
                            </div>

                            <div className="timer-controls">
                                {sessionState.session.status === 'running' ? (
                                    <button
                                        onClick={async () => {
                                            await handlePause();
                                            const state = await sessionApi.getSessionState(sessionId!);
                                            setSessionState(state);
                                            setElapsed(state.elapsedSec);
                                        }}
                                        className="timer-btn pause"
                                    >
                                        Pause
                                    </button>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            await handleStart();
                                            const state = await sessionApi.getSessionState(sessionId!);
                                            setSessionState(state);
                                            setElapsed(state.elapsedSec);
                                        }}
                                        className="timer-btn play"
                                    >
                                        {sessionState.session.status === 'idle' ? 'Start' : 'Resume'}
                                    </button>
                                )}

                                {sessionState.session.status === 'running' && (
                                    <>
                                        <button
                                            onClick={handlePrev}
                                            className="timer-btn skip"
                                            disabled={currentStep.stepIndex === 0}
                                        >
                                            ← Previous
                                        </button>
                                        {viewStepIndex === null && (
                                            <button
                                                onClick={handleNext}
                                                className="timer-btn skip"
                                            >
                                                Next →
                                            </button>
                                        )}
                                        {viewStepIndex !== null && (
                                            <button
                                                onClick={() => setViewStepIndex(null)}
                                                className="timer-btn skip"
                                                title="Return to the current step"
                                            >
                                                Current Step
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {backgroundSteps.length > 0 && (
                <div className="background-steps">
                    <h3>Background Steps</h3>
                    {backgroundSteps.map((step) => (
                        <div key={`${step.recipeId}-${step.stepIndex}`} className="background-step">
                            <div className="step-info">
                                <span className="recipe-name">{step.recipeName}</span>
                                <span className="step-number">Step {step.stepIndex + 1}</span>
                            </div>
                            <p className="step-instruction">{step.text}</p>
                            <div className="timer-info">
                                <span className="remaining">Remaining: {formatDuration(step.remainingSec)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {nextStep && (
                <div className="next-step">
                    <h3>Coming Up Next</h3>
                    <div className="next-step-content">
                        <div className="step-info">
                            <span className="recipe-name">{nextStep.recipeName}</span>
                            <span className="step-number">Step {nextStep.stepIndex + 1}</span>
                        </div>
                        <p className="step-instruction">{nextStep.text}</p>
                        <span className="starts-in">Starts in: {formatDuration(nextStep.startsInSec)}</span>
                    </div>
                </div>
            )}

            <div className="navigation-controls">
                <button onClick={handleQuit} className="nav-btn finish">
                    Quit
                </button>
            </div>
        </div>
    )
}



export default CookingPage
