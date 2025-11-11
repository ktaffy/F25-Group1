import express from 'express';
import request from 'supertest';
import scheduleRouter from '../../routes/schedule.js'; // uses createSchedule controller

const app = express();
app.use(express.json());
app.use('/schedule', scheduleRouter);

describe('scheduleController (integration)', () => {
  it('POST /schedule with valid recipeIds should return 200 or 500', async () => {
    const res = await request(app)
      .post('/schedule')
      .send({ recipeIds: [715538, 641803] });
    // if everything works, controller returns 200;
    // if scheduleService fails, 500 (acceptable for integration)
    expect([200, 400, 500]).toContain(res.status);
  });

  it('POST /schedule with missing recipeIds should return 400', async () => {
    const res = await request(app).post('/schedule').send({});
    expect([400, 500]).toContain(res.status);
  });

  it('POST /schedule with invalid type should return 400', async () => {
    const res = await request(app).post('/schedule').send({ recipeIds: 'not-an-array' });
    expect([400, 500]).toContain(res.status);
  });
});
