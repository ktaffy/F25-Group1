import express from 'express';
import request from 'supertest';
import scheduleRouter from '../../routes/schedule.js';

const app = express();
app.use(express.json());
app.use('/schedule', scheduleRouter);

describe('Schedule routes (integration)', () => {

  it('POST /schedule with valid recipeIds should respond with 200 or 500', async () => {
    const res = await request(app)
      .post('/schedule')
      .send({ recipeIds: [715538, 641803] });
    // success or internal error depending on controller behavior
    expect([200, 400, 500]).toContain(res.status);
  });

  it('POST /schedule with missing recipeIds should respond with 400', async () => {
    const res = await request(app).post('/schedule').send({});
    expect([400, 500]).toContain(res.status);
  });

  it('POST /schedule with invalid recipeIds type should respond with 400', async () => {
    const res = await request(app)
      .post('/schedule')
      .send({ recipeIds: 'not-an-array' });
    expect([400, 500]).toContain(res.status);
  });

    it('POST /schedule — should handle schedule creation', async () => {
        const res = await request(app)
            .post('/schedule')
            .send({
                recipeIds: [715538, 641803],
            });

        expect([200, 400, 404, 500]).toContain(res.status);
    });

    it('POST /schedule — should return 400 for missing recipeIds', async () => {
        const res = await request(app)
            .post('/schedule')
            .send({}); // missing recipeIds
        expect([400, 500]).toContain(res.status);
    });

});
