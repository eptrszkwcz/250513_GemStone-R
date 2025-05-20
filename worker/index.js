export default {
  async fetch(request, env, ctx) {
    if (request.method === 'POST' && new URL(request.url).pathname === '/route') {
      const body = await request.json();
      const orsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

      const response = await fetch(orsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': env.ORS_API_KEY
        },
        body: JSON.stringify(body)
      });

      return new Response(await response.text(), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response("Not found", { status: 404 });
  }
};
