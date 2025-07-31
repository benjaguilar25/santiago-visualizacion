// pk.eyJ1IjoiYmVuamFndWlsYXIyNSIsImEiOiJjbWRtb3hhZm0wN2pvMmlweTZ0N2FveHozIn0.wUCqRFK0mnLyDqj_v66LVQ

import React, { useState, useEffect } from 'react';
import Map from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, ArcLayer } from '@deck.gl/layers';
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmVuamFndWlsYXIyNSIsImEiOiJjbWRtb3hhZm0wN2pvMmlweTZ0N2FveHozIn0.wUCqRFK0mnLyDqj_v66LVQ'; // Reemplazá con tu token real

// 💡 Iluminación más balanceada
const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 0.7 // más luz pareja
});

const directionalLight = new DirectionalLight({
  color: [255, 255, 255],
  direction: [-5, 5, -10], // luz desde el costado
  intensity: 1.2
});

const lightingEffect = new LightingEffect({ ambientLight, directionalLight });

// 🧱 Material con sombreado suave
const material = {
  ambient: 0.2,
  diffuse: 0.8,
  shininess: 5,
  specularColor: [50, 50, 50] // para que el brillo no lo aplane
};
/*const material = {
  ambient: 0.3,
  diffuse: 0.7,
  shininess: 8,
  specularColor: [100, 100, 100]
};*/

const App = () => {
  const [buildings, setBuildings] = useState(null);
  const [movements, setMovements] = useState(null);

  useEffect(() => {
    fetch('/export.geojson').then(res => res.json()).then(setBuildings);
    fetch('/movimientos.json').then(res => res.json()).then(setMovements);
  }, []);

  const layers = [];

  if (buildings) {
    layers.push(
      new GeoJsonLayer({
        id: 'buildings',
        data: buildings,
        extruded: true,
        material: material,
        getElevation: f => {
          const heightStr = f.properties.height;
          const height = parseFloat(heightStr);
          if (!isNaN(height)) return height;

          const levelsStr = f.properties['building:levels'];
          const levels = parseInt(levelsStr);
          return isNaN(levels) ? 10 : levels * 3;
        },
        getFillColor: f => {
          let height = parseFloat(f.properties.height);
          if (isNaN(height)) {
            const levels = parseInt(f.properties['building:levels']);
            height = isNaN(levels) ? 10 : levels * 3;
          }

          // 🎨 Colores claros para permitir volumen por sombreado
          if (height < 9) return [150, 138, 126, 255];     // cafe oscuro
          if (height < 15) return [220, 210, 200, 255];      // beige
          if (height < 80) return [211, 230, 212, 255];    // amarillento
          return [220, 231, 231, 255];                 // casi blanco
        },
        pickable: true
      })
    );
  }

  if (movements) {
    layers.push(
      new ArcLayer({
        id: 'movement',
        data: movements,
        getSourcePosition: d => d.source,
        getTargetPosition: d => d.target,
        getSourceColor: [255, 140, 0],
        getTargetColor: [0, 255, 0],
        getWidth: d => Math.sqrt(d.count),
        pickable: true
      })
    );
  }

  return (
    <DeckGL
      effects={[lightingEffect]}
      initialViewState={{
        longitude: -70.64827,
        latitude: -33.45694,
        zoom: 12.5,
        pitch: 45,
        bearing: -20,
      }}
      controller={true}
      layers={layers}
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        reuseMaps
        preserveDrawingBuffer
      />
    </DeckGL>
  );
};

export default App;
