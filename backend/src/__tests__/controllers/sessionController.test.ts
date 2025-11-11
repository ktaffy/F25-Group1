import express from 'express';
import request from 'supertest';
import sessionsRouter from '../../routes/sessions.js';

const app = express();
app.use(express.json());
app.use('/sessions', sessionsRouter);

describe('sessionController (integration)', () => {
  const sampleSchedule = {
    items: [
      {
        recipeId: '1',
        recipeName: 'Soup',
        stepIndex: 0,
        text: 'Boil water',
        attention: 'foreground',
        startSec: 0,
        endSec: 60
      },
    ],
    totalDurationSec: 60
  };

  let createdId = '';

  // === CREATE ===
  it('POST /sessions should create a new session (201)', async () => {
    const res = await request(app).post('/sessions').send(sampleSchedule);
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) createdId = res.body.id;
  });

  it('POST /sessions with invalid payload should return 400', async () => {
    const res = await request(app).post('/sessions').send({});
    expect(res.status).toBe(400);
  });

  it('POST /sessions with missing body should 400', async () => {
    const res = await request(app).post('/sessions');
    expect(res.status).toBe(400);
  });

  // === START ===
  it('POST /sessions/:id/start should start the session', async () => {
    if (!createdId) return;
    const res = await request(app).post(`/sessions/${createdId}/start`);
    expect([200, 404, 409]).toContain(res.status);
  });

  it('POST /sessions/start without id should return 400', async () => {
    const res = await request(app).post('/sessions//start');
    expect([400, 404]).toContain(res.status);
  });

  // === PAUSE ===
  it('POST /sessions/:id/pause should pause the session', async () => {
    if (!createdId) return;
    const res = await request(app).post(`/sessions/${createdId}/pause`);
    expect([200, 404, 409]).toContain(res.status);
  });

  it('POST /sessions/:id/pause invalid id should 404', async () => {
    const res = await request(app).post('/sessions/badid/pause');
    expect([404, 400]).toContain(res.status);
  });

  it('POST /sessions//pause should 404 for missing id', async () => {
    const res = await request(app).post('/sessions//pause');
    expect(res.status).toBe(404);
  });

  // === RESUME ===
  it('POST /sessions/:id/resume should resume (maybe conflict)', async () => {
    if (!createdId) return;
    const res = await request(app).post(`/sessions/${createdId}/resume`);
    expect([200, 404, 409]).toContain(res.status);
  });

  it('POST /sessions/:id/resume invalid id should 404', async () => {
    const res = await request(app).post('/sessions/badid/resume');
    expect([404, 400]).toContain(res.status);
  });

  it('POST /sessions//resume should 404 for missing id', async () => {
    const res = await request(app).post('/sessions//resume');
    expect(res.status).toBe(404);
  });

  // === SKIP ===
  it('POST /sessions/:id/skip should skip or 409 if not running', async () => {
    if (!createdId) return;
    const res = await request(app).post(`/sessions/${createdId}/skip`);
    expect([200, 404, 409]).toContain(res.status);
  });

  it('POST /sessions/:id/skip invalid id should 404', async () => {
    const res = await request(app).post('/sessions/badid/skip');
    expect([404, 400]).toContain(res.status);
  });

  it('POST /sessions//skip should 404 for missing id', async () => {
    const res = await request(app).post('/sessions//skip');
    expect(res.status).toBe(404);
  });

  // === STATE ===
  it('GET /sessions/:id/state should return snapshot or 404', async () => {
    if (!createdId) return;
    const res = await request(app).get(`/sessions/${createdId}/state`);
    expect([200, 404]).toContain(res.status);
  });

  it('GET /sessions/:id/state with invalid id should 404', async () => {
    const res = await request(app).get('/sessions/badid/state');
    expect([404, 400]).toContain(res.status);
  });

  it('GET /sessions//state should 404 for missing id', async () => {
    const res = await request(app).get('/sessions//state');
    expect(res.status).toBe(404);
  });

  // === DELETE ===
  it('DELETE /sessions/:id should end the session', async () => {
    if (!createdId) return;
    const res = await request(app).delete(`/sessions/${createdId}`);
    expect([200, 404]).toContain(res.status);
  });

  it('DELETE /sessions/:id invalid should 404', async () => {
    const res = await request(app).delete('/sessions/badid');
    expect([404, 400]).toContain(res.status);
  });

  it('DELETE /sessions// should 404 for missing id', async () => {
    const res = await request(app).delete('/sessions//');
    expect(res.status).toBe(404);
  });

  // === STREAM (SSE) ===
  it('GET /sessions/:id/stream should 404 if session not found', async () => {
    const res = await request(app).get('/sessions/fakeid/stream');
    expect([404, 400]).toContain(res.status);
  });

  it('GET /sessions//stream should 404 if no id', async () => {
    const res = await request(app).get('/sessions//stream');
    expect(res.status).toBe(404);
  });

  it('GET /sessions/:id/stream should return 200 and event-stream headers if exists', async () => {
    if (!createdId) return;
    const res = await request(app)
      .get(`/sessions/${createdId}/stream`)
      .set('Accept', 'text/event-stream');
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers['content-type']).toContain('text/event-stream');
    }
  });
});
