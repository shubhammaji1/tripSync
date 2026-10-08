// Starts the real API with a deliberately unavailable local database. No external data is modified.
const { spawn } = require('node:child_process');
const path = require('node:path');
const child = spawn(process.execPath, ['dist/main.js'], { cwd: path.resolve(__dirname, '../apps/api'), env: { ...process.env, NODE_ENV: 'test', PORT: '4199', DATABASE_URL: 'postgresql://smoke:smoke@127.0.0.1:1/smoke', NOTIFICATIONS_USE_QUEUE: 'false' }, stdio: ['ignore','pipe','pipe'] });
let output = ''; child.stdout.on('data', data => { output += data; }); child.stderr.on('data', data => { output += data; });
(async () => {
  try {
    let started = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try { const response = await fetch('http://127.0.0.1:4199/api/v1/health/live', { signal: AbortSignal.timeout(1000) }); if (response.status === 200) { started = true; break; } } catch {}
      if (child.exitCode !== null) throw new Error('API exited before startup: ' + output.slice(-4000));
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!started) throw new Error('API did not become live: ' + output.slice(-4000));
    const protectedResponse = await fetch('http://127.0.0.1:4199/api/v1/trips');
    if (protectedResponse.status !== 401) throw new Error('Unauthenticated trip request was not rejected: ' + protectedResponse.status);
    const health = await fetch('http://127.0.0.1:4199/api/v1/health', { signal: AbortSignal.timeout(15000) });
    if (health.status !== 503) throw new Error('Unavailable database readiness was not rejected: ' + health.status);
    const readinessAlias = await fetch('http://127.0.0.1:4199/api/v1/health/ready', { signal: AbortSignal.timeout(15000) });
    if (readinessAlias.status !== 503) throw new Error('Readiness route did not reject unavailable database: ' + readinessAlias.status);
    console.log('API HTTP smoke passed: live=200, unauthenticated trips=401, unavailable database=503');
  } finally { child.kill(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
