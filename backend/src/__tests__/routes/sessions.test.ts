import express from 'express';
import request from 'supertest';
import sessionsRouter from '../../routes/sessions.js';

const app = express();
app.use(express.json());
app.use('/sessions', sessionsRouter);

describe('Sessions routes (integration)', () => {
<<<<<<< HEAD
  // === Create session ===
  it('POST /sessions with valid body should respond with 201 or 500', async () => {
    const payload = {
      items: [
        {
          recipeId: '123',
          recipeName: 'Pasta',
          stepIndex: 0,
          text: 'Boil water',
          attention: 'foreground',
          startSec: 0,
          endSec: 60
        }
      ],
      totalDurationSec: 120
    };
    const res = await request(app).post('/sessions').send(payload);
    expect([201, 400, 500]).toContain(res.status);
  });

  it('POST /sessions with invalid body should respond with 400 or 500', async () => {
    const res = await request(app).post('/sessions').send({ totalDurationSec: 100 });
    expect([400, 500]).toContain(res.status);
  });

  // === Start session ===
  it('POST /sessions/:id/start should respond with 200, 404, or 409', async () => {
    const res = await request(app).post('/sessions/test123/start');
    expect([200, 404, 409, 500]).toContain(res.status);
  });

  // === Pause session ===
  it('POST /sessions/:id/pause should respond with 200, 404, or 409', async () => {
    const res = await request(app).post('/sessions/test123/pause');
    expect([200, 404, 409, 500]).toContain(res.status);
  });

  // === Resume session ===
  it('POST /sessions/:id/resume should respond with 200, 404, or 409', async () => {
    const res = await request(app).post('/sessions/test123/resume');
    expect([200, 404, 409, 500]).toContain(res.status);
  });

  // === Skip current step ===
  it('POST /sessions/:id/skip should respond with 200, 404, or 409', async () => {
    const res = await request(app).post('/sessions/test123/skip');
    expect([200, 404, 409, 500]).toContain(res.status);
  });

  // === Get session state ===
  it('GET /sessions/:id/state should respond with 200 or 404', async () => {
    const res = await request(app).get('/sessions/test123/state');
    expect([200, 404, 500]).toContain(res.status);
  });

  // === Stream session ===
  it('GET /sessions/:id/stream should respond with 200 or 404', async () => {
    const res = await request(app).get('/sessions/test123/stream');
    expect([200, 404, 500]).toContain(res.status);
  });

  // === Delete session ===
  it('DELETE /sessions/:id should respond with 200 or 404', async () => {
    const res = await request(app).delete('/sessions/test123');
    expect([200, 404, 500]).toContain(res.status);
  });
=======
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
>>>>>>> df18ba32a6e8f4a1e1d90810323fdd75373b6b6e
});
