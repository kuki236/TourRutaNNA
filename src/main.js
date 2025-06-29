import { inicializarDestinos } from './destinos.js';
import { inicializarMapa, inicializarMapaFamosa, mapaFamosa } from './mapas.js';
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
        document.getElementById("seccionResultado").classList.remove("oculta")
        const lugar = document.getElementById("floatingInput").value.trim();
        manejarPuntoPartida(lugar);
    });

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
                contenedorRutas.classList.remove("oculta")
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

        const botonesVerRuta = document.querySelectorAll(".btn-ver-ruta");
        botonesVerRuta.forEach((boton) => {
            boton.addEventListener("click", () => {

                const rutaId = boton.dataset.rutaId;
                const ruta = rutas.find(r => r.Ruta_ID === rutaId);
                document.getElementById("contenedorRutasFamosas").classList.add("oculta");
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
        if (destinosGeocodificados.length < 2) {
            alert("No se pudo geocodificar suficientes puntos para optimizar la ruta.");
            return;
        }

        establecerPuntoPartida(destinosGeocodificados[0]);

        const destinos = destinosGeocodificados.slice(1);
 
        document.getElementById("mapaRutaFamosa").classList.remove("oculta");
        document.getElementById("textoRutaFamosa").textContent = destinosGeocodificados.map(d => d.nombre).join(" → ");
        mostrarCarouselImagenes(ruta.Ruta_ID, destinosGeocodificados);
        setTimeout(() => {
            mapaFamosa.invalidateSize();
            calcularRutaOptima(destinos, true);
        }, 150);
    }
    const btnSeguirExplorando = document.getElementById("btnSeguirExplorando");
        btnSeguirExplorando.addEventListener("click", () => {
            document.getElementById("seccionRutasFamosas").classList.remove("oculta");       
            document.getElementById("mapaRutaFamosa").classList.add("oculta");
            document.getElementById("sectionImagenesRuta").classList.add("oculta")
      });
 const $sectionCarouselIma = document.getElementById("imaRutasFamosa")

function mostrarCarouselImagenes(rutaId, destinos) {
    const seccion = document.querySelector(".imaRutasFamosa");
    const contenedorCarousel = document.getElementById("carouselIma");
    const indicadores = document.querySelector(".carousel-indicators");

    seccion.classList.remove("oculta");
    contenedorCarousel.innerHTML = "";
    indicadores.innerHTML = ""; 
    console.log(destinos)
    destinos.forEach((destino, index) => {

        const item = document.createElement("div");
        item.className = `carousel-item itemCAR ${index === 0 ? "active" : ""}`;
        item.setAttribute("data-bs-interval", "10000");

        item.innerHTML = `
            <div class="container text-center">
                <div class="row justify-content-center">
                    <div class="col-12">
                        <img src="./imagenes/${rutaId}/${index + 1}.jpg" class="imagen-carousel-famosa d-block" alt="${destino.nombre}">
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-12">
                        <p class="fw-bold textoIma">${destino.nombre}</p>
                    </div>
                </div>
            </div>
        `;

        contenedorCarousel.appendChild(item);

        const boton = document.createElement("button");
        boton.type = "button";
        boton.setAttribute("data-bs-target", "#carouselExampleDark");
        boton.setAttribute("data-bs-slide-to", index);
        boton.setAttribute("aria-label", `Slide ${index + 1}`);
        if (index === 0) {
            boton.classList.add("active");
            boton.setAttribute("aria-current", "true");
        }
        indicadores.appendChild(boton);
    });
}

});
