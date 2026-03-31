require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const routes       = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

// Trigger Supabase connection check
require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date() }));
app.use(errorHandler);

app.listen(PORT, () => console.log(`🚀 FleetPro backend → http://localhost:${PORT}`));
