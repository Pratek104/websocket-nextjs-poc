module.exports = {
  apps: [
    {
      name: 'nextjs-app',
      script: 'npm',
      args: 'run start:next',
      cwd: '/var/www/websocket-poc',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'websocket-server',
      script: 'npm',
      args: 'run start:ws',
      cwd: '/var/www/websocket-poc',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
