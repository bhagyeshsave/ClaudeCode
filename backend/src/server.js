const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

async function start() {
  try {
    await sequelize.authenticate();
    // eslint-disable-next-line no-console
    console.log('Database connection established successfully.');

    await sequelize.sync({ alter: true });
    // eslint-disable-next-line no-console
    console.log('Database schema synced successfully.');

    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`Server is listening on port ${env.port} (${env.nodeEnv})`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
