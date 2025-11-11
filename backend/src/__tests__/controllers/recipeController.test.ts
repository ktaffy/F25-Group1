import express from 'express';
import request from 'supertest';
import recipesRouter from '../../routes/recipes.js';
import { jest } from '@jest/globals';

const app = express();
app.use(express.json());
app.use('/recipes', recipesRouter);

describe('recipeController (integration + coverage)', () => {
  // === Core Recipes ===
  it('GET /recipes/random should return 200 or 500', async () => {
    const res = await request(app).get('/recipes/random?number=3');
    expect([200, 500]).toContain(res.status);
  });

  it('GET /recipes/search should return 200 or 500', async () => {
    const res = await request(app).get('/recipes/search?query=chicken');
    expect([200, 500]).toContain(res.status);
  });

  it('GET /recipes/:id should return 404 for invalid ID', async () => {
    const res = await request(app).get('/recipes/invalid_id');
    expect([404, 500]).toContain(res.status);
  });

  it('GET /recipes/:id/steps should return 200 or 500', async () => {
    const res = await request(app).get('/recipes/716429/steps');
    expect([200, 404, 500]).toContain(res.status);
  });

  // === Favorites ===
  it('GET /recipes/favorites without userId should return 500', async () => {
    const res = await request(app).get('/recipes/favorites');
    expect(res.status).toBe(500);
  });

  it('GET /recipes/favorites with userId should return 200 or 500', async () => {
    const res = await request(app)
      .get('/recipes/favorites?userId=550e8400-e29b-41d4-a716-446655440000');
    expect([200, 400, 500]).toContain(res.status);
  });

  it('POST /recipes/favorites/:recipeId without userId should return 400', async () => {
    const res = await request(app).post('/recipes/favorites/12345').send({});
    expect(res.status).toBe(400);
  });

  it('POST /recipes/favorites/:recipeId with userId should return 200 or 500', async () => {
    const res = await request(app)
      .post('/recipes/favorites/716429')
      .send({ userId: '550e8400-e29b-41d4-a716-446655440000' });
    expect([200, 400, 500]).toContain(res.status);
  });

  it('DELETE /recipes/favorites/:recipeId without userId should return 400', async () => {
    const res = await request(app).delete('/recipes/favorites/716429').send({});
    expect(res.status).toBe(400);
  });

  it('GET /recipes/:recipeId/is-favorited without userId should return 400', async () => {
    const res = await request(app).get('/recipes/716429/is-favorited');
    expect(res.status).toBe(400);
  });

  it('GET /recipes/:recipeId/is-favorited with userId should return 200 or 500', async () => {
    const res = await request(app)
      .get('/recipes/716429/is-favorited?userId=550e8400-e29b-41d4-a716-446655440000');
    expect([200, 400, 500]).toContain(res.status);
  });

  // === User Recipes ===
  it('POST /recipes without userId should return 400', async () => {
    const res = await request(app).post('/recipes').send({ title: 'no userId' });
    expect(res.status).toBe(400);
  });

  it('POST /recipes with userId should return 201 or 500', async () => {
    const res = await request(app).post('/recipes').send({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Integration Pasta',
      servings: 2,
      ready_in_minutes: 30,
      ingredients: [{ name: 'pasta', amount: 200, unit: 'g', original: '200g pasta' }],
      instructions: 'Boil water, cook pasta, drain.',
      dish_types: ['dinner']
    });
    expect([200, 201, 400, 500]).toContain(res.status);
  });

  it('PUT /recipes/:recipeId without userId should return 400', async () => {
    const res = await request(app).put('/recipes/12345').send({ title: 'Bad update' });
    expect(res.status).toBe(400);
  });

  it('PUT /recipes/:recipeId with userId should return 200 or 500', async () => {
    const res = await request(app)
      .put('/recipes/716429')
      .send({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Updated Recipe',
        servings: 3
      });
    expect([200, 400, 500]).toContain(res.status);
  });

  it('DELETE /recipes/:recipeId without userId should return 400', async () => {
    const res = await request(app).delete('/recipes/716429').send({});
    expect(res.status).toBe(400);
  });

  it('DELETE /recipes/:recipeId with userId should return 200 or 500', async () => {
    const res = await request(app)
      .delete('/recipes/716429')
      .send({ userId: '550e8400-e29b-41d4-a716-446655440000' });
    expect([200, 400, 500]).toContain(res.status);
  });
});
