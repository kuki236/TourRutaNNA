import { mostrarPuntoDePartida, mostrarRutaOptima, trazarRutaORS, ORS_API_KEY } from './mapas.js';



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
      document.getElementById("alerta").classList.remove("oculta");
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
    document.getElementById("alerta").classList.add("oculta");
    document.getElementById("floatingInput").value = "";
  } catch (err) {
    console.error("Error al buscar punto de partida:", err);
    document.getElementById("alerta").classList.remove("oculta");
  }
}


async function obtenerDistanciasMatrix(puntoActual, noVisitados) {
  const url = `https://api.openrouteservice.org/v2/matrix/driving-car`;
  const body = {
    locations: [
      [puntoActual.lon, puntoActual.lat],
      ...noVisitados.map(destino => [destino.lon, destino.lat])
    ],
    metrics: ['distance'],
    units: 'km'
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
      throw new Error(`Error ${res.status}: No se pudo obtener la matriz de distancias.`);
    }

    const data = await res.json();
    return data.distances[0].slice(1); // Distancias desde puntoActual a noVisitados
  } catch (error) {
    console.error("Error en la matriz de distancias:", error.message);
    throw error;
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
    try {
      const distancias = await obtenerDistanciasMatrix(actual, noVisitados);
      let menorDistancia = Infinity;
      let destinoMasCercano = null;
      let indiceCercano = -1;

      distancias.forEach((distancia, index) => {
        if (distancia !== null && distancia < menorDistancia) {
          menorDistancia = distancia;
          destinoMasCercano = noVisitados[index];
          indiceCercano = index;
        }
      });

      if (destinoMasCercano) {
        // Verificar conexión con trazarRutaORS solo para el destino más cercano
        await trazarRutaORS(actual, destinoMasCercano, false);
        ruta.push(destinoMasCercano);
        actual = destinoMasCercano;
        noVisitados.splice(indiceCercano, 1);
      } else {
        // No hay destinos conectables
        destinosOmitidos.push(...noVisitados);
        noVisitados = [];
      }
    } catch (error) {
      console.warn("Error al calcular distancias o conectar destinos:", error.message);
      destinosOmitidos.push(...noVisitados);
      noVisitados = [];
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

  if (destinosOmitidos.length > 0) {
    const alertaConexion = document.getElementById("alertaConexion");
    if (alertaConexion) {
      alertaConexion.classList.remove("oculta");
      alertaConexion.innerHTML = `
        <strong>¡Atención!</strong> Se eliminaron los siguientes destinos porque no tienen ruta disponible:<br>
        ${destinosOmitidos.map(d => d.nombre).join(", ")}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      setTimeout(() => {
        alertaConexion.classList.add("oculta");
      }, 6000);
    }
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