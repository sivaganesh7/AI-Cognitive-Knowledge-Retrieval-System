const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env'), override: false });
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectMongo } = require('./db/pool');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));

// Server/network timeouts for better resilience under heavy load.
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 30000);
app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS);
  res.setTimeout(REQUEST_TIMEOUT_MS);
  next();
});

// Rate limiting
const isProduction = process.env.NODE_ENV === 'production';
const apiWindowMs = Number(process.env.API_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const apiMax = Number(process.env.API_RATE_LIMIT_MAX || (isProduction ? 100 : 5000));
const aiWindowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 60 * 1000);
const aiMax = Number(process.env.AI_RATE_LIMIT_MAX || (isProduction ? 20 : 600));

const limiter = rateLimit({
  windowMs: apiWindowMs,
  max: apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
const aiLimiter = rateLimit({
  windowMs: aiWindowMs,
  max: aiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI rate limit exceeded. Please wait a moment.' }
});

app.use('/api/', limiter);
app.use('/api/ai/', aiLimiter);

// Routes
app.use('/api/notes', require('./routes/notes'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/user', require('./routes/user'));
app.use('/api/public', require('./routes/public'));
app.use('/api/tags', require('./routes/tags'));

// Health check
app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date(), version: '1.0.0' })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    await connectMongo();
    app.listen(PORT, () =>
      console.log(`🚀 AI Cognitive Knowledge Retrieval System Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error('[DB] Failed to connect to MongoDB:', err.message);
    process.exit(1);
  }
}

startServer();

