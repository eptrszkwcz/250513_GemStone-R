// server.js
const express = require('express');
// const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3000;

const ORS_API_KEY = '5b3ce3597851110001cf62484dc346cdc9c8402b9e5e63e835161859'; 

app.use(cors());
app.use(express.json());

app.post('/route', async (req, res) => {
  try {
    const orsResponse = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await orsResponse.json();
    res.json(data);
  } catch (error) {
    console.error('ORS proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch route from ORS' });
  }
});

app.listen(PORT, () => {
  console.log(`ORS proxy server running on http://localhost:${PORT}`);
});