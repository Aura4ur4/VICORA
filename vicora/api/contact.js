// Vercel serverless function: POST /api/contact (reuses the same logic as server.js)
const { handleContact } = require('../server');
module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405; res.setHeader('Allow', 'POST'); res.setHeader('Content-Type', 'application/json');
    return res.end('{"ok":false,"error":"Method not allowed."}');
  }
  return handleContact(req, res).catch(err => {
    console.error(err); res.statusCode = 500; res.setHeader('Content-Type', 'application/json'); res.end('{"ok":false,"error":"Server error."}');
  });
};
