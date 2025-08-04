# Santiago de Chile - Proyecto de Visualización de Movilidad
### Ramo: Visualización de Información CC5208

Este proyecto es una visualización interactiva de rutas de transporte en Santiago de Chile. Utiliza tecnologías como Deck.gl, Mapbox, Overpass Turbo y React para mostrar rutas en 3D con múltiples filtros: método de transporte, periodo del día, propósito del viaje y tramo de ingreso del hogar. Esta visualización, además, muestra según la extensión del eje Z la frecuencia con la que se circulan ciertos tramos de la ciudad. 

---

## Tecnologías utilizadas

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Deck.gl](https://deck.gl/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Framer Motion](https://www.framer.com/motion/) para animaciones
- [React Map GL](https://visgl.github.io/react-map-gl/)
- GeoJSON para datos espaciales

---

## Instalación

```bash
git clone https://github.com/benjaguilar25/santiago-visualizacion.git
cd santiago-visualizacion
npm install
```

Además, es necesario extraer el archivo `data.zip` contenido en `/public/ciudad` para obtener el archivo `export.geojson` y ver las figuras 3D de edificios y construcciones dentro de la ciudad. 

```bash
cd public/ciudad
unzip data.zip
```

_Nota:_ Este archivo no fue subido directamente al repositorio pues pesaba demasiado. 

---

## Ejecución del proyecto

```bash
npm run dev
```

Abre tu navegador en: [http://localhost:5173](http://localhost:5173)

---

## Datos esperados

El proyecto requiere ciertos archivos GeoJSON disponibles en la carpeta `public/`:

- `public/rutas_por_modo.geojson` — Rutas generales por modo
- `public/ciudad/export.geojson` — Edificios para extrusión 3D
- `public/rutas_reales/rutas_reales_modo_X.geojson` — Rutas reales por método de transporte (X = 1 al 18)
- `public/themes/` — Temas visuales

Quedó pendiente implementar un mapa de calor por frecuencia de traslado en zonas de Santiago según el archivo:

- `public/zonas/zonas_santiago.geojson` — Zonas geográficas obtenidas de encuesta Origen-Destino

---

## Filtros implementados

Todos los filtros incluyen paneles colapsables con selección múltiple:

- **Método de transporte** (1 al 18)
- **Horario del día** (6 horarios)
- **Propósito del viaje** (14 categorías)
- **Tramo ingreso salarial** (7 niveles socioeconómicos)

---

## Controles del mapa

- Mover mapa: clic izquierdo
- Zoom: scroll o doble clic
- Girar en 3D: clic derecho + arrastrar o CTRL + clic izquierdo + arrastrar

---

## Mapbox

Este proyecto requiere un token de acceso de Mapbox. Se puede obtener uno en: [https://account.mapbox.com](https://account.mapbox.com)

Eso si, en este proyecto está importado directamente en el código fuente, por lo que se puede usar sin problemas. 

---

## Recolección de datos

Los datos fueron recolectados de la Encuesta Origen-Destino efectuada por SECTRA, donde se descargó una base de datos de Microsoft Access con múltiples tablas con estructuras irregulares de información de viajes y variables externas. A pesar de lo anterior, se procesaron las tablas mediante librerías de Python para obtener rutas directas de origen-destino según coordenadas. 

Posteriormente, estas rutas directas fueron procesadas a través de la API de MapBox para establecer rutas reales de recorrido según el tipo de movilidad (_driving_, _walking_, _cycling_), logrando generar mapas complejos que muestren la realidad del movimiento en Santiago a través de las calles. Para rutas como Metro y Tren, se utilizó la API de Overpass Turbo para descargar rutas reales de Metro y Tren en Santiago, para luego homologarlas con el recorrido origen-destino obtenido de la base de datos de SECTRA. 

Ref: https://drive.google.com/file/d/193675NwL6QNDs6VJFHU0mXiX5-6SdBPJ/view
