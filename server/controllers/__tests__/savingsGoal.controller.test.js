const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { connect, clearDatabase, closeDatabase } = require('../../utils/testDb');
const SavingsGoalController = require('../savingsGoal.controller');

function makeApp(userId) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.user = { id: userId }; next(); });
  app.get('/savings-goal', SavingsGoalController.getSavingsGoal);
  app.put('/savings-goal', SavingsGoalController.upsertSavingsGoal);
  return app;
}

const USER_A = new mongoose.Types.ObjectId().toString();
const USER_B = new mongoose.Types.ObjectId().toString();

beforeAll(connect);
afterEach(clearDatabase);
afterAll(closeDatabase);

describe('savings goal controller', () => {
  it('returns amount 0 when no goal is set', async () => {
    const res = await request(makeApp(USER_A)).get('/savings-goal');
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(0);
  });

  it('creates the goal on first PUT (upsert)', async () => {
    const res = await request(makeApp(USER_A)).put('/savings-goal').send({ amount: 20000 });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(20000);
  });

  it('overwrites the existing goal on a second PUT (one per user)', async () => {
    const app = makeApp(USER_A);
    await request(app).put('/savings-goal').send({ amount: 20000 });
    await request(app).put('/savings-goal').send({ amount: 35000 });
    const res = await request(app).get('/savings-goal');
    expect(res.body.amount).toBe(35000);
  });

  it('scopes the goal to the user', async () => {
    await request(makeApp(USER_A)).put('/savings-goal').send({ amount: 20000 });
    const res = await request(makeApp(USER_B)).get('/savings-goal');
    expect(res.body.amount).toBe(0);
  });
});
