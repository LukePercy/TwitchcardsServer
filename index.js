const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db-connect');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database;
connectDB();

// Route files
const viewer = require('./routes/viewers');

const PORT = process.env.PORT || 3003;

const app = express();

// This allows us to access the body of POST/PUT
// requests in our route handlers (as req.body)
app.use(express.json());
app.use(express.urlencoded());

// Bypass the CORS error
app.use(
  cors({
    origin: ['https://42xd9tib4hce93bavmhmseapyp7fwj.ext-twitch.tv']
  })
  );

// Mount routes
app.use('/api/viewers', viewer);

// Listen the server
const server = app.listen(
  PORT,
  console.log(
    `The server is running in ${process.env.NODE_ENV} mode on port ${PORT} 🚀🚀🚀`
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (error, promise) => {
  console.log(`[Error]: ${error.message}`);

  // Close the server and exit the process
  // if there is any error caught
  server.close(() => process.exit(1));
});
