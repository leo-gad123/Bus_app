process.env.ELECTRON_RUNNING = 'true';

const path = require('path');
const express = require('express');
const app = require('../backend/server');

const FRONTEND_BUILD = path.join(__dirname, '..', 'frontend', 'build');

app.use(express.static(FRONTEND_BUILD));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
    res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Electron server running on port ${PORT}`));
