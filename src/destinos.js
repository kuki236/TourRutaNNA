export function inicializarDestinos(callback) {
  const btn = document.getElementById("botonAnadir");
  const input = document.getElementById("inputDestino");
  const lista = document.getElementById("listaDestinos");

  btn.addEventListener("click", async () => {
    const destino = input.value.trim();
    if (!destino) return;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destino)}`);
      const data = await res.json();
      console.log(data)
      if (!data.length) return alert("Destino no encontrado.");
      const { lat, lon } = data[0];

      const li = document.createElement("li");
      li.className = "list-group-item";

      const spanNombre = document.createElement("span"); 
      const nombreCorto = data[0].display_name.split(",")[0];
      spanNombre.textContent = nombreCorto;
      li.dataset.nombre = nombreCorto;
      li.appendChild(spanNombre);

      li.dataset.lat = lat;
      li.dataset.lon = lon;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn btn-warning botonEliminar";
      deleteBtn.textContent = "X";
      deleteBtn.addEventListener("click", () => {
            li.remove();
            const destinos = Array.from(lista.children); 
            callback && callback(destinos); 
      });

      li.appendChild(deleteBtn);
      lista.appendChild(li);

      input.value = "";
      const destinos = Array.from(lista.children);

      callback && callback(destinos);
    } catch (err) {
      console.error("Error al añadir destino:", err);
    }
  });
}