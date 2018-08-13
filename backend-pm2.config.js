module.exports = {
  apps : [{
    name      : 'omnitrack-backend',
    script    : './dist/backend/server/app.js',
    log: './logs/production.log',
    error: './logs/error.log',
    output: './logs/server.log',

    env: {
      NODE_ENV: 'development'
    },
    env_production : {
      NODE_ENV: 'production'
    }
  }],
};
