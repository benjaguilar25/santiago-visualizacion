import React, { useState, useEffect } from 'react';
import Map from 'react-map-gl';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, LineLayer } from '@deck.gl/layers';
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core';
import { motion, AnimatePresence } from 'framer-motion';


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

const coloresModo = {
  1: [255, 0, 0],     2: [255, 165, 0],  3: [255, 255, 0],  4: [0, 128, 255],
  5: [0, 255, 255],  6: [138, 43, 226], 7: [128, 0, 128],  8: [34, 139, 34],
  9: [0, 255, 127], 10: [192, 192, 192],11: [0, 100, 0],  12: [128, 128, 0],
 13: [0, 0, 139],   14: [70, 130, 180],15: [255, 20, 147],16: [75, 0, 130],
 17: [255, 105, 180],18: [160, 82, 45]
};

const nombresModo = {
  1: "Auto Chofer",  2: "Bus alimentador",  3: "Bus troncal",  4: "Metro",
  5: "Taxi colectivo",  6: "Furgón escolar (pasajero)",  7: "Taxi o radiotaxi",
  8: "A pie",  9: "Bicicleta", 10: "Motocicleta", 11: "Bus institucional",
 12: "Bus interurbano o rural", 13: "Furgón escolar (chofer o acompañante)",
 14: "Bus urbano con pago al conductor", 15: "Servicio informal",
 16: "Tren", 17: "Auto Acompañante", 18: "Motocicleta Acompañante"
};

const nombresPeriodo = {
  1: 'Punta Mañana 1 (6:01 - 7:30)',
  2: 'Punta Mañana 2 (7:31 - 9:00)',
  3: 'Fuera de Punta 1 (10:01 - 12:00)',
  4: 'Punta Tarde (17:31 - 20:30)',
  5: 'Fuera de Punta 2 (9:01 - 10:00, 12:01 - 17:30, 20:31 - 23:00)',
  6: 'Noche (23:01 - 06:00)'
};

const nombresProposito = {
  1: 'Al trabajo', 2: 'Por trabajo', 3: 'Al estudio', 4: 'Por estudio',
  5: 'De salud', 6: 'Visitar a alguien', 7: 'Volver a casa',
  8: 'Buscar o dejar a alguien', 9: 'Comer o tomar algo',
 10: 'Buscar o dejar algo', 11: 'De compras', 12: 'Trámites',
 13: 'Recreación', 14: 'Otra actividad (especifique)'
};

const nombresTramo = {
  1: 'Menos de 200.000 pesos',
  2: 'Entre 200.001 y 400.000 pesos',
  3: 'Entre 400.001 y 800.000 pesos',
  4: 'Entre 800.001 y 1.600.000 pesos',
  5: 'Entre 1.600.001 y 2.400.000 pesos',
  6: 'Más de 2.400.000 pesos',
  7: 'No contesta'
};

const tramosPosibles = Object.keys(nombresTramo).map(Number);

