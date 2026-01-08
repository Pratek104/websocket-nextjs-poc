module.exports = {
  apps: [
    {
      name: 'websocket-nextjs-poc',
      script: 'npm',
      args: 'run start',
      cwd: '/home/satri/testing/websocket-nextjs-poc',
      env: {
        NODE_ENV: 'production',
        PORT: 3012,
        WS_PORT: 3013,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
