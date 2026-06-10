import { execSync } from 'node:child_process';

function stopWindowsPort(port: number) {
  const output = execSync(`netstat -ano -p tcp | findstr :${port}`, { encoding: 'utf8' });
  const pids = new Set<string>();

  for (const line of output.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 5 && parts[1]?.endsWith(`:${port}`) && parts[3] === 'LISTENING') {
      pids.add(parts[4]);
    }
  }

  for (const pid of pids) {
    execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
  }
}

function stopUnixPort(port: number) {
  const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8' });
  for (const pid of output.split(/\s+/).filter(Boolean)) {
    execSync(`kill ${pid}`, { stdio: 'ignore' });
  }
}

export default async function globalTeardown() {
  const port = 5173;
  try {
    if (process.platform === 'win32') {
      stopWindowsPort(port);
    } else {
      stopUnixPort(port);
    }
  } catch {
    // No test server was listening, or it already exited.
  }
}
