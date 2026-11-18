module.exports = { apps: [{
  name: 'backtesting-journal',
  cwd: __dirname,
  script: 'server/dist/index.js',
  node_args: '--env-file=.env',
  instances: 1,
  exec_mode: 'fork',
  autorestart: true,
  max_memory_restart: '400M',
  env: { NODE_ENV: 'production' }
}] };
