import request from 'supertest';
import express from 'express';
import healthRouter from '../../routes/health.js';

// set up a minimal Express app using the route
const app = express();
app.use('/health', healthRouter);

describe('GET /health', () => {
  it('should return 200 and { status: "ok" }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
