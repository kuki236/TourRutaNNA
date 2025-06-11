import * as L from 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js';

let map;
let puntoPartidaMarker = null;
let rutaLayer = null;

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

  puntoPartidaMarker = L.marker([lat, lon])
    .addTo(map)
    .bindPopup("Punto de partida")
    .openPopup();

  map.setView([lat, lon], 13);
}

export function mostrarRutaOptima(ruta) {
  if (rutaLayer) {
    map.removeLayer(rutaLayer);
  }

  rutaLayer = L.layerGroup().addTo(map);

  ruta.forEach((punto, index) => {
    const popupContent = index === 0 ? `Punto de partida: ${punto.nombre}` : `Destino: ${punto.nombre}`;
    L.marker([punto.lat, punto.lon])
      .bindPopup(popupContent)
      .addTo(rutaLayer);
  });

  const coordenadas = ruta.map(punto => [punto.lat, punto.lon]);
  L.polyline(coordenadas, { color: 'red' }).addTo(rutaLayer);

  map.fitBounds(L.latLngBounds(coordenadas));
}