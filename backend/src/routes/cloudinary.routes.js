const express = require('express');
const crypto = require('crypto');
const requireAuth = require('../middleware/auth');
const router = express.Router();

// POST /api/cloudinary/sign
// Returns a signed timestamp for secure direct browser upload
router.post('/sign', requireAuth, (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret || apiSecret === 'PASTE_YOUR_SECRET_HERE') {
    return res.status(500).json({ error: 'Cloudinary is not configured on the server. Please add CLOUDINARY_API_SECRET to your .env file.' });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder    = req.body.folder || 'school_uploads';

  // Signature: SHA1("folder=FOLDER&timestamp=TIMESTAMP" + apiSecret)
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + apiSecret)
    .digest('hex');

  res.json({ signature, timestamp, api_key: apiKey, cloud_name: cloudName, folder });
});

module.exports = router;
