# careguidebd-assessment
DevOps Engineer Candidate Assessment Task

## Incident Investigation Walkthrough
### "An error spike appears on the Application dashboard. How do you find the cause using these tools?"

When an on-call engineer receives an `HighHttpErrorRate` alert or observes an error spike in Grafana:

1. **Step 1: Isolate Time and Endpoint in the Application Dashboard**
   * Open the **Application Metrics & Correlated Logs** dashboard (`http://localhost:3000`).
   * Observe the **Error Rate (HTTP 4xx/5xx)** panel to pinpoint the exact start time of the spike (e.g. 14:32:00 UTC).
   * Cross-reference the **Request Rate** panel to see which HTTP path (`/`, `/health`, `/metrics`) is correlating with the failures.

2. **Step 2: Inspect Correlated Structured Logs (Loki Panel)**
   * Directly underneath the metrics graphs on the same screen, review the **Correlated Application Logs** panel.
   * Apply a LogQL filter to isolate errors without leaving the dashboard:
     `{container="devops-service", level="error"}`
   * Expand a log line to read the JSON payload:
     * Check `"status"` (e.g., `500` or `503`).
     * Read `"error"` or stack trace emitted directly by the Pino logger.

3. **Step 3: Correlate with Container Resource Saturation (cAdvisor)**
   * Switch to the **Container Resource Utilization** dashboard.
   * Check the **Memory Usage Relative to Configured Limit (%)** panel.
   * *Assessment:* If memory suddenly peaked at 100% (256MB), the Node.js event loop paused or an internal worker crashed due to an Out-Of-Memory (OOM) kill or event loop lag.

4. **Step 4: Check Underlying Host Health (Node Exporter)**
   * Switch to the **Host OS & Infrastructure** dashboard.
   * Verify if the host machine ran out of disk space (`Host Disk Usage > 80%`) or experienced CPU starvation, which could explain slow I/O or dropped connections.

5. **Step 5: Resolution & Verification**
   * Fix the offending code regression or adjust container resource limits in `docker-compose.monitoring.yml`.
   * Observe the Application dashboard to verify that the Error Rate drops to 0 RPS and p99 latency normalizes below 50ms.
