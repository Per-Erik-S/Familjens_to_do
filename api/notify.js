const webpush = require('web-push');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const contactEmail = process.env.VAPID_EMAIL || 'mailto:hej@familjenstodo.se';

  if (!publicKey || !privateKey) {
    return res.status(500).json({ error: 'VAPID keys missing in Vercel environment variables' });
  }

  webpush.setVapidDetails(contactEmail, publicKey, privateKey);

  const { subscriptions, title, body, url } = req.body || {};
  if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
    return res.status(200).json({ sent: 0 });
  }

  const payload = JSON.stringify({
    title: title || 'Familjens Todo',
    body: body || '🛒 Någon i gruppen handlar just nu!',
    url: url || '/?open=shopping'
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) => webpush.sendNotification(sub, payload))
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  return res.status(200).json({ sent });
};
