require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { query } = require('./config/db');

const app = express();
const adminUiPath = path.resolve(__dirname, '../../admin-ui');

app.use(
  cors({
    // origin: process.env.FRONTEND_ORIGIN || '*',
   origin: '*'
  })
);
app.use(
  helmet({
    contentSecurityPolicy: false, // allow XHR partial loading from same origin
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(express.static(adminUiPath));

app.get('/health', async (req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

app.use('/api', apiRoutes);

// Serve index.html for any non-API, non-asset HTML route (SPA-style fallback)
app.get('*.html', (req, res) => {
  const file = path.join(adminUiPath, path.basename(req.path));
  res.sendFile(file, (err) => {
    if (err) res.sendFile(path.join(adminUiPath, 'index.html'));
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(adminUiPath, 'index.html'));
});

app.use(errorHandler);

module.exports = app;