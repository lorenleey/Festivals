const API_KEY = "vLTMp7MA0uELfCTubvxN7iupCxDtZD9u";

const eventList = document.getElementById("eventList");
const eventDetails = document.getElementById("eventDetails");

const altura = "600px";

async function cargarEventos() {
  eventList.innerHTML = "<li class='loading'>Cargando eventos...</li>";
  eventDetails.innerHTML = "<p>Esperando selección...</p>";
console.log("API_KEY:", API_KEY);


  const url =
  "https://app.ticketmaster.com/discovery/v2/events.json" +
  `?apikey=${API_KEY}` +
  "&keyword=Festival" +
  "&classificationName=Music";

  try {

    const response = await fetch("https://corsproxy.io/?" + encodeURIComponent(url)); // AJAX
    const data = await response.json();

    rawJSON = data;
    console.log("Respuesta TM:", data);
console.log("Total:", data?.page?.totalElements);

    if (!data._embedded || !data._embedded.events) {
      eventList.innerHTML = "<li>No se encontraron eventos</li>";
      return;
    }

    const eventos = data._embedded.events;
    eventList.innerHTML = "";

    eventos.forEach(event => {
      const li = document.createElement("li");
      li.textContent = `${event.name} (${event.dates.start.localDate})`;
      li.onclick = () => showDetails(event);
      eventList.appendChild(li);

    });
    eventList.style.height = altura;
    eventList.style.border = "";
    eventList.style.padding = "15px 25px";

    const crudo = document.createElement("li");
    crudo.textContent = 'Texto Crudo de JS';
    crudo.onclick = () => mostrarJS(data, rawJSON);
    eventList.appendChild(crudo);
    analizar(eventos);

    const arbol = document.createElement("li");
    arbol.textContent = 'Ver árbol de nodos';
    arbol.onclick = () => mostrarArbol(rawJSON);
    eventList.appendChild(arbol);


  } catch (error) {
    console.error(error);
    eventList.innerHTML = "<li>Error al cargar los datos</li>";
  }
}


function mostrarArbol(obj) {
  eventDetails.innerHTML = "<h2>Árbol de nodos</h2>";

  const container = document.createElement("div");
  container.className = "xml-tree";

  container.appendChild(crearNodoJSON("root", obj, true));

  eventDetails.appendChild(container);
}




function crearNodoJSON(key, value, esRaiz = false) {
  const node = document.createElement("div");
  node.classList.add("nodo");

  // 👉 Tipo de nodo
  if (esRaiz) {
    node.classList.add("raiz");
  } else if (key.startsWith("_")) {
    node.classList.add("atributo");
  } else if (typeof value === "object" && value !== null) {
    node.classList.add("elemento");
  } else {
    node.classList.add("texto");
  }

  // 👉 Cabecera
  const header = document.createElement("div");
  header.className = "node-header";

  const arrow = document.createElement("span");
  arrow.className = "arrow";

  const esObjeto = typeof value === "object" && value !== null;
  arrow.textContent = esObjeto ? "▼" : "•";

  const label = document.createElement("span");

  if (esObjeto) {
    label.innerHTML = `<strong>${key}</strong>`;
  } else {
    label.innerHTML = `<strong>${key}</strong>: ${value}`;
  }

  header.appendChild(arrow);
  header.appendChild(label);
  node.appendChild(header);

  // 👉 Hijos
  if (esObjeto) {
    const children = document.createElement("div");
    children.className = "children";

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        children.appendChild(
          crearNodoJSON(`${key}[${index}]`, item)
        );
      });
    } else {
      for (const k in value) {
        children.appendChild(crearNodoJSON(k, value[k]));
      }
    }

    node.appendChild(children);

    header.onclick = () => {
      node.classList.toggle("collapsed");
    };
  }

  return node;
}

/** La API devuelve JSON, pero el árbol representa una abstracción visual del 
 * modelo XML DOM, clasificando los nodos según su rol. */



function mostrarJS(data, rawJSON) {
  const download = document.createElement('div');
  download.innerHTML = "Descargar JSON";
  download.onclick = () => downloadJSON(rawJSON);
  eventDetails.appendChild(download);

  eventDetails.innerHTML = JSON.stringify(data, null, 2);
  eventDetails.style.padding= "10px";

}


function downloadJSON(rawJSON) {
  if (!rawJSON) {
    alert("No hay datos para descargar");
    return;
  }

  const blob = new Blob(
    [JSON.stringify(rawJSON, null, 2)],
    { type: "application/json" }
  );

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "ticketmaster_response.json";
  link.click();
}

function showDetails(event) {
  const venue = event._embedded?.venues?.[0];
  let estado = "No a la venta";
  console.log(event.dates.status.code);
  if ((event.dates.status.code).match("onsale")) {
    estado = "A la venta";
  }
  eventDetails.innerHTML = `
    <h2>${event.name}</h2>
    <p><strong>Fecha:</strong> ${event.dates.start.localDate}</p>
    <p><strong>Estado:</strong> ${estado}</p>
    <p><strong>Lugar:</strong> ${venue?.name || "No disponible"}</p>
    <p><strong>Ciudad:</strong> ${venue?.city?.name || "No disponible"}</p>
    <p><strong>País:</strong> ${venue?.country?.name || "No disponible"}</p>
  `;

  eventDetails.innerHTML += showFestivalArtists(event);
  eventDetails.innerHTML += showEventGallery(event);
  eventDetails.innerHTML += ` <p><a href="${event.url}" target="_blank">Ver en Ticketmaster</a></p> `;
  eventDetails.style.height = altura;
}

function showFestivalArtists(event) {
  const artists = event._embedded?.attractions;

  artists.splice(artists.findIndex(e => e.name === event.name), 1);

  if (!artists || artists.length === 0) {
    return "<p>No hay información de artistas</p>";
  }


  const top10 = artists.slice(0, 10);

  return `
    <h3>Artistas principales</h3>
    <ul>
      ${top10.map(a => `<li>${a.name}</li>`).join("")}
    </ul>
  `;
}

function showEventGallery(event) {
  if (!event.images || event.images.length === 0) {
    return `<p class="no-images">No hay imágenes disponibles</p>`;
  }

  const img = event.images.find(x => x.ratio === "16_9") || event.images[0];

  return `
    <section class="event-image">
      <h3>Imagen</h3>
      <div class="image-wrapper">
        <img src="${img.url}" alt="${event.name}" loading="lazy">
      </div>
    </section>
  `;
}



function analizar(eventos) {
  const total = eventos.length;
  const countries = {};

  eventos.forEach(e => {
    const country = e._embedded?.venues?.[0]?.country?.name;
    if (country) {
      countries[country] = (countries[country] || 0) + 1;
    }
  });

  console.log("Total de eventos:", total);
  console.log("Distribución por país:", countries);
}

