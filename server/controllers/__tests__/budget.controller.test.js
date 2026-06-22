const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../../utils/testDb');
const BudgetController = require('../budget.controller');

// Minimal app that injects a fake authenticated user (bypasses JWT).
function makeApp(userId) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = { id: userId }; next(); });
  app.get('/budget', BudgetController.getBudgetsByUser);
  app.post('/budget', BudgetController.createBudget);
  app.put('/budget/:id', BudgetController.updateBudget);
  app.delete('/budget/:id', BudgetController.deleteBudget);
  return app;
}

const USER_A = new mongoose.Types.ObjectId().toString();
const USER_B = new mongoose.Types.ObjectId().toString();

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe('budget controller', () => {
  it('creates a budget scoped to the user and returns it', async () => {
    const res = await request(makeApp(USER_A)).post('/budget').send({ category: 'groceries', limit: 5000 });
    expect(res.status).toBe(201);
    expect(res.body.category).toBe('groceries');
    expect(res.body.limit).toBe(5000);
    expect(res.body.user).toBe(USER_A);
  });

  it('rejects a budget with missing category or limit with 400', async () => {
    const res = await request(makeApp(USER_A)).post('/budget').send({ category: 'groceries' });
    expect(res.status).toBe(400);
  });

  it('enforces one budget per (user, category) with 400 on duplicate', async () => {
    const app = makeApp(USER_A);
    await request(app).post('/budget').send({ category: 'groceries', limit: 5000 });
    const dup = await request(app).post('/budget').send({ category: 'groceries', limit: 9000 });
    expect(dup.status).toBe(400);
  });

  it('returns only the requesting user\'s budgets', async () => {
    await request(makeApp(USER_A)).post('/budget').send({ category: 'groceries', limit: 5000 });
    await request(makeApp(USER_B)).post('/budget').send({ category: 'fuel', limit: 3000 });
    const res = await request(makeApp(USER_A)).get('/budget');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].category).toBe('groceries');
  });

  it('404s when updating another user\'s budget', async () => {
    const created = await request(makeApp(USER_B)).post('/budget').send({ category: 'fuel', limit: 3000 });
    const res = await request(makeApp(USER_A)).put(`/budget/${created.body._id}`).send({ limit: 1 });
    expect(res.status).toBe(404);
  });

  it('updates the user\'s own budget limit', async () => {
    const created = await request(makeApp(USER_A)).post('/budget').send({ category: 'fuel', limit: 3000 });
    const res = await request(makeApp(USER_A)).put(`/budget/${created.body._id}`).send({ limit: 4500 });
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(4500);
  });

  it('404s when deleting another user\'s budget, 200 for own', async () => {
    const created = await request(makeApp(USER_B)).post('/budget').send({ category: 'fuel', limit: 3000 });
    const denied = await request(makeApp(USER_A)).delete(`/budget/${created.body._id}`);
    expect(denied.status).toBe(404);
    const ok = await request(makeApp(USER_B)).delete(`/budget/${created.body._id}`);
    expect(ok.status).toBe(200);
  });
});
