require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start the Express HTTP server
const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 StaffSync Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🌐 Server Port: http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});

// Handle unhandled Promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Keep server alive during development so developers can see errors
});
