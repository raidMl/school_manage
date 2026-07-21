const app = require('./src/app');
const bootstrapDatabase = require('./src/config/bootstrap');

const port = Number(process.env.PORT || 5000);

async function start() {
  await bootstrapDatabase();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});