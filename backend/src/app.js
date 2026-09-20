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
const projectRoot = path.resolve(__dirname, '../../');
const adminUiPath = path.resolve(__dirname, '../../admin-ui');
const clientUiPath = path.resolve(__dirname, '../../client_ui');

app.use(
  cors({
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
app.use('/admin-ui', express.static(adminUiPath));
app.use('/client_ui', express.static(clientUiPath));
app.use('/css', express.static(path.resolve(projectRoot, 'css')));
app.use('/js', express.static(path.resolve(projectRoot, 'js')));

app.get('/landing', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});


app.get('/api/health', async (req, res, next) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    next(error);
  }
});

// Prevent caching for all API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
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