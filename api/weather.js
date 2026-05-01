module.exports = async function handler(req, res) {
  const LAT = 51.5115;
  const LON = -0.116;
  // Use HTTPS on the backend, since the server has modern certificates
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe/London&forecast_days=5`;

  try {
    const fetch = (await import("node-fetch")).default || globalThis.fetch;
    const response = await fetch(url);
    const data = await response.json();

    // Set caching headers so we don't hit the API limits
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate");
    return res.status(200).json(data);
  } catch (err) {
    console.error("Weather Proxy Error:", err);
    return res.status(500).json({ error: "Failed to fetch weather" });
  }
};
