// export default {
//   async fetch(request, env, ctx) {
//     if (request.method === 'POST' && new URL(request.url).pathname === '/route') {
//       const body = await request.json();
//       const orsUrl = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';

//       const response = await fetch(orsUrl, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': env.ORS_API_KEY
//         },
//         body: JSON.stringify(body)
//       });

//       return new Response(await response.text(), {
//         status: response.status,
//         headers: { 'Content-Type': 'application/json' }
//       });
//     }

//     return new Response("Not found", { status: 404 });
//   }
// };

export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
  
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*', // Or restrict to your frontend origin
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
          }
        });
      }
  
      // Handle your POST /route endpoint
      if (request.method === 'POST' && url.pathname === '/route') {
        try {
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
  
          // Pass through the ORS response with CORS headers
          return new Response(await response.text(), {
            status: response.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*', // Or your frontend origin here
            }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          });
        }
      }
  
      return new Response("Not found", { status: 404 });
    }
  };
  