const App = () => {
  const [buildings, setBuildings] = useState(null);
  const [rutas, setRutas] = useState(null);
  const [modosDisponibles, setModosDisponibles] = useState([]);
  const [modosSeleccionados, setModosSeleccionados] = useState([]);
  const [rutasRealesPorModo, setRutasRealesPorModo] = useState({});
  const [capasDensidad, setCapasDensidad] = useState([]);
  const [periodosSeleccionados, setPeriodosSeleccionados] = useState([1, 2, 3, 4, 5, 6]);
  const [propositosSeleccionados, setPropositosSeleccionados] = useState(Object.keys(nombresProposito).map(Number));
  const [tramosSeleccionados, setTramosSeleccionados] = useState(tramosPosibles);
  const [mostrarFiltroModo, setMostrarFiltroModo] = useState(false);
  const [mostrarFiltroPeriodo, setMostrarFiltroPeriodo] = useState(false);
  const [mostrarFiltroProposito, setMostrarFiltroProposito] = useState(false);
  const [mostrarFiltroTramo, setMostrarFiltroTramo] = useState(false);

  function generarMapaDeTramos(geojson) {
  const tramoCount = {};
  geojson.features.forEach(f => {
    if (!periodosSeleccionados.includes(f.properties.PERIODO)) return;
    if (!propositosSeleccionados.includes(f.properties.PROPOSITO)) return;
    if (!tramosSeleccionados.includes(f.properties.TRAMOINGRESOFINAL)) return;
    const geometria = f.geometry;
    if (!geometria || !geometria.coordinates) return;

    const tipo = geometria.type;
    const segmentos = tipo === 'LineString'
      ? [geometria.coordinates]
      : tipo === 'MultiLineString'
        ? geometria.coordinates
        : [];

    segmentos.forEach(linea => {
      for (let i = 0; i < linea.length - 1; i++) {
        const p1 = linea[i];
        const p2 = linea[i + 1];

        if (!p1 || !p2 || p1.length < 2 || p2.length < 2) continue;

        const key = `${p1[0].toFixed(5)},${p1[1].toFixed(5)}->${p2[0].toFixed(5)},${p2[1].toFixed(5)}`;
        const reverseKey = `${p2[0].toFixed(5)},${p2[1].toFixed(5)}->${p1[0].toFixed(5)},${p1[1].toFixed(5)}`;
        const finalKey = tramoCount[reverseKey] !== undefined ? reverseKey : key;
        tramoCount[finalKey] = (tramoCount[finalKey] || 0) + 1;
      }
    });
  });
  return tramoCount;
}

  function generarLineLayerDesdeTramos(tramoCount, baseColor, modo) {
    const tramos = Object.entries(tramoCount).map(([key, count]) => {
      const [p1, p2] = key.split('->');
      const [lon1, lat1] = p1.split(',').map(Number);
      const [lon2, lat2] = p2.split(',').map(Number);
      const altura = count * 5;
      return {
        sourcePosition: [lon1, lat1, altura],
        targetPosition: [lon2, lat2, altura],
        count
      };
    });

    return new LineLayer({
      id: `lineas-elevadas-densidad-${modo}`,
      data: tramos,
      getSourcePosition: d => d.sourcePosition,
      getTargetPosition: d => d.targetPosition,
      getColor: d => {
        const base = baseColor || [128, 128, 128];
        const factor = Math.min(d.count / 10, 1);
        return base.map(c => Math.min(255, Math.round(c * (0.4 + 0.6 * factor))));
      },
      getWidth: d => Math.sqrt(d.count) + 0.5,
      pickable: false,
      opacity: 0.8,
    });
  }

  useEffect(() => {
    fetch('/ciudad/export.geojson').then(res => res.json()).then(setBuildings);
    fetch('/rutas_por_modo.geojson')
      .then(res => res.json())
      .then(data => {
        setRutas(data);
        const modos = Array.from(new Set(data.features.map(f => f.properties.modo))).sort((a, b) => a - b);
        setModosDisponibles(modos);
        setModosSeleccionados([1]);
      });
  }, []);

  useEffect(() => {
    modosDisponibles.forEach(async modo => {
      try {
        const res = await fetch(`/rutas_reales/rutas_reales_modo_${modo}.geojson`);
        const data = await res.json();
        setRutasRealesPorModo(prev => ({ ...prev, [modo]: data }));
      } catch (err) {}
    });
  }, [modosDisponibles]);

  useEffect(() => {
    const nuevasCapas = [];
    modosSeleccionados.forEach(modo => {
      const datosModo = rutasRealesPorModo[modo];
      if (!datosModo) return;
      const mapaTramos = generarMapaDeTramos(datosModo);
      const capa = generarLineLayerDesdeTramos(mapaTramos, coloresModo[modo], modo);
      nuevasCapas.push(capa);
    });
    setCapasDensidad(nuevasCapas);
  }, [modosSeleccionados, rutasRealesPorModo, periodosSeleccionados, propositosSeleccionados, tramosSeleccionados]);

  const handleModoToggle = (modo) => {
    setModosSeleccionados(prev =>
      prev.includes(modo) ? prev.filter(m => m !== modo) : [...prev, modo]
    );
  };

  const toggleTodos = () => {
    if (modosSeleccionados.length === modosDisponibles.length) {
      setModosSeleccionados([]);
    } else {
      setModosSeleccionados(modosDisponibles);
    }
  };

  const toggleTodosPeriodos = () => {
    const todos = Object.keys(nombresPeriodo).map(Number);
    if (periodosSeleccionados.length === todos.length) {
      setPeriodosSeleccionados([]);
    } else {
      setPeriodosSeleccionados(todos);
    }
  };

  const handlePeriodoToggle = (periodo) => {
    setPeriodosSeleccionados(prev =>
      prev.includes(periodo) ? prev.filter(p => p !== periodo) : [...prev, periodo]
    );
  };

  const toggleTodosPropositos = () => {
    const todos = Object.keys(nombresProposito).map(Number);
    setPropositosSeleccionados(prev => prev.length === todos.length ? [] : todos);
  };

  const handlePropositoToggle = (p) => {
    setPropositosSeleccionados(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const toggleTodosTramos = () => {
    setTramosSeleccionados(prev => prev.length === tramosPosibles.length ? [] : tramosPosibles);
  };

  const handleTramoToggle = (tramo) => {
    setTramosSeleccionados(prev =>
      prev.includes(tramo) ? prev.filter(x => x !== tramo) : [...prev, tramo]
    );
  };

  const layers = [...capasDensidad];

  if (buildings) {
    layers.push(new GeoJsonLayer({
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
    }));
  }

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <div style={{ color: 'black', position: 'absolute', bottom: 10, left: 10, zIndex: 1, background: 'white', padding: '10px', maxHeight: '90vh', overflowY: 'auto', width: '300px' }}>
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setMostrarFiltroModo(!mostrarFiltroModo)}>
          <strong style={{ flex: 1 }}>Filtrar por medio de transporte</strong>
          <span>{mostrarFiltroModo ? '▼' : '▶'}</span>
        </div>
        <AnimatePresence>
          {mostrarFiltroModo && (
            <motion.div
              key="modo"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <label style={{ display: 'block', marginBottom: '5px' }}>
                <input type="checkbox" checked={modosSeleccionados.length === modosDisponibles.length} onChange={toggleTodos} />
                {modosSeleccionados.length === modosDisponibles.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </label>
              {modosDisponibles.map(m => (
                <label key={m} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <input type="checkbox" checked={modosSeleccionados.includes(m)} onChange={() => handleModoToggle(m)} />
                  <span style={{ width: 12, height: 12, marginLeft: 6, marginRight: 6, backgroundColor: `rgb(${coloresModo[m].join(',')})`, display: 'inline-block' }}></span>
                  {nombresModo[m] || `Modo ${m}`}
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <hr style={{ margin: '10px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setMostrarFiltroPeriodo(!mostrarFiltroPeriodo)}>
          <strong style={{ flex: 1 }}>Filtrar por horario</strong>
          <span>{mostrarFiltroPeriodo ? '▼' : '▶'}</span>
        </div>
        <AnimatePresence>
          {mostrarFiltroPeriodo && (
            <motion.div
              key="periodo"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <label style={{ display: 'block', marginBottom: '5px' }}>
                <input type="checkbox" checked={periodosSeleccionados.length === Object.keys(nombresPeriodo).length} onChange={toggleTodosPeriodos} />
                {periodosSeleccionados.length === Object.keys(nombresPeriodo).length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </label>
              {Object.entries(nombresPeriodo).map(([id, label]) => (
                <label key={id} style={{ display: 'block', marginBottom: '4px' }}>
                  <input type="checkbox" checked={periodosSeleccionados.includes(Number(id))} onChange={() => handlePeriodoToggle(Number(id))} /> {label}
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <hr style={{ margin: '10px 0' }} />

        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setMostrarFiltroProposito(!mostrarFiltroProposito)}>
        <strong style={{ flex: 1 }}>Filtrar por propósito de viaje</strong>
        <span>{mostrarFiltroProposito ? '▼' : '▶'}</span>
      </div>
      <AnimatePresence>
        {mostrarFiltroProposito && (
          <motion.div
            key="proposito"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <label style={{ display: 'block', marginBottom: '5px' }}>
              <input
                type="checkbox"
                checked={propositosSeleccionados.length === Object.keys(nombresProposito).length}
                onChange={toggleTodosPropositos}
              />
              {propositosSeleccionados.length === Object.keys(nombresProposito).length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </label>
            {Object.entries(nombresProposito).map(([id, label]) => (
              <label key={id} style={{ display: 'block', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  checked={propositosSeleccionados.includes(Number(id))}
                  onChange={() => handlePropositoToggle(Number(id))}
                /> {label}
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <hr style={{ margin: '10px 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setMostrarFiltroTramo(!mostrarFiltroTramo)}>
        <strong style={{ flex: 1 }}>Filtrar por ingreso salarial</strong>
        <span>{mostrarFiltroTramo ? '▼' : '▶'}</span>
      </div>
      <AnimatePresence>
        {mostrarFiltroTramo && (
          <motion.div
            key="tramo"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <label style={{ display: 'block', marginBottom: '5px' }}>
              <input
                type="checkbox"
                checked={tramosSeleccionados.length === tramosPosibles.length}
                onChange={toggleTodosTramos}
              />
              {tramosSeleccionados.length === tramosPosibles.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </label>
            {tramosPosibles.map(id => (
              <label key={id} style={{ display: 'block', marginBottom: '4px' }}>
                <input
                  type="checkbox"
                  checked={tramosSeleccionados.includes(id)}
                  onChange={() => handleTramoToggle(id)}
                /> {nombresTramo[id]}
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      </div>
      <DeckGL
        effects={[lightingEffect]}
        initialViewState={{ longitude: -70.64827, latitude: -33.45694, zoom: 12.5, pitch: 45, bearing: -20 }}
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
    </div>
  );
};

export default App;
