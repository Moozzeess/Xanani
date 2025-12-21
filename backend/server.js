const app = require('./app');
const connectDB = require('./config/db');
const { PORT, MONGO_URI } = require('./config/env');

(async () => {
  await connectDB(MONGO_URI);
  app.listen(PORT, () =>
    console.log(`Servidor corriendo en el puerto: ${PORT}`)
  );
})();