/**
 * Vercel Serverless Function: api/callback.js
 * Receives the M-PESA payment success/failure webhook notification callbacks.
 */

export default async function handler(req, res) {
  // Enable permissive CORS headers so third-party operators can invoke it.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed. Only POST and OPTIONS handshake endpoints are active." });
  }

  try {
    const callbackData = req.body || {};
    console.log("[Vercel callback.js] Received webhook notification:", JSON.stringify(callbackData, null, 2));

    // Acknowledge receipt of transaction callback
    return res.status(200).json({
      status: "acknowledged",
      message: "Webhook logged successfully.",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[Vercel callback.js Error]:", error);
    return res.status(500).json({ error: error.message || "Failed to process transaction callback." });
  }
}
