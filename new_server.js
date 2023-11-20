const express = require('express');
const app = express(); // This is our web server
const path = require('path');
const PORT = process.env.PORT || 3500;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/new-page.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'new-page.html'));
});

app.listen(PORT, () => console.log(`Server running and listening on port ${PORT}`));