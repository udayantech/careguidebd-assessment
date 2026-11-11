const express = require('express');
const pinoHttp = require('pino-http');
const pino = require('pino');
const config = require('./config');
const { client, httpRequestsTotal, httpErrorsTotal, httpRequestDurationSeconds } = require('./metrics');

const logger = pino({
  level: config.logLevel,
  base: { service: 'devops-service', env: config.env, version: config.version },
  timestamp: pino.stdTimeFunctions.isoTime
});

const app = express();

// Middleware: Structured Logging
app.use(pinoHttp({ logger }));

// Middleware: Prometheus Instrumentation
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    const path = req.route ? req.route.path : req.path;
    const status = res.statusCode.toString();

    httpRequestDurationSeconds.observe({ method: req.method, path, status }, duration);
    httpRequestsTotal.inc({ method: req.method, path, status });

    if (res.statusCode >= 400) {
      httpErrorsTotal.inc({ method: req.method, path, status });
    }
  });

  next();
});

// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Hello from DevOps Task!',
    status: 'running',
    version: config.version
  });
});

// Liveness & Readiness Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Prometheus Metrics Scraping Endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    req.log.error(err, 'Failed to export metrics');
    res.status(500).end();
  }
});

module.exports = { app, logger };
