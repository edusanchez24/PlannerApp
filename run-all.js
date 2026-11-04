import { spawn } from 'node:child_process';

console.log('====================================================');
console.log('🚀 Iniciando Smart Planner (Frontend Vite + Backend API)');
console.log('====================================================\n');

// 1. Iniciar Servidor API (server.js)
const apiProcess = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, API_PORT: process.env.API_PORT || '3001' }
});

// 2. Iniciar Vite Frontend
const viteProcess = spawn('npx', ['vite', '--host'], {
  stdio: 'inherit',
  shell: false,
  env: process.env
});

function limpiar() {
  console.log('\nDeteniendo servicios...');
  apiProcess.kill();
  viteProcess.kill();
  process.exit(0);
}

process.on('SIGINT', limpiar);
process.on('SIGTERM', limpiar);

apiProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[API] El proceso del servidor terminó con código ${code}`);
  }
});

viteProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`[Vite] El proceso de Vite terminó con código ${code}`);
  }
});
