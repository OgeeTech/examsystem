// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
// const compression = require('compression');
// const mongoSanitize = require('express-mongo-sanitize');
// const xss = require('xss-clean');
// const hpp = require('hpp');
// require('dotenv').config();

// const authRoutes = require('./routes/authRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const tutorRoutes = require('./routes/tutorRoutes');
// const studentRoutes = require('./routes/studentRoutes');
// const notificationRoutes = require('./routes/notificationRoutes');
// const reportRoutes = require('./routes/reportRoutes');
// const questionRoutes = require('./routes/questionRoutes');
// const examRoutes = require('./routes/examRoutes');
// const submissionRoutes = require('./routes/submissionRoutes');

// const app = express();

// // Security middleware
// app.use(helmet());

// // Rate limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 1000, // limit each IP to 1000 requests per windowMs
//     message: 'Too many requests from this IP, please try again later.'
// });
// app.use('/api/', limiter);

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Data sanitization
// app.use(mongoSanitize());
// app.use(xss());
// app.use(hpp());

// // CORS configuration
// app.use(cors({
//     origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//     credentials: true
// }));

// // Compression
// app.use(compression());

// // Static files
// app.use('/uploads', express.static('uploads'));

// // Request logging middleware
// app.use((req, res, next) => {
//     console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
//     next();
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/tutor', tutorRoutes);
// app.use('/api/student', studentRoutes);
// app.use('/api/notifications', notificationRoutes);
// app.use('/api/reports', reportRoutes);
// app.use('/api/questions', questionRoutes);
// app.use('/api/exams', examRoutes);
// app.use('/api/submissions', submissionRoutes);

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//     res.status(200).json({
//         status: 'OK',
//         timestamp: new Date().toISOString(),
//         uptime: process.uptime(),
//         database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
//     });
// });

// // Database connection with retry logic
// const connectDB = async () => {
//     try {
//         const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/education_system', {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//             serverSelectionTimeoutMS: 5000,
//             socketTimeoutMS: 45000,
//         });

//         console.log(`MongoDB Connected: ${conn.connection.host}`);

//         // Handle connection events
//         mongoose.connection.on('error', err => {
//             console.error('MongoDB connection error:', err);
//         });

//         mongoose.connection.on('disconnected', () => {
//             console.log('MongoDB disconnected');
//         });

//     } catch (error) {
//         console.error('MongoDB connection error:', error);
//         process.exit(1);
//     }
// };

// // 404 handler - FIXED: Remove the '*' parameter
// app.use((req, res) => {
//     res.status(404).json({
//         success: false,
//         message: `Route ${req.originalUrl} not found`
//     });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//     console.error('Error:', err.stack);

//     // Mongoose validation error
//     if (err.name === 'ValidationError') {
//         const errors = Object.values(err.errors).map(el => el.message);
//         return res.status(400).json({
//             success: false,
//             message: 'Validation Error',
//             errors
//         });
//     }

//     // Mongoose duplicate key error
//     if (err.code === 11000) {
//         const field = Object.keys(err.keyValue)[0];
//         return res.status(400).json({
//             success: false,
//             message: `${field} already exists`
//         });
//     }

//     // JWT errors
//     if (err.name === 'JsonWebTokenError') {
//         return res.status(401).json({
//             success: false,
//             message: 'Invalid token'
//         });
//     }

//     if (err.name === 'TokenExpiredError') {
//         return res.status(401).json({
//             success: false,
//             message: 'Token expired'
//         });
//     }

//     // Default error
//     res.status(err.statusCode || 500).json({
//         success: false,
//         message: err.message || 'Internal Server Error',
//         ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//     });
// });

// const PORT = process.env.PORT || 5000;

// // Declare server variable for graceful shutdown
// let server;

// const startServer = async () => {
//     try {
//         await connectDB();

//         // Start email scheduler (if exists)
//         try {
//             const scheduler = require('./jobs/scheduler');
//             scheduler.start();
//             console.log('Email scheduler started');
//         } catch (schedulerError) {
//             console.log('Scheduler not found or failed to start:', schedulerError.message);
//         }

//         server = app.listen(PORT, () => {
//             console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
//         });

//         // Handle server errors
//         server.on('error', (error) => {
//             if (error.code === 'EADDRINUSE') {
//                 console.error(`Port ${PORT} is already in use`);
//                 process.exit(1);
//             } else {
//                 console.error('Server error:', error);
//             }
//         });

//     } catch (error) {
//         console.error('Failed to start server:', error);
//         process.exit(1);
//     }
// };

// // Graceful shutdown
// const gracefulShutdown = (signal) => {
//     console.log(`\nReceived ${signal}. Shutting down gracefully...`);

//     // Stop accepting new requests
//     server.close(() => {
//         console.log('HTTP server closed.');

//         // Close database connection
//         mongoose.connection.close(false, () => {
//             console.log('MongoDB connection closed.');

//             // Stop scheduler if exists
//             try {
//                 const scheduler = require('./jobs/scheduler');
//                 scheduler.stop();
//                 console.log('Scheduler stopped.');
//             } catch (error) {
//                 console.log('Scheduler stop failed:', error.message);
//             }

//             process.exit(0);
//         });
//     });

//     // Force close after 10 seconds
//     setTimeout(() => {
//         console.error('Could not close connections in time, forcefully shutting down');
//         process.exit(1);
//     }, 10000);
// };

// process.on('SIGINT', () => gracefulShutdown('SIGINT'));
// process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err, promise) => {
//     console.log('Unhandled Rejection at:', promise, 'reason:', err);
//     // Close server & exit process
//     process.exit(1);
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//     console.log('Uncaught Exception thrown:', err);
//     process.exit(1);
// });

// startServer();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();

// ESSENTIAL MIDDLEWARE ONLY
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic security headers without Helmet
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Load routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/student', studentRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', database: 'Connected' });
});

// Database
const connectDB = async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/education_system');
    console.log('MongoDB Connected');
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    await connectDB();
    console.log(`🚀 Server running on port ${PORT}`);
});