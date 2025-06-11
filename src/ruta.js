import { mostrarPuntoDePartida, mostrarRutaOptima } from './mapas.js';

let puntoPartida = null;
let destinos = [];

export function inicializarRuta() {
  document.getElementById("cartaOptima").style.display = "none"; 
}

export async function manejarPuntoPartida(lugar) {
  if (!lugar) {
    alert("Por favor, ingresa un punto de partida.");
    return;
  }

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(lugar)}`);
    const data = await res.json();
    if (!data.length) {
      document.getElementById("alerta").classList.remove("oculto");
      return;
    }

    const { lat, lon } = data[0];
    puntoPartida = { nombre: lugar, lat: parseFloat(lat), lon: parseFloat(lon) };
    mostrarPuntoDePartida(puntoPartida.lat, puntoPartida.lon);
    document.getElementById("alerta").classList.add("oculto");
    document.getElementById("floatingInput").value = "";
  } catch (err) {
    console.error("Error al buscar punto de partida:", err);
    document.getElementById("alerta").classList.remove("oculto");
  }
}

export function calcularRutaOptima(listaDestinos = null) {
  if (listaDestinos) {
    destinos = listaDestinos.map(li => ({
      nombre: li.querySelector("span").textContent,
      lat: parseFloat(li.dataset.lat),
      lon: parseFloat(li.dataset.lon)
    }));
  }

  if (!puntoPartida) {
    alert("Por favor, selecciona un punto de partida.");
    return;
  }
  if (destinos.length < 1) {
    alert("Añade al menos un destino.");
    return;
  }
// Implementación del Algoritmo del Vecino Más Cercano 
// para construir una ruta óptima visitando los destinos en el orden del más cercano.
  const ruta = [puntoPartida];
  let noVisitados = [...destinos];
  let actual = puntoPartida;

  while (noVisitados.length > 0) {
    let menorDistancia = Infinity;
    let destinoMasCercano = null;
    let indiceCercano = -1;

    noVisitados.forEach((destino, index) => {
      const distancia = calcularDistancia(
        actual.lat,
        actual.lon,
        destino.lat,
        destino.lon
      );
      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        destinoMasCercano = destino;
        indiceCercano = index;
      }
    });

    ruta.push(destinoMasCercano);
    actual = destinoMasCercano;
    noVisitados.splice(indiceCercano, 1);
  }


  const texto = `${ruta.map(d => d.nombre).join(" → ")}`;
  document.getElementById("textoRuta").textContent = texto;
  document.getElementById("cartaOptima").style.display = "block";

  const rutaConNombres = ruta.map(d => ({
    lat: d.lat,
    lon: d.lon,
    nombre: d.nombre
  }));
  mostrarRutaOptima(rutaConNombres); 
}


function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}