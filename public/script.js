mapboxgl.accessToken = 'pk.eyJ1IjoicHRyc3prd2N6IiwiYSI6ImNpdHVuOXpqMzAwMmEybnF2anZwbTd4aWcifQ.MF8M3qBg0AEp_-10FB4juw';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ptrszkwcz/cm1ahogdf02cx01pb0ohg3r1k',
  center: [46.2694, -20.6623],
  zoom: 7,
  projection: 'mercator'
});

const sheetId = '1cIHZJWeTIKHSRevKZQvNe0NiNygHvMY8j7uxHzu69uU';
const sheetName = 'Sheet1';
const sheetUrl = `https://opensheet.vercel.app/${sheetId}/${sheetName}`;

async function getRoadRoute(start, end) {
  const body = {
    coordinates: [start, end],
    instructions: false
  };

  // const response = await fetch('http://localhost:3000/route?geometry_format=geojson', {
  const response = await fetch('https://route-api.eptrszkwcz.workers.dev/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch route: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

const points = [];
const pointFeatures = [];

async function loadPointsAndRoutes() {
  const response = await fetch(sheetUrl);
  const data = await response.json();

  data.forEach(row => {
    const lat = parseFloat(row.lat);
    const lon = parseFloat(row.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      const coords = [lon, lat];
      points.push(coords);

      pointFeatures.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coords
        },
        properties: {
          name: row.name || "Unnamed"
        }
      });
    }
  });

  if (points.length < 2) {
    console.warn("Need at least two points to build a route.");
    return { type: "FeatureCollection", features: [] };
  }

  const routeFeatures = [];

  for (let i = 0; i < points.length - 1; i++) {
    try {
      const routeGeojson = await getRoadRoute(points[i], points[i + 1]);
      if (routeGeojson?.features?.[0]) {
        routeFeatures.push({
          type: "Feature",
          geometry: routeGeojson.features[0].geometry,
          properties: { segment: `${i + 1} → ${i + 2}` }
        });
      } else {
        console.warn(`Unexpected response for segment ${i + 1} → ${i + 2}`, routeGeojson);
      }
    } catch (err) {
      console.error(`Failed to fetch route ${i + 1} → ${i + 2}`, err);
    }
  }

  return {
    type: "FeatureCollection",
    features: routeFeatures
  };
}

map.on('load', async () => {
  const routesGeojson = await loadPointsAndRoutes();

  // Add route layer
  map.addSource('routes', {
    type: 'geojson',
    data: routesGeojson
  });

  map.addLayer({
    id: 'routes-layer',
    type: 'line',
    source: 'routes',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#0DDCC1',
      'line-opacity': 0.75,
      'line-width': 1
    }
  });

  // Add point layer
  const pointGeojson = {
    type: "FeatureCollection",
    features: pointFeatures
  };

  map.addSource('locations', {
    type: 'geojson',
    data: pointGeojson
  });

  map.addLayer({
    id: 'points',
    type: 'circle',
    source: 'locations',
    paint: {
      'circle-radius': 3,
      'circle-color': '#0DDCC1',
      'circle-stroke-width': 3,
      'circle-stroke-color': "#1D212D"
    }
  });

  map.addLayer({
    id: 'point-labels',
    type: 'symbol',
    source: 'locations',
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Open Sans Medium', 'Arial Unicode MS Bold'],
      'text-size': 15,
      'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
      'text-radial-offset': 0.8,
      'text-justify': 'auto',
      'symbol-placement': 'point',
      'text-allow-overlap': false,
      'text-ignore-placement': false
    },
    paint: {
      'text-color': '#0DDCC1',
      'text-halo-color': '#1D212D',
      'text-halo-width': 1,
      'text-halo-blur': 1,
      'text-opacity': 1
    }
  });

  // Zoom to all features
  const bounds = new mapboxgl.LngLatBounds();

  points.forEach(coord => bounds.extend(coord));
  routesGeojson.features.forEach(f => {
    if (f.geometry?.type === "LineString") {
      f.geometry.coordinates.forEach(c => bounds.extend(c));
    }
  });

  map.fitBounds(bounds, { padding: 30 });
});

// Screenshot functionality
document.getElementById('screenshotBtn').addEventListener('click', () => {
  const canvas = map.getCanvas();

  map.once('render', () => {
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'map-screenshot.png';
    link.click();
  });

  map.triggerRepaint();
});
