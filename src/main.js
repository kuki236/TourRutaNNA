import { inicializarDestinos } from './destinos.js';
import { inicializarMapa, mostrarRutaFamosa, inicializarMapaFamosa, mapaFamosa } from './mapas.js';

import { inicializarRuta, manejarPuntoPartida, calcularRutaOptima, establecerPuntoPartida } from './ruta.js';

document.addEventListener("DOMContentLoaded", () => {
    inicializarMapa();
    inicializarRuta();
    inicializarMapaFamosa();
    inicializarDestinos((listaDestinos) => {
        calcularRutaOptima(listaDestinos);
    });

    const btnEmpezar = document.getElementById("btnEmpezar");
    btnEmpezar.addEventListener("click", () => {
        const lugar = document.getElementById("floatingInput").value.trim();
        manejarPuntoPartida(lugar);
    });

    // Manejar botón "Ver Rutas Famosas"
    const btnRutasFamosas = document.querySelector(".btn-warning");
    const seccionRutasFamosas = document.getElementById("seccionRutasFamosas");
    let rutas = [];

    btnRutasFamosas.addEventListener("click", () => {
        seccionRutasFamosas.classList.remove("oculta");
        if (!seccionRutasFamosas.dataset.loaded) {
            cargarRutasFamosas();
            seccionRutasFamosas.dataset.loaded = true;
        }
    });

    function cargarRutasFamosas() {
        Papa.parse("rutas_turisticasss.csv", {
            download: true,
            header: true,
            complete: function (results) {
                rutas = results.data;
                inicializarBotonesContinentes(rutas);
            },
            error: function (err) {
                console.error("Error al cargar el CSV:", err);
            }
        });
    }

    function inicializarBotonesContinentes(rutas) {
        const botonesContinente = document.querySelectorAll(".botonContinente");
        const contenedorRutas = document.getElementById("contenedorRutasFamosas");

        botonesContinente.forEach((boton) => {
            boton.addEventListener("click", () => {
                const continente = boton.dataset.continente;
                const rutasFiltradas = rutas.filter(r => r.Continente === continente);
                mostrarRutasFamosas(rutasFiltradas);
            });
        });

        // Mostrar todas las rutas inicialmente
        mostrarRutasFamosas(rutas);
    }

    function mostrarRutasFamosas(rutasFiltradas) {
        const contenedorRutas = document.getElementById("contenedorRutasFamosas");
        contenedorRutas.innerHTML = "";

        rutasFiltradas.forEach((ruta) => {
            const card = document.createElement("div");
            card.className = "card col-md-4";
            card.style.width = "18rem";
            card.innerHTML = `
                <div class="card-body">
                    <h5 class="card-title">${ruta.Nombre_Ruta}</h5>
                    <p class="card-text"><strong>${ruta.Pais}</strong><br>${ruta.Punto_1}, ${ruta.Punto_2}, ${ruta.Punto_3}, ${ruta.Punto_4}, ${ruta.Punto_5}</p>
                    <button class="btn btn-primary btn-ver-ruta" data-ruta-id="${ruta.Ruta_ID}">Ver Ruta</button>
                </div>
            `;
            contenedorRutas.appendChild(card);
        });

        // Añadir evento a los botones "Ver Ruta"
        const botonesVerRuta = document.querySelectorAll(".btn-ver-ruta");
        botonesVerRuta.forEach((boton) => {
            boton.addEventListener("click", () => {

                const rutaId = boton.dataset.rutaId;
                const ruta = rutas.find(r => r.Ruta_ID === rutaId);
                console.log(rutaId)
                console.log(ruta)
                cargarRuta(ruta);
            });
        });
    }

    async function cargarRuta(ruta) {
        const puntosTexto = [
            ruta.Punto_1,
            ruta.Punto_2,
            ruta.Punto_3,
            ruta.Punto_4,
            ruta.Punto_5
        ];

        const destinosGeocodificados = [];

        for (const punto of puntosTexto) {
            try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(punto + ', ' + ruta.Pais)}`);
            const data = await res.json();

            if (data.length) {
                destinosGeocodificados.push({
                nombre: punto,
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
                });
            }
            } catch (err) {
            console.error("Error al geocodificar:", err);
            }
        }

        // Si no se pudieron geocodificar al menos 2 puntos, salimos
        if (destinosGeocodificados.length < 2) {
            alert("No se pudo geocodificar suficientes puntos para optimizar la ruta.");
            return;
        }

        // Separar el punto de partida (el primero del CSV)
            establecerPuntoPartida(destinosGeocodificados[0]);

        // Guardar los demás puntos como destinos a optimizar
        const destinos = destinosGeocodificados.slice(1);
        console.log(destinosGeocodificados)
        // Mostrar sección mapaFamosa y ocultar rutas famosas
        console.log("1")
        document.getElementById("mapaRutaFamosa").classList.remove("oculta");
         console.log("2")
        document.getElementById("contenedorRutasFamosas").classList.add("oculta");
        // Mostrar el texto de la ruta original (sin optimizar aún)
        document.getElementById("textoRutaFamosa").textContent = destinosGeocodificados.map(d => d.nombre).join(" → ");

        // Asegurar que el mapa se renderice bien
        setTimeout(() => {
            mapaFamosa.invalidateSize();
                console.log("3")   
            // Usar algoritmo de vecino más cercano
            calcularRutaOptima(destinosGeocodificados, true);
        }, 150);
    }
    const btnSeguirExplorando = document.getElementById("btnSeguirExplorando");
    btnSeguirExplorando.addEventListener("click", () => {
    document.getElementById("seccionRutasFamosas").classList.remove("oculta");       
    document.getElementById("mapaRutaFamosa").classList.add("oculta");
       // 100 ms es suficiente para que el mapa esté visible
});
});