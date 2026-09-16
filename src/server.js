const app = require('./app');

const connectDb = require('./config/database');
connectDb();


const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();