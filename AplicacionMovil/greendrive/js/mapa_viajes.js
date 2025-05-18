// URL base de tu API FastAPI
const BASE_URL = "http://localhost:8000";

// Cache de coordenadas para ciudades ya consultadas
let coordenadasCache = {
  // Algunas ciudades importantes precargadas
  "Madrid": [40.4168, -3.7038],
  "Barcelona": [41.3851, 2.1734],
  "Valencia": [39.4699, -0.3763],
  "Sevilla": [37.3891, -5.9845],
  "Málaga": [36.7213, -4.4213],
  "Manresa": [41.7267, 1.8212],
  "Sabadell": [41.5431, 2.1044]
};

// Variables globales
let map;
let viajesData = [];
let markersLayer;
let rutasLayer;
let pendientesGeocoding = [];
let consultasEnProgreso = 0;
const MAX_CONSULTAS_SIMULTANEAS = 5;

// Cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function() {
  // Inicializar el mapa
  inicializarMapa();
  
  // Cargar los viajes
  cargarViajes();
  
  // Eventos de los filtros
  document.getElementById('btn-aplicar-filtros').addEventListener('click', aplicarFiltros);
  
  // Evento para el botón de limpiar filtros
  document.getElementById('btn-limpiar-filtros').addEventListener('click', limpiarFiltros);
});

// Función para inicializar el mapa
function inicializarMapa() {
  // Crear el mapa centrado en España
  map = L.map('map').setView([40.4168, -3.7038], 6);
  
  // Añadir la capa de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  
  // Crear capas para marcadores y rutas
  markersLayer = L.layerGroup().addTo(map);
  rutasLayer = L.layerGroup().addTo(map);
}

// Función para cargar los viajes desde el backend
async function cargarViajes() {
  try {
    // Mostrar indicador de carga
    document.getElementById('viajes-list').innerHTML = '<div class="loading">Cargando viajes...</div>';
    
    // Obtener los viajes desde la API
    const response = await fetch(`${BASE_URL}/viajes/`);
    
    if (!response.ok) {
      throw new Error(`Error al obtener viajes: ${response.status} ${response.statusText}`);
    }
    
    // Guardar los datos
    viajesData = await response.json();
    
    // Reiniciar variables
    pendientesGeocoding = [];
    consultasEnProgreso = 0;
    
    // Primero mostrar los viajes en la lista
    mostrarViajesEnLista(viajesData);
    
    // Luego procesar las coordenadas y mostrar en el mapa
    await procesarCoordenadas(viajesData);
    
  } catch (error) {
    console.error("Error al cargar viajes:", error);
    document.getElementById('viajes-list').innerHTML = `
      <div class="error-message">Error al cargar viajes: ${error.message}</div>
    `;
  }
}

// Función para mostrar los viajes en la lista lateral
function mostrarViajesEnLista(viajes) {
  const viajesList = document.getElementById('viajes-list');
  
  // Limpiar la lista
  viajesList.innerHTML = '';
  
  if (!viajes || viajes.length === 0) {
    viajesList.innerHTML = '<div class="no-results">No hay viajes disponibles</div>';
    return;
  }
  
  // Mostrar cada viaje en la lista
  viajes.forEach(viaje => {
    // Formatear la fecha y hora
    const fecha = new Date(viaje.Fecha_Hora_Salida);
    const fechaFormateada = fecha.toLocaleDateString();
    const horaFormateada = fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Verificar si ya tenemos coordenadas para ambas ciudades
    const tieneCoordenadasOrigen = viaje.Origen in coordenadasCache;
    const tieneCoordenadasDestino = viaje.Destino in coordenadasCache;
    const tieneCoordenadasCompletas = tieneCoordenadasOrigen && tieneCoordenadasDestino;
    
    // Clase para resaltar viajes según su estado de coordenadas
    let claseEstado = '';
    if (!tieneCoordenadasCompletas) {
      claseEstado = ' coordenadas-pendientes';
      // Añadir a la lista de pendientes si no está ya
      if (!tieneCoordenadasOrigen && !pendientesGeocoding.includes(viaje.Origen)) {
        pendientesGeocoding.push(viaje.Origen);
      }
      if (!tieneCoordenadasDestino && !pendientesGeocoding.includes(viaje.Destino)) {
        pendientesGeocoding.push(viaje.Destino);
      }
    }
    
    const viajeHTML = `
      <div class="viaje-item${claseEstado}" data-id="${viaje.ID_Viaje}">
        <div class="viaje-origen-destino">
          ${viaje.Origen} → ${viaje.Destino}
          ${!tieneCoordenadasCompletas ? '<i class="fas fa-sync-alt fa-spin" title="Buscando coordenadas..."></i>' : ''}
        </div>
        <div class="viaje-detalles">
          ${fechaFormateada} | ${horaFormateada} | €${viaje.Coste.toFixed(2)}
        </div>
      </div>
    `;
    
    viajesList.innerHTML += viajeHTML;
  });
  
  // Mostrar el número de viajes encontrados
  document.getElementById('viajes-count').textContent = viajes.length;
}

