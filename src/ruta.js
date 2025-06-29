import { mostrarPuntoDePartida, mostrarRutaOptima,mostrarRutaFamosa, trazarRutaORS, ORS_API_KEY } from './mapas.js';

let puntoPartida = null;
let destinos = [];

export function inicializarRuta() {
  document.getElementById("cartaOptima").style.display = "none"; 
}

export function establecerPuntoPartida(nuevoPunto) {
  puntoPartida = nuevoPunto;
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
// NNA - Nearest Neighbor Algorithm
export async function calcularRutaOptima(listaDestinos = null, esFamosa = false) {
if (listaDestinos) {
  destinos = listaDestinos.map(li => {
    if (li.dataset) {
      return {
        nombre: li.dataset.nombre,
        lat: parseFloat(li.dataset.lat),
        lon: parseFloat(li.dataset.lon)
      };
    } else {
      return li;
    }
  });
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
  const segmentos = [];


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
        const segmento = await trazarRutaORS(actual, destinoMasCercano, false);
        segmentos.push(segmento);
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
    const rutaConNombres = ruta.map(d => ({
      lat: d.lat,
      lon: d.lon,
      nombre: d.nombre
    }));

    if (esFamosa) {
      document.getElementById("textoRutaFamosa").textContent = texto;
      document.getElementById("cartaOptimaFamosa").style.display = "block";
      document.getElementById("seccionResultado").classList.add("oculta");
      document.getElementById("seccionRutasFamosas").classList.add("oculta");
      document.getElementById("mapaRutaFamosa").classList.remove("oculta");
      mostrarRutaFamosa(rutaConNombres);
    } else {
      document.getElementById("textoRuta").textContent = texto;
      document.getElementById("cartaOptima").style.display = "block";
      mostrarRutaOptima(rutaConNombres);
    }

  
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