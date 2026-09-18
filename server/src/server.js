require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const Project = require('./models/Project');
const seedData = require('./seed');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Auto-seed on first launch if empty database
  try {
    const projectCount = await Project.countDocuments();
    if (projectCount === 0) {
      console.log('Database is empty. Automatically seeding demo ecological projects...');
      await seedData();
    }
  } catch (err) {
    console.warn('Auto-seed check warning:', err.message);
  }

  const server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🌱 Darukaa.Earth Backend API running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });

  // Graceful shutdown
  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
