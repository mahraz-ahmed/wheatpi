const { kv } = require('@vercel/kv');

const DEFAULTS = {
  slides: [
    { url: 'assets/carousel_default_1.png', caption: 'Welcome to the Wheatstone Makerspace — Build • Create • Innovate' },
    { url: 'assets/carousel_default_2.png', caption: 'Open to all KCL students — Mon-Fri • Macadam Building • Strand Campus' },
    { url: 'assets/carousel_default_3.png', caption: '3D Printing • Laser Cutting • CNC — Equipment available for your projects' }
  ],
  statusUpdates: [
    'Welcome to the Wheatstone Makerspace — Macadam Building, Strand Campus',
    'Remember: No food or drink allowed in the lab!',
    'Need help? Ask a Wheatstone Alliance committee member'
  ],
  events: [
    { name: 'Intro to Soldering Workshop', date: '2026-05-08', time: '14:00 – 16:00', link: 'https://kclsu.org' },
    { name: 'Robotics Society Build Night', date: '2026-05-10', time: '18:00 – 21:00' },
    { name: 'KCL Rocketry — Launch Prep', date: '2026-05-14', time: '15:00 – 18:00' },
    { name: '3D Printing Masterclass', date: '2026-05-17', time: '13:00 – 15:00' },
    { name: 'Electronics Society Social', date: '2026-05-22', time: '19:00 – 22:00' }
  ],
  bbcEnabled: true,
  carouselInterval: 60000,
  credentials: {
    username: 'admin',
    password: 'password123'
  }
};

module.exports = async function handler(req, res) {
  // If KV isn't configured yet, just return defaults so the site doesn't crash
  if (!process.env.KV_REST_API_URL) {
    return res.status(200).json(DEFAULTS);
  }

  if (req.method === 'GET') {
    try {
      let data = await kv.get('wheatstone_data');
      if (!data) {
        // Initialize KV if empty
        await kv.set('wheatstone_data', DEFAULTS);
        data = DEFAULTS;
      }
      return res.status(200).json(data);
    } catch (err) {
      console.error('KV Get Error:', err);
      return res.status(200).json(DEFAULTS); // Fallback
    }
  }

  if (req.method === 'POST') {
    try {
      const payload = req.body;
      if (!payload) return res.status(400).json({ error: 'No data provided' });

      // In a real app, verify authentication here. 
      // For this makerspace, the frontend just passes the entire state.
      await kv.set('wheatstone_data', payload);
      
      return res.status(200).json({ success: true, data: payload });
    } catch (err) {
      console.error('KV Post Error:', err);
      return res.status(500).json({ error: 'Failed to save data' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
};
