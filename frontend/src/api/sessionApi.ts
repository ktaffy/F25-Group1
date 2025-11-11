import type { SessionState } from '../types/sessionTypes';
import { getApiBaseUrl } from '../utils/apiBase';

type ApiError = Error & { status?: number }

const API_BASE_URL = getApiBaseUrl()

function withStatusError(response: Response, message: string): never {
    const error = new Error(message) as ApiError
    error.status = response.status
    throw error
}

export async function createSession(schedule: any): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(schedule),
    });
    
    if (!response.ok) {
        withStatusError(response, 'Failed to create session')
    }
    
    const data = await response.json();
    return data.id;
}

export async function startSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/start`, {
        method: 'POST',
    });
    
    if (!response.ok) {
        withStatusError(response, 'Failed to start session')
    }
}

export async function pauseSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/pause`, {
        method: 'POST',
    });
    
    if (!response.ok) {
        withStatusError(response, 'Failed to pause session')
    }
}

export async function resumeSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/resume`, {
        method: 'POST',
    });
    
    if (!response.ok) {
        withStatusError(response, 'Failed to resume session')
    }
}

export async function skipStep(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/skip`, {
        method: 'POST',
    });
    
    if (!response.ok) {
        withStatusError(response, 'Failed to skip step')
    }
}

export async function getSessionState(sessionId: string): Promise<SessionState> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/state`);
    
    if (!response.ok) {
        withStatusError(response, 'Failed to get session state')
    }
    
    return response.json();
}

export function subscribeToSession(sessionId: string, onUpdate: (state: SessionState) => void): () => void {
    const eventSource = new EventSource(`${API_BASE_URL}/sessions/${sessionId}/stream`);
    
    eventSource.onmessage = (event) => {
        const state = JSON.parse(event.data);
        onUpdate(state);
    };
    
    // Return cleanup function
    return () => {
        eventSource.close();
    };
}

export async function endSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
    });
    
    if (!response.ok) {
        withStatusError(response, 'Failed to end session')
    }
}
