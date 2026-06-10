import { spawn } from 'node:child_process';

const baseURL = 'http://127.0.0.1:5173';

function waitForServer(url, timeoutMs = 60_000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await fetch(url);
        if (response.ok || response.status < 500) {
          resolve();
          return;
        }
      } catch {
        // Server is not ready yet.
      }

      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Vite server did not start within ${timeoutMs}ms`));
        return;
      }
      setTimeout(poll, 500);
    };
    poll();
  });
}

function runPlaywright(options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['./node_modules/@playwright/test/cli.js', 'test'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      ...options,
    });
    let settled = false;
    let output = '';

    const finish = (error) => {
      if (settled) return;
      settled = true;
      if (!child.killed) child.kill();
      if (error) reject(error);
      else resolve();
    };

    const onData = (chunk, stream) => {
      const text = chunk.toString();
      output += text;
      stream.write(chunk);

      const passed = /\n\s*\d+\s+passed\s+\(/.test(output);
      const failed = /\n\s*\d+\s+failed\s+\(/.test(output) || /\n\s*\d+\s+timed out\s+\(/.test(output);
      if (passed) setTimeout(() => finish(), 500);
      if (failed) setTimeout(() => finish(new Error('Playwright tests failed')), 500);
    };

    child.stdout.on('data', chunk => onData(chunk, process.stdout));
    child.stderr.on('data', chunk => onData(chunk, process.stderr));
    child.on('error', reject);
    child.on('exit', code => {
      if (settled) return;
      if (code === 0) resolve();
      else reject(new Error(`Playwright exited with code ${code}`));
    });
  });
}

function stop(child) {
  if (!child || child.killed) return Promise.resolve();
  if (process.platform === 'win32') {
    return new Promise(resolve => {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      killer.on('exit', resolve);
      killer.on('error', resolve);
    });
  }
  child.kill('SIGTERM');
  return Promise.resolve();
}

const vite = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: false,
});

vite.stdout.on('data', chunk => process.stdout.write(chunk));
vite.stderr.on('data', chunk => process.stderr.write(chunk));

try {
  await waitForServer(baseURL);
  await runPlaywright({
    env: { ...process.env, E2E_BASE_URL: baseURL },
  });
} finally {
  await stop(vite);
}
