import { inicializarDestinos } from './destinos.js';
import { inicializarMapa } from './mapas.js';
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


});