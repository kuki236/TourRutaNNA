import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js';
let mapaFamosa;
let capaFamosa = null;
let map;
let puntoPartidaMarker = null;
let rutaLayer = null;
export const ORS_API_KEY = '5b3ce3597851110001cf62486e6c18c68a304e3693fa9d47b76be2c1';
export { mapaFamosa };

const coloresMarcadores = [
  'red', 'blue', 'green', 'orange', 'purple', 'darkred', 'cadetblue', 'darkgreen',
  'darkblue', 'darkpurple', 'pink', 'lightblue', 'lightgreen', 'gray', 'black',
  'beige', 'yellow', 'lightgray', 'brown', 'navy', 'lime', 'teal', 'aqua', 'fuchsia',
  'gold', 'indigo', 'violet', 'coral', 'salmon', 'tomato', 'khaki', 'crimson', 'maroon',
  'olive', 'orchid', 'plum', 'sienna', 'tan', 'turquoise', 'wheat', 'skyblue'
];

export async function trazarRutaORS(origen, destino, dibujar = true) {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car/geojson`;
  const body = {
    coordinates: [
      [origen.lon, origen.lat],
      [destino.lon, destino.lat]
    ]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ORS_API_KEY
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      throw new Error(`Error ${res.status}: No se pudo obtener la ruta.`);
    }

    const data = await res.json();

    if (
      !data ||
      !data.features ||
      data.features.length === 0 ||
      !data.features[0].geometry ||
      !data.features[0].geometry.coordinates
    ) {
      throw new Error("La respuesta no contiene una ruta válida.");
    }

    const coordenadas = data.features[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);

    if (dibujar) {
      L.polyline(coordenadas, { color: 'blue', opacity: 0 }).addTo(map);
    }

    return coordenadas;

  } catch (error) {
    console.error("Error al trazar la ruta:", error.message);
    throw error;
  }
}



export function inicializarMapa() {
  map = L.map('mapa').setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
}


export function mostrarPuntoDePartida(lat, lon) {
  if (puntoPartidaMarker) {
    map.removeLayer(puntoPartidaMarker);
  }

  const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:red; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });

  puntoPartidaMarker = L.marker([lat, lon], { icon: customIcon })
    .addTo(map)
    .bindPopup("Punto de partida")
    .openPopup();

  map.setView([lat, lon], 13);


  map.setView([lat, lon], 13);
}

export async function mostrarRutaOptima(ruta,segmentos=null) {
  if (rutaLayer) {
    map.removeLayer(rutaLayer);
  }

  rutaLayer = L.layerGroup().addTo(map);

  for (let i = 0; i < ruta.length - 1; i++) {
    try {
      const segmento = segmentos && segmentos[i]
        ? segmentos[i]
        : await trazarRutaORS(ruta[i], ruta[i + 1]);

      if (!segmento || segmento.length === 0) {
        throw new Error("Ruta vacía");
      }

      L.polyline(segmento, { color: '#007bff' }).addTo(rutaLayer);
    } catch (error) {
      console.error(`No se pudo calcular la ruta entre ${ruta[i].nombre} y ${ruta[i + 1].nombre}:`, error);
      alert(`No se pudo calcular la ruta entre "${ruta[i].nombre}" y "${ruta[i + 1].nombre}". Puede que no exista una ruta terrestre entre esos puntos.`);
      return;
    }
  }

  ruta.forEach((punto, index) => {
    const popupContent = index === 0 ? `Punto de partida: ${punto.nombre}` : `Destino: ${punto.nombre}`;
    const color = coloresMarcadores[index % coloresMarcadores.length];

    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color:${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10]
    });

    L.marker([punto.lat, punto.lon], { icon: customIcon })
      .bindPopup(popupContent)
      .addTo(rutaLayer);
  
  });

  // Ajusta el zoom al conjunto de puntos
  const coordenadas = ruta.map(p => [p.lat, p.lon]);
  map.fitBounds(L.latLngBounds(coordenadas));

  // Mostrar leyenda
  const leyenda = document.getElementById("leyendaColores");
  leyenda.innerHTML = "<strong>Leyenda de destinos:</strong><br>";
  ruta.forEach((punto, index) => {
    const color = coloresMarcadores[index % coloresMarcadores.length];
    const nombre = index === 0 ? "Punto de partida" : punto.nombre;

    leyenda.innerHTML += `
      <div style="display: flex; align-items: center; gap: 6px; margin: 3px 0;">
        <div style="background-color:${color}; width: 16px; height: 16px; border-radius: 50%; border: 1px solid #000;"></div>
        <span>${nombre}</span>
      </div>
    `;
  });
}
export function inicializarMapaFamosa() {
  if (mapaFamosa) return; 

  mapaFamosa = L.map('mapaFamosa').setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapaFamosa);
}

export async function mostrarRutaFamosa(ruta) {
  if (!mapaFamosa) inicializarMapaFamosa();

  if (capaFamosa) {
    mapaFamosa.removeLayer(capaFamosa);
  }

  capaFamosa = L.layerGroup().addTo(mapaFamosa);

  for (let i = 0; i < ruta.length - 1; i++) {
    try {
      const segmento = await trazarRutaORS(ruta[i], ruta[i + 1]);

      if (!segmento || segmento.length === 0) continue;

      L.polyline(segmento, { color: '#dc3545' }).addTo(capaFamosa);
    } catch (error) {
      console.error("Error en segmento famosa:", error);
    }
  }

  ruta.forEach((punto, index) => {
    const color = coloresMarcadores[index % coloresMarcadores.length];

    const icono = L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color:${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    L.marker([punto.lat, punto.lon], { icon: icono })
      .bindPopup(`${index === 0 ? "Inicio" : "Destino"}: ${punto.nombre}`)
      .addTo(capaFamosa);
  });

  const bounds = L.latLngBounds(ruta.map(p => [p.lat, p.lon]));
  mapaFamosa.fitBounds(bounds);

  const leyenda = document.getElementById("leyendaColoresFamosa");
  leyenda.innerHTML = "<strong>Leyenda de destinos:</strong><br>";
  ruta.forEach((p, i) => {
    leyenda.innerHTML += `
      <div style="display:flex; align-items:center; gap:6px; margin:3px 0;">
        <div style="background-color:${coloresMarcadores[i % coloresMarcadores.length]}; width:16px; height:16px; border-radius:50%; border:1px solid #000;"></div>
        <span>${i === 0 ? "Punto de partida" : p.nombre}</span>
      </div>
    `;
  });
}