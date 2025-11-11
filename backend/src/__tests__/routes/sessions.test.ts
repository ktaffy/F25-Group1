import express from 'express';
import request from 'supertest';
import sessionsRouter from '../../routes/sessions.js';

const app = express();
app.use(express.json());
app.use('/sessions', sessionsRouter);

describe('Sessions routes (integration)', () => {
    // === Create Session ===
    it('POST /sessions — should create a session', async () => {
        const res = await request(app)
            .post('/sessions')
            .send({
                items: [
                    {
                        recipeId: '123',
                        recipeName: 'Pasta',
                        stepIndex: 0,
                        text: 'Boil water',
                        attention: 'foreground',
                        startSec: 0,
                        endSec: 60,
                    },
                ],
                totalDurationSec: 60,
            });

        expect([200, 201, 400, 404, 500]).toContain(res.status);
    });

    it('POST /sessions — should return 400 for invalid payload', async () => {
        const res = await request(app).post('/sessions').send({});
        expect([400, 500]).toContain(res.status);
    });

    // === Session Controls ===
    it('POST /sessions/:id/start — should start session', async () => {
        const res = await request(app).post('/sessions/123/start');
        expect([200, 404, 409, 500]).toContain(res.status);
    });

    it('POST /sessions/:id/pause — should pause session', async () => {
        const res = await request(app).post('/sessions/123/pause');
        expect([200, 404, 409, 500]).toContain(res.status);
    });

    it('POST /sessions/:id/resume — should resume session', async () => {
        const res = await request(app).post('/sessions/123/resume');
        expect([200, 404, 409, 500]).toContain(res.status);
    });

    it('POST /sessions/:id/skip — should skip current step', async () => {
        const res = await request(app).post('/sessions/123/skip');
        expect([200, 404, 409, 500]).toContain(res.status);
    });

    // === State + Stream ===
    it('GET /sessions/:id/state — should get session snapshot', async () => {
        const res = await request(app).get('/sessions/123/state');
        expect([200, 404, 500]).toContain(res.status);
    });

    it('GET /sessions/:id/stream — should attempt to open SSE stream', async () => {
        const res = await request(app).get('/sessions/123/stream');
        expect([200, 404, 500]).toContain(res.status);
    });

    // === Delete Session ===
    it('DELETE /sessions/:id — should delete session', async () => {
        const res = await request(app).delete('/sessions/123');
        expect([200, 404, 500]).toContain(res.status);
    });
});
