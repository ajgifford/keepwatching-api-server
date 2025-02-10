module.exports = {
  apps: [
    {
      name: 'keepwatching-server',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3033
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3033
      },
      group: "cert-access"
    },
    {
      name: 'keepwatching-server-dev',
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
