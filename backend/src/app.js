const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { PRODUCT_IMAGES_DIR } = require('./config/paths');

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded product images statically.
app.use('/uploads/products', express.static(PRODUCT_IMAGES_DIR));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'OK' });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