// Función para procesar coordenadas de todos los viajes
async function procesarCoordenadas(viajes) {
  // Mostrar un mensaje de carga si hay ciudades pendientes de geocodificación
  if (pendientesGeocoding.length > 0) {
    mostrarEstadoGeocoding(pendientesGeocoding);
  }
  
  // Iniciar el procesamiento de geocodificación en paralelo
  procesarSiguientesGeocoding();
  
  // Mostrar inmediatamente los viajes que ya tienen coordenadas
  mostrarViajesEnMapa(viajes);
}

// Función para procesar el siguiente lote de ciudades pendientes
function procesarSiguientesGeocoding() {
  // Procesar hasta MAX_CONSULTAS_SIMULTANEAS consultas a la vez
  while (consultasEnProgreso < MAX_CONSULTAS_SIMULTANEAS && pendientesGeocoding.length > 0) {
    const ciudad = pendientesGeocoding.shift();
    consultasEnProgreso++;
    
    obtenerCoordenadas(ciudad)
      .then(() => {
        consultasEnProgreso--;
        actualizarEstadoGeocoding();
        
        // Actualizar el mapa con las nuevas coordenadas
        mostrarViajesEnMapa(viajesData);
        
        // Seguir procesando si hay más pendientes
        if (pendientesGeocoding.length > 0) {
          procesarSiguientesGeocoding();
        } else if (consultasEnProgreso === 0) {
          // Todas las consultas terminaron
          ocultarEstadoGeocoding();
        }
      })
      .catch(error => {
        console.error(`Error al obtener coordenadas para ${ciudad}:`, error);
        consultasEnProgreso--;
        actualizarEstadoGeocoding();
        
        // Seguir procesando si hay más pendientes
        if (pendientesGeocoding.length > 0) {
          procesarSiguientesGeocoding();
        } else if (consultasEnProgreso === 0) {
          // Todas las consultas terminaron
          ocultarEstadoGeocoding();
        }
      });
  }
}

// Función para mostrar el estado de geocodificación
function mostrarEstadoGeocoding(pendientes) {
  // Crear o actualizar el div de estado
  let geocodingDiv = document.getElementById('geocoding-estado');
  
  if (!geocodingDiv) {
    geocodingDiv = document.createElement('div');
    geocodingDiv.id = 'geocoding-estado';
    geocodingDiv.className = 'geocoding-estado';
    
    // Insertar después de los filtros
    const filtrosDiv = document.querySelector('.filters');
    filtrosDiv.parentNode.insertBefore(geocodingDiv, filtrosDiv.nextSibling);
  }
  
  // Actualizar el contenido
  geocodingDiv.innerHTML = `
    <div class="geocoding-titulo">
      <i class="fas fa-map-marker-alt"></i> 
      Obteniendo coordenadas de ciudades
    </div>
    <div class="geocoding-texto">
      Buscando información para ${pendientes.length} ciudades...
      <div class="geocoding-progreso">
        <div class="geocoding-barra"></div>
      </div>
    </div>
  `;
}

// Función para actualizar el estado de geocodificación
function actualizarEstadoGeocoding() {
  const estadoDiv = document.getElementById('geocoding-estado');
  if (!estadoDiv) return;
  
  const total = pendientesGeocoding.length + consultasEnProgreso;
  const completadas = consultasEnProgreso;
  const porcentaje = total === 0 ? 100 : Math.round((completadas / total) * 100);
  
  estadoDiv.querySelector('.geocoding-texto').innerHTML = `
    Procesando ${consultasEnProgreso} ciudades... 
    ${pendientesGeocoding.length ? `(${pendientesGeocoding.length} pendientes)` : ''}
    <div class="geocoding-progreso">
      <div class="geocoding-barra" style="width: ${porcentaje}%"></div>
    </div>
  `;
}

// Función para ocultar el estado de geocodificación
function ocultarEstadoGeocoding() {
  const estadoDiv = document.getElementById('geocoding-estado');
  if (estadoDiv) {
    estadoDiv.innerHTML = `
      <div class="geocoding-titulo">
        <i class="fas fa-check-circle"></i> 
        Coordenadas obtenidas
      </div>
      <div class="geocoding-texto">
        Se han procesado todas las ciudades correctamente.
      </div>
    `;
    
    // Actualizar estilos de los elementos de la lista
    document.querySelectorAll('.viaje-item.coordenadas-pendientes').forEach(item => {
      item.classList.remove('coordenadas-pendientes');
      // Quitar el icono de carga
      const iconoElement = item.querySelector('.fa-sync-alt');
      if (iconoElement) {
        iconoElement.remove();
      }
    });
    
    // Después de un tiempo, eliminar el mensaje
    setTimeout(() => {
      estadoDiv.style.opacity = '0';
      setTimeout(() => {
        estadoDiv.remove();
      }, 500);
    }, 3000);
  }
}

