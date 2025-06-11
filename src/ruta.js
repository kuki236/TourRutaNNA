import { mostrarPuntoDePartida, mostrarRutaOptima, trazarRutaORS  } from './mapas.js';

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

    const { lat, lon, display_name } = data[0];
    const nombreCorto = display_name.split(",")[0];

    puntoPartida = {
      nombre: nombreCorto,
      lat: parseFloat(lat),
      lon: parseFloat(lon)
    };

    mostrarPuntoDePartida(puntoPartida.lat, puntoPartida.lon);
    document.getElementById("alerta").classList.add("oculto");
    document.getElementById("floatingInput").value = "";
  } catch (err) {
    console.error("Error al buscar punto de partida:", err);
    document.getElementById("alerta").classList.remove("oculto");
  }
}


export async function calcularRutaOptima(listaDestinos = null) {
  if (listaDestinos) {
    destinos = listaDestinos.map(li => ({
      nombre: li.dataset.nombre,
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

  const ruta = [puntoPartida];
  let noVisitados = [...destinos];
  let actual = puntoPartida;
  const destinosOmitidos = [];

  while (noVisitados.length > 0) {
    let menorDistancia = Infinity;
    let destinoMasCercano = null;
    let indiceCercano = -1;

    for (let index = 0; index < noVisitados.length; index++) {
      const destino = noVisitados[index];
      try {
        await trazarRutaORS(actual, destino, false); // solo prueba de conexión

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
      } catch (e) {
        console.warn(`No se pudo conectar con ${destino.nombre}. Eliminando de la lista.`);

        // Elimina del DOM
        const li = document.querySelector(
          `#listaDestinos li[data-nombre="${destino.nombre}"]`
        );
        if (li) li.remove();

        // Elimina del array de destinos general
        destinos = destinos.filter(d => d.nombre !== destino.nombre);
        noVisitados.splice(index, 1);
        index--; // retrocede porque quitaste un elemento

        // Guarda en lista de omitidos
        destinosOmitidos.push(destino);
      }
    }

    if (destinoMasCercano) {
      ruta.push(destinoMasCercano);
      actual = destinoMasCercano;
      noVisitados.splice(indiceCercano, 1);
    } else {
      // No se encontró ningún destino conectable desde el actual
      break;
    }
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

  // Mostrar alerta visual si hubo destinos omitidos
  if (destinosOmitidos.length > 0) {
    if (alertaConexion) {
      alertaConexion.classList.remove("oculto");
      alertaConexion.innerHTML = `
        <strong>¡Atención!</strong> Se eliminó el siguiente destino porque no tiene ruta disponible:<br>
        ${destinosOmitidos.map(d => d.nombre).join(", ")}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
    }

    setTimeout(() => {
      if (alertaConexion) {
        alertaConexion.classList.add("oculto");
      }
    }, 6000);
  }
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