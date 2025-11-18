export default {
  apps: [
    {
      name: 'keepwatching-api-server',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3033,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3033,
      },
      group: 'cert-access',
      max_memory_restart: '500M',
    },
    {
      name: 'keepwatching-api-server-dev',
      script: 'yarn',
      args: 'dev',
      exec_mode: 'fork',
      watch: ['src'],
      ignore_watch: ['node_modules', 'dist'],
      env: {
        NODE_ENV: 'development',
      },
      env_development: {
        NODE_ENV: 'development',
      },
    },
  ],
};
