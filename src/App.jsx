import React, { useState, useEffect } from 'react';
import Map from 'react-map-gl';
//import StaticMap from 'react-map-gl/static';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, ArcLayer } from '@deck.gl/layers';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmVuamFndWlsYXIyNSIsImEiOiJjbWRtb3hhZm0wN2pvMmlweTZ0N2FveHozIn0.wUCqRFK0mnLyDqj_v66LVQ'; // Crea cuenta en mapbox.com

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
        getElevation: f => {
          const heightStr = f.properties.height;
          const height = parseFloat(heightStr);
          if (!isNaN(height)) return height;
        
          const levelsStr = f.properties['building:levels'];
          const levels = parseInt(levelsStr);
          return isNaN(levels) ? 10 : levels * 3; // altura estimada 3m por piso
        },
        getFillColor: f => {
          let height = parseFloat(f.properties.height);
          if (isNaN(height)) {
            const levels = parseInt(f.properties['building:levels']);
            height = isNaN(levels) ? 10 : levels * 3;
          }
        
          if (height < 9) return [72, 68, 61, 255];     // cafe oscuro
          if (height < 15) return [151, 144, 138, 255];      // beige
          if (height < 80) return [215, 233, 225, 255];    // amarillento
          return [206, 234, 255, 255];                       // celeste
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
      mapStyle="mapbox://styles/mapbox/light-v10"
      reuseMaps
      preserveDrawingBuffer
    />
    </DeckGL>
  );
};

export default App;
