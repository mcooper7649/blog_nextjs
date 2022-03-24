const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

module.exports = (phase) => {
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    return {
      env: {
        mongodb_username: 'nextBlog-admin',
        mongodb_password: 'QQwVxzyZTmIeTTSK',
        mongodb_clustername: 'cluster0',
        mongodb_database: 'nextBlog-dev',
      },
    };
  }

  return {
    env: {
      mongodb_username: 'nextBlog-admin',
      mongodb_password: 'QQwVxzyZTmIeTTSK',
      mongodb_clustername: 'cluster0',
      mongodb_database: 'nextBlog-prod',
    },
  };
};
