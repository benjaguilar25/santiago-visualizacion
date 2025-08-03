// pk.eyJ1IjoiYmVuamFndWlsYXIyNSIsImEiOiJjbWRtb3hhZm0wN2pvMmlweTZ0N2FveHozIn0.wUCqRFK0mnLyDqj_v66LVQ

import React, { useState, useEffect } from 'react';
import Map from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, ArcLayer, ScatterplotLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmVuamFndWlsYXIyNSIsImEiOiJjbWRtb3hhZm0wN2pvMmlweTZ0N2FveHozIn0.wUCqRFK0mnLyDqj_v66LVQ';

const ambientLight = new AmbientLight({ color: [255, 255, 255], intensity: 0.7 });
const directionalLight = new DirectionalLight({ color: [255, 255, 255], direction: [-5, 5, -10], intensity: 1.2 });
const lightingEffect = new LightingEffect({ ambientLight, directionalLight });

const material = {
  ambient: 0.2,
  diffuse: 0.8,
  shininess: 5,
  specularColor: [50, 50, 50]
};

const App = () => {
  const [buildings, setBuildings] = useState(null);
  const [movements, setMovements] = useState(null);
  const [zonas, setZonas] = useState(null);

  useEffect(() => {
    fetch('/export.geojson').then(res => res.json()).then(setBuildings);
    fetch('/movimientos.json').then(res => res.json()).then(setMovements);
    fetch('/zonas_santiago_centroides_ficticios_latlon.geojson')
      .then(res => res.json())
      .then(data => {
        console.log('Zonas cargadas:', data.features.length);
        console.log('Tipo geom:', data.features[0].geometry.type);
        console.log(data.features.slice(0, 5).map(f => f.geometry.coordinates));
        console.log('Primeros pesos:', data.features.slice(0, 5).map(f => f.properties.viajes));
        setZonas(data);
      });
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
          if (height < 9) return [150, 138, 126, 255];
          if (height < 15) return [220, 210, 200, 255];
          if (height < 80) return [211, 230, 212, 255];
          return [220, 231, 231, 255];
        },
        pickable: true
      })
    );
  }

  if (zonas) {
    layers.push(
      new HeatmapLayer({
        id: 'heatmap-viajes',
        data: zonas,
        getPosition: d => d.geometry.coordinates,
        getWeight: d => d.properties.viajes || 1,
        radiusPixels: 40,
        intensity: 4,
        threshold: 0,
        colorRange: [
          [255, 255, 204],
          [255, 237, 160],
          [254, 217, 118],
          [254, 178, 76],
          [253, 141, 60],
          [240, 59, 32]
        ],
        pickable: true
      })
    );

    layers.push(
      new ScatterplotLayer({
        id: 'debug-puntos-zonas',
        data: zonas,
        getPosition: d => d.geometry.coordinates,
        getRadius: 30,
        getFillColor: [255, 0, 0],
        radiusMinPixels: 2,
        radiusMaxPixels: 10
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
        bearing: -20
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
