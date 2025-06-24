import { inicializarDestinos } from './destinos.js';
import { inicializarMapa, mostrarRutaOptima } from './mapas.js';
import { inicializarRuta, manejarPuntoPartida, calcularRutaOptima } from './ruta.js';

document.addEventListener("DOMContentLoaded", () => {
    inicializarMapa();
    inicializarRuta();
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
        seccionRutasFamosas.classList.remove("oculto");
        if (!seccionRutasFamosas.dataset.loaded) {
            cargarRutasFamosas();
            seccionRutasFamosas.dataset.loaded = true;
        }
    });

    function cargarRutasFamosas() {
        Papa.parse("rutas_turisticas.csv", {
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
                <img src="https://via.placeholder.com/300x200" class="card-img-top" alt="${ruta.Nombre_Ruta}">
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
                cargarRuta(ruta);
            });
        });
    }

    async function cargarRuta(ruta) {
        const puntos = [ruta.Punto_1, ruta.Punto_2, ruta.Punto_3, ruta.Punto_4, ruta.Punto_5];
        const destinos = [];

        for (const punto of puntos) {
            try {
                // Nota: Aquí se usará Nominatim cuando el usuario lo ejecute
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(punto + ', ' + ruta.Pais)}`
                );
                const data = await res.json();
                if (data.length) {
                    destinos.push({
                        dataset: {
                            nombre: punto,
                            lat: parseFloat(data[0].lat),
                            lon: parseFloat(data[0].lon)
                        }
                    });
                }
            } catch (err) {
                console.error("Error al geocodificar:", err);
            }
        }

        await manejarPuntoPartida(puntos[0]);
        calcularRutaOptima(destinos);
        seccionRutasFamosas.classList.add("oculto");
    }
});