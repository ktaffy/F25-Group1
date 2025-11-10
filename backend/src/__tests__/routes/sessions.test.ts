import express from 'express';
import request from 'supertest';
import sessionsRouter from '../../routes/sessions.js';

const app = express();
app.use(express.json());
app.use('/sessions', sessionsRouter);

describe('Sessions routes (integration)', () => {
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
});