// Función para obtener coordenadas usando Nominatim API
async function obtenerCoordenadas(ciudad) {
  // Si ya tenemos las coordenadas en cache, no hacer nada
  if (coordenadasCache[ciudad]) {
    return Promise.resolve(coordenadasCache[ciudad]);
  }
  
  try {
    // Añadir el país para mejorar la precisión
    const query = encodeURIComponent(`${ciudad}, España`);
    
    // Usar Nominatim API de OpenStreetMap
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
    
    if (!response.ok) {
      throw new Error(`Error en la consulta de geocodificación: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      // Guardar coordenadas en cache
      coordenadasCache[ciudad] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      console.log(`Coordenadas obtenidas para ${ciudad}: [${coordenadasCache[ciudad]}]`);
      return coordenadasCache[ciudad];
    } else {
      console.warn(`No se encontraron coordenadas para ${ciudad}`);
      // Guardar como null para no volver a intentar
      coordenadasCache[ciudad] = null;
      return null;
    }
  } catch (error) {
    console.error(`Error al obtener coordenadas para ${ciudad}:`, error);
    // No guardar en cache para poder reintentar
    return null;
  }
}

// Función para mostrar los viajes en el mapa
function mostrarViajesEnMapa(viajes) {
  // Limpiar capas
  markersLayer.clearLayers();
  rutasLayer.clearLayers();
  
  if (!viajes || viajes.length === 0) {
    return;
  }
  
  // Mostrar cada viaje en el mapa
  viajes.forEach(viaje => {
    // Verificar si tenemos las coordenadas para el origen y destino
    if (!coordenadasCache[viaje.Origen] || !coordenadasCache[viaje.Destino]) {
      // No tenemos las coordenadas completas aún
      return;
    }
    
    // Obtener coordenadas
    const coordOrigen = coordenadasCache[viaje.Origen];
    const coordDestino = coordenadasCache[viaje.Destino];
    
    // Si alguna coordenada es null (no se encontró), omitir este viaje
    if (!coordOrigen || !coordDestino) {
      return;
    }
    
    // Crear marcador para el origen
    const markerOrigen = L.marker(coordOrigen).addTo(markersLayer);
    
    // Formatear la fecha y hora
    const fecha = new Date(viaje.Fecha_Hora_Salida);
    const fechaFormateada = fecha.toLocaleDateString();
    const horaFormateada = fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    // Configurar el popup para el origen
    markerOrigen.bindPopup(`
      <div class="popup-title">${viaje.Origen} → ${viaje.Destino}</div>
      <div class="popup-details">
        <strong>Fecha:</strong> ${fechaFormateada}<br>
        <strong>Hora:</strong> ${horaFormateada}<br>
        <strong>Plazas:</strong> ${viaje.Plazas_disponibles} disponibles
      </div>
      <div class="popup-price">€${viaje.Coste.toFixed(2)}</div>
      <a href="buscar_viaje.html?id=${viaje.ID_Viaje}" class="popup-button">Reservar</a>
    `);
    
    // Crear marcador para el destino
    const markerDestino = L.marker(coordDestino).addTo(markersLayer);
    
    // Configurar el popup para el destino
    markerDestino.bindPopup(`
      <div class="popup-title">${viaje.Destino}</div>
      <div class="popup-details">Destino del viaje</div>
    `);
    
    // Crear línea entre origen y destino
    const rutaLine = L.polyline([coordOrigen, coordDestino], {
      color: '#10b981',
      weight: 3,
      opacity: 0.7,
      dashArray: '5, 10'
    }).addTo(rutasLayer);
    
    // Asociar el ID del viaje a la línea
    rutaLine.viajeId = viaje.ID_Viaje;
    
    // Evento al hacer clic en la línea
    rutaLine.on('click', function() {
      seleccionarViaje(this.viajeId);
    });
  });
  
  // Actualizar los elementos de la lista
  viajes.forEach(viaje => {
    const tieneCoordenadasCompletas = 
      coordenadasCache[viaje.Origen] && 
      coordenadasCache[viaje.Destino] && 
      coordenadasCache[viaje.Origen] !== null && 
      coordenadasCache[viaje.Destino] !== null;
    
    const viajeElement = document.querySelector(`.viaje-item[data-id="${viaje.ID_Viaje}"]`);
    if (viajeElement) {
      // Actualizar la clase según si tiene coordenadas
      if (tieneCoordenadasCompletas) {
        viajeElement.classList.remove('coordenadas-pendientes');
        viajeElement.classList.remove('coordenadas-error');
        // Quitar el icono de carga o error
        const iconoElement = viajeElement.querySelector('.fa-sync-alt, .fa-exclamation-circle');
        if (iconoElement) {
          iconoElement.remove();
        }
      } else if (
        (coordenadasCache[viaje.Origen] === null || coordenadasCache[viaje.Destino] === null) &&
        !pendientesGeocoding.includes(viaje.Origen) && 
        !pendientesGeocoding.includes(viaje.Destino)
      ) {
        // Si las coordenadas son null y no están pendientes, es un error
        viajeElement.classList.remove('coordenadas-pendientes');
        viajeElement.classList.add('coordenadas-error');
        // Cambiar icono de carga por icono de error
        const iconoElement = viajeElement.querySelector('.fa-sync-alt');
        if (iconoElement) {
          iconoElement.classList.remove('fa-sync-alt');
          iconoElement.classList.remove('fa-spin');
          iconoElement.classList.add('fa-exclamation-circle');
          iconoElement.title = "No se pudieron obtener las coordenadas";
        }
      }
    }
  });
}

// Función para seleccionar un viaje y mostrarlo en el mapa
function seleccionarViaje(viajeId) {
  // Convertir el ID a número
  const id = parseInt(viajeId);
  
  // Encontrar el viaje en los datos
  const viaje = viajesData.find(v => v.ID_Viaje === id);
  
  if (!viaje) {
    console.warn(`No se encontró el viaje con ID ${viajeId}`);
    return;
  }
  
  // Comprobar si tenemos coordenadas para este viaje
  if (!coordenadasCache[viaje.Origen] || !coordenadasCache[viaje.Destino] || 
      coordenadasCache[viaje.Origen] === null || coordenadasCache[viaje.Destino] === null) {
    alert(`No se puede mostrar este viaje en el mapa porque no tenemos coordenadas completas para la ruta.`);
    return;
  }
  
  // Ajustar el mapa para que se vean ambos puntos
  const coordOrigen = coordenadasCache[viaje.Origen];
  const coordDestino = coordenadasCache[viaje.Destino];
  const bounds = L.latLngBounds([coordOrigen, coordDestino]);
  map.fitBounds(bounds, { padding: [50, 50] });
  
  // Resaltar el viaje en la lista
  document.querySelectorAll('.viaje-item').forEach(item => {
    item.classList.remove('active');
    if (parseInt(item.getAttribute('data-id')) === id) {
      item.classList.add('active');
      // Hacer scroll hasta el elemento
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
  
  // Destacar la ruta
  rutasLayer.eachLayer(layer => {
    if (layer.viajeId === id) {
      layer.setStyle({ color: '#0ea5e9', weight: 5, opacity: 1, dashArray: '' });
    } else {
      layer.setStyle({ color: '#10b981', weight: 3, opacity: 0.7, dashArray: '5, 10' });
    }
  });
}

// Función para aplicar filtros
function aplicarFiltros() {
  const origen = document.getElementById('filter-origen').value.trim().toLowerCase();
  const destino = document.getElementById('filter-destino').value.trim().toLowerCase();
  const fecha = document.getElementById('filter-fecha').value;
  
  // Filtrar los viajes
  const viajesFiltrados = viajesData.filter(viaje => {
    let cumpleFiltros = true;
    
    if (origen && !viaje.Origen.toLowerCase().includes(origen)) {
      cumpleFiltros = false;
    }
    
    if (destino && !viaje.Destino.toLowerCase().includes(destino)) {
      cumpleFiltros = false;
    }
    
    if (fecha) {
      const fechaViaje = new Date(viaje.Fecha_Hora_Salida).toISOString().split('T')[0];
      if (fechaViaje !== fecha) {
        cumpleFiltros = false;
      }
    }
    
    return cumpleFiltros;
  });
  
  // Actualizar la visualización
  mostrarViajesEnLista(viajesFiltrados);
  mostrarViajesEnMapa(viajesFiltrados);
  
  // Mostrar mensaje de filtros aplicados
  document.getElementById('filtros-aplicados').style.display = 'flex';
}

// Función para limpiar filtros
function limpiarFiltros() {
  // Limpiar los campos de filtro
  document.getElementById('filter-origen').value = '';
  document.getElementById('filter-destino').value = '';
  document.getElementById('filter-fecha').value = '';
  
  // Recargar todos los viajes
  mostrarViajesEnLista(viajesData);
  mostrarViajesEnMapa(viajesData);
  
  // Ocultar mensaje de filtros aplicados
  document.getElementById('filtros-aplicados').style.display = 'none';
}