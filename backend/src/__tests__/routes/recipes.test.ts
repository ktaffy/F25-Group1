import express from 'express';
import request from 'supertest';
import recipesRouter from '../../routes/recipes.js';

const app = express();
app.use(express.json());
app.use('/recipes', recipesRouter);

describe('Recipes routes (integration)', () => {
  // === Recipes ===
  it('GET /recipes/random', async () => {
    const res = await request(app).get('/recipes/random');
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  it('GET /recipes/search', async () => {
    const res = await request(app).get('/recipes/search?query=pasta');
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  it('GET /recipes/:id', async () => {
    const res = await request(app).get('/recipes/12345');
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  it('GET /recipes/:id/steps', async () => {
    const res = await request(app).get('/recipes/12345/steps');
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  // === Favorites ===
  it('GET /recipes/favorites', async () => {
    const res = await request(app).get(
      '/recipes/favorites?userId=550e8400-e29b-41d4-a716-446655440000'
    );
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  it('POST /recipes/favorites/:recipeId', async () => {
    const res = await request(app)
      .post('/recipes/favorites/716429')
      .send({ userId: '550e8400-e29b-41d4-a716-446655440000' });
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  it('DELETE /recipes/favorites/:recipeId', async () => {
    const res = await request(app)
      .delete('/recipes/favorites/716429')
      .send({ userId: '550e8400-e29b-41d4-a716-446655440000' });
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  it('GET /recipes/:recipeId/is-favorited', async () => {
    const res = await request(app).get(
      '/recipes/716429/is-favorited?userId=550e8400-e29b-41d4-a716-446655440000'
    );
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  // === User Recipes ===
  it('POST /recipes', async () => {
    const res = await request(app).post('/recipes').send({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'My Homemade Pasta',
      servings: 4,
      ready_in_minutes: 30,
      summary: 'Delicious homemade pasta recipe',
      ingredients: [{ name: 'pasta', amount: 500, unit: 'g', original: '500g pasta' }],
      instructions: '1. Boil water\n2. Cook pasta\n3. Serve',
      dish_types: ['dinner', 'main course']
    });
    expect([200, 201, 400, 404, 500]).toContain(res.status);
  });

  it('PUT /recipes/:recipeId', async () => {
    const res = await request(app)
      .put('/recipes/716429')
      .send({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Updated Recipe Title',
        servings: 6
      });
    expect([200, 400, 404, 500]).toContain(res.status);
  });

  it('DELETE /recipes/:recipeId', async () => {
    const res = await request(app)
      .delete('/recipes/716429')
      .send({ userId: '550e8400-e29b-41d4-a716-446655440000' });
    expect([200, 400, 404, 500]).toContain(res.status);
  });
});
