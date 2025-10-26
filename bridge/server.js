const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3000;
const FASTAPI_URL = 'http://localhost:8000';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Bridge server is running' });
});

// Proxy endpoint for color prediction from RGB
app.get('/color', async (req, res) => {
  try {
    const { x, y, z } = req.query;
    console.log(`[Bridge] Forwarding color request: RGB(${x}, ${y}, ${z})`);

    const response = await axios.get(`${FASTAPI_URL}/color`, {
      params: { x, y, z },
      timeout: 30000
    });

    console.log('[Bridge] Color prediction successful:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('[Bridge] Error forwarding color request:', error.message);
    res.status(500).json({
      error: 'Failed to get color prediction',
      details: error.message
    });
  }
});

// Proxy endpoint for image upload
app.post('/uploadfile', async (req, res) => {
  try {
    const { file_uri } = req.body;

    if (!file_uri) {
      return res.status(400).json({ error: 'file_uri is required' });
    }

    console.log('[Bridge] Forwarding image upload request...');
    console.log('[Bridge] Image data length:', file_uri.length);

    const response = await axios.post(
      `${FASTAPI_URL}/uploadfile`,
      { file_uri },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000, // 60 second timeout for image processing
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    console.log('[Bridge] Upload successful:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('[Bridge] Error forwarding upload:', error.message);
    if (error.response) {
      console.error('[Bridge] FastAPI error:', error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({
        error: 'Failed to process image',
        details: error.message
      });
    }
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('🌉 Bridge Server Started');
  console.log('='.repeat(50));
  console.log(`Listening on: http://0.0.0.0:${PORT}`);
  console.log(`FastAPI backend: ${FASTAPI_URL}`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  GET  /health       - Health check`);
  console.log(`  GET  /color        - Color prediction from RGB`);
  console.log(`  POST /uploadfile   - Image upload for color analysis`);
  console.log('='.repeat(50));
});
