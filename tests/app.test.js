const request = require('supertest');
const { app } = require('../src/app');

describe('HTTP Endpoints Verification', () => {
  test('GET / should return 200 with required JSON fields', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Hello from DevOps Task!');
    expect(res.body).toHaveProperty('status', 'running');
    expect(res.body).toHaveProperty('version');
  });

  test('GET /health should return 200 with status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'UP' });
  });

  test('GET /metrics should expose Prometheus text metrics', async () => {
    // Generate traffic to prime counters
    await request(app).get('/');

    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
  });
});
