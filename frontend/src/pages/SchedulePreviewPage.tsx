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

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
}

function SchedulePreviewPage({ schedule, setCurrentPage }: SchedulePreviewPageProps) {
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
