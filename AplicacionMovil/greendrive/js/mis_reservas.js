const BASE_URL = "http://13.50.166.206:8000";
const usuarioId = localStorage.getItem('userId'); // Cambia este valor según el usuario que quieras mostrar
const reservasContainer = document.getElementById('reservas-container');
const noReservasMsg = document.getElementById('no-reservas');
const loadingState = document.getElementById('loading-state');
const errorMessage = document.getElementById('error-message');
let viajesData = {};
document.addEventListener("DOMContentLoaded", function() {
    if (!usuarioId) {
        return;
    }
    cargarReservas();
    configurarPestanas();
});
function configurarPestanas() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const filtro = this.textContent.trim().toLowerCase();
            cargarReservas(filtro);
        });
    });
}
async function cargarReservas(filtro = 'todos') {
    if (!reservasContainer) {
        console.error("No se encontró el contenedor de reservas");
        return;
    }

    try {
        mostrarEstadoCarga();
        console.log(`Obteniendo reservas para el usuario ${usuarioId}`);
        const reservasResponse = await fetch(`${BASE_URL}/reservas/usuario/${usuarioId}`);

        if (!reservasResponse.ok) {
            throw new Error(`Error al obtener reservas: ${reservasResponse.status} ${reservasResponse.statusText}`);
        }

        const reservas = await reservasResponse.json();
        let reservasFiltradas = reservas;
        if (filtro !== 'todos') {
            reservasFiltradas = reservas.filter(reserva =>
                reserva.Estado && reserva.Estado.toLowerCase() === filtro
            );
        }

        reservasContainer.innerHTML = '';

        if (!Array.isArray(reservasFiltradas) || reservasFiltradas.length === 0) {
            mostrarEstadoVacio();
            return;
        }

        await mostrarReservas(reservasFiltradas);

    } catch (error) {
        console.error("Error al cargar reservas:", error);
        mostrarEstadoError(error.message);
    }
}
function mostrarEstadoCarga() {
    if (loadingState) loadingState.style.display = 'block';
    if (reservasContainer) reservasContainer.style.display = 'none';
    if (noReservasMsg) noReservasMsg.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'none';
}
function mostrarEstadoVacio() {
    if (loadingState) loadingState.style.display = 'none';
    if (reservasContainer) reservasContainer.style.display = 'none';
    if (noReservasMsg) noReservasMsg.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';
}
function mostrarEstadoError(mensajeError) {
    if (loadingState) loadingState.style.display = 'none';
    if (reservasContainer) reservasContainer.style.display = 'none';
    if (noReservasMsg) noReservasMsg.style.display = 'none';
    
    if (errorMessage) {
        errorMessage.style.display = 'flex';
        const errorText = errorMessage.querySelector('p');
        if (errorText) {
            errorText.textContent = `No se pudieron cargar tus reservas: ${mensajeError}`;
        }
    }
}
async function mostrarReservas(reservas) {
    if (loadingState) loadingState.style.display = 'none';
    if (reservasContainer) reservasContainer.style.display = 'block';
    for (const reserva of reservas) {
        let viajeInfo = null;
        
        try {
            console.log(`Obteniendo información del viaje ${reserva.ID_Viaje}`);
            const viajeResponse = await fetch(`${BASE_URL}/viajes/${reserva.ID_Viaje}`);
            
            if (viajeResponse.ok) {
                viajeInfo = await viajeResponse.json();
                console.log(`Información del viaje ${reserva.ID_Viaje}:`, viajeInfo);
                viajesData[reserva.ID_Reserva] = viajeInfo;
            } else {
                console.warn(`No se pudo obtener información del viaje ${reserva.ID_Viaje}`);
            }
        } catch (viajeError) {
            console.error(`Error al obtener el viaje ${reserva.ID_Viaje}:`, viajeError);
        }
        const cardHTML = crearTarjetaReserva(reserva, viajeInfo);
        reservasContainer.innerHTML += cardHTML;
    }
    agregarEventListeners();
}
function crearTarjetaReserva(reserva, viaje) {
    let origen = "Origen no disponible";
    let destino = "Destino no disponible";
    let fechaObj = new Date();
    let horaSalida = "00:00";
    let precio = 0;
    if (viaje) {
        origen = viaje.Origen || origen;
        destino = viaje.Destino || destino;
        if (viaje.Fecha_Hora_Salida) {
            try {
                fechaObj = new Date(viaje.Fecha_Hora_Salida);
                if (!isNaN(fechaObj.getTime())) { // Verificar que la fecha sea válida
                    horaSalida = fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                }
            } catch (e) {
                console.warn("Error al formatear la fecha:", e);
            }
        }
        if (typeof viaje.Coste === 'number') {
            precio = viaje.Coste;
        } else if (typeof viaje.Coste === 'string') {
            precio = parseFloat(viaje.Coste) || 0;
        }
    }
    const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    let estadoClase, estadoIcono, estadoTexto;
    switch ((reserva.Estado || "").toLowerCase()) {
        case 'confirmada':
            estadoClase = 'confirmada';
            estadoIcono = 'fa-check-circle';
            estadoTexto = 'Confirmada';
            break;
        case 'pendiente':
            estadoClase = 'pendiente';
            estadoIcono = 'fa-clock';
            estadoTexto = 'Pendiente';
            break;
        case 'completada':
            estadoClase = 'completada';
            estadoIcono = 'fa-check-circle';
            estadoTexto = 'Completada';
            break;
        case 'cancelada':
            estadoClase = 'cancelada';
            estadoIcono = 'fa-times-circle';
            estadoTexto = 'Cancelada';
            break;
        default:
            estadoClase = 'pendiente';
            estadoIcono = 'fa-question-circle';
            estadoTexto = reserva.Estado || "Estado desconocido";
    }
    return `
        <div class="reservation-card" data-id="${reserva.ID_Reserva}">
            <div class="reservation-header">
                <div class="reservation-id">Reserva #${reserva.ID_Reserva || "N/A"}</div>
                <div class="reservation-status ${estadoClase}">
                    <i class="fas ${estadoIcono}"></i> ${estadoTexto}
                </div>
            </div>
            <div class="reservation-body">
                <div class="trip-route">
                    <div class="route-point">
                        <div class="city">${origen}</div>
                        <div class="time">${horaSalida}</div>
                    </div>
                    <div class="route-line"></div>
                    <div class="route-point">
                        <div class="city">${destino}</div>
                        <div class="time"><span style="font-size:13px; color:#6b7280;">Llegada</span></div>
                    </div>
                </div>
                
                <div class="reservation-details">
                    <div class="detail-item">
                        <span class="detail-label">Fecha</span>
                        <span class="detail-value"><i class="far fa-calendar-alt"></i> ${fechaFormateada}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Pasajeros</span>
                        <span class="detail-value"><i class="fas fa-user"></i> 1 persona</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Punto de encuentro</span>
                        <span class="detail-value"><i class="fas fa-map-marker-alt"></i> Por confirmar</span>
                    </div>
                </div>
            </div>
            
            <div class="reservation-footer">
                <div class="reservation-price">Total: <span>${precio.toFixed(2)}€</span></div>
                <div class="reservation-actions">
                    <button class="btn-secondary btn-detalles" data-id="${reserva.ID_Reserva}">Detalles</button>
                    ${(estadoClase === 'confirmada' || estadoClase === 'pendiente') ?
                        `<button class="btn-danger btn-cancelar" data-id="${reserva.ID_Reserva}">Cancelar</button>` : ''}
                    ${(estadoClase === 'confirmada' || estadoClase === 'pendiente') ?
                        `<button class="btn-primary btn-chat" data-id="${reserva.ID_Reserva}" data-viaje-id="${viaje ? viaje.ID_Viaje : ''}">
                            <i class="fas fa-comments"></i> Chat
                        </button>` : ''}
                    ${estadoClase === 'completada' ?
                        `<button class="btn-primary btn-valorar" data-id="${reserva.ID_Reserva}">
                            <i class="fas fa-star"></i> Valorar
                        </button>` : ''}
                </div>
            </div>
        </div>
    `;
}
function agregarEventListeners() {
    document.querySelectorAll('.btn-cancelar').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservaId = parseInt(this.getAttribute('data-id'));
            cancelarReserva(reservaId);
        });
    });
    document.querySelectorAll('.btn-detalles').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservaId = parseInt(this.getAttribute('data-id'));
            verDetallesReserva(reservaId);
        });
    });
    document.querySelectorAll('.btn-chat').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservaId = parseInt(this.getAttribute('data-id'));
            const viajeId = parseInt(this.getAttribute('data-viaje-id'));
            abrirChat(reservaId, viajeId);
        });
    });
    document.querySelectorAll('.btn-valorar').forEach(btn => {
        btn.addEventListener('click', function() {
            const reservaId = this.getAttribute('data-id');
            window.location.href = `valorar_viaje.html?id=${reservaId}`;
        });
    });
}
async function cancelarReserva(reservaId) {
    const modalHTML = `
      <div class="modal-detalle" id="modalConfirmacion">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Confirmación</h3>
            <span class="modal-close" id="cerrarModalConfirmacion">&times;</span>
          </div>
          <div class="modal-body">
            <div class="detalle-section">
              <p style="text-align: center; font-size: 1.1rem;">¿Estás seguro de que deseas cancelar esta reserva?</p>
            </div>
          </div>
          <div class="modal-footer" style="display: flex; justify-content: center; gap: 15px;">
            <button class="btn-secondary" id="btnCancelarConfirmacion">No, volver</button>
            <button class="btn-danger" id="btnAceptarConfirmacion">Sí, cancelar</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('modalConfirmacion');
    modal.style.display = 'flex';
    return new Promise((resolve, reject) => {
        document.getElementById('btnAceptarConfirmacion').addEventListener('click', async () => {
            modal.remove();
            
            try {
                const response = await fetch(`${BASE_URL}/reservas/delete/${reservaId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    mostrarModalMensaje("Reserva cancelada con éxito");
                    cargarReservas(document.querySelector('.tab.active')?.textContent.trim().toLowerCase() || 'todos');
                } else {
                    const errorData = await response.json();
                    mostrarModalMensaje(`Error al cancelar la reserva: ${errorData.detail || response.statusText}`);
                }
            } catch (error) {
                console.error("Error al cancelar la reserva:", error);
                mostrarModalMensaje(`Error al cancelar la reserva: ${error.message}`);
            }
        });
        document.getElementById('cerrarModalConfirmacion').addEventListener('click', () => {
            modal.remove();
        });
        
        document.getElementById('btnCancelarConfirmacion').addEventListener('click', () => {
            modal.remove();
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    });
}
function mostrarModalMensaje(mensaje) {
    const modalHTML = `
      <div class="modal-detalle" id="modalMensaje">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Mensaje</h3>
            <span class="modal-close" id="cerrarModalMensaje">&times;</span>
          </div>
          <div class="modal-body">
            <div class="detalle-section">
              <p style="text-align: center;">${mensaje}</p>
            </div>
          </div>
          <div class="modal-footer" style="display: flex; justify-content: center;">
            <button class="btn-primary" id="btnAceptarMensaje">Aceptar</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('modalMensaje');
    modal.style.display = 'flex';
    document.getElementById('cerrarModalMensaje').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('btnAceptarMensaje').addEventListener('click', () => {
        modal.remove();
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}
function verDetallesReserva(reservaId) {
    try {
        const reservaCard = document.querySelector(`.reservation-card[data-id="${reservaId}"]`);
        if (!reservaCard) {
            throw new Error("No se encontró la reserva seleccionada");
        }
        const origen = reservaCard.querySelector('.route-point:first-child .city').textContent;
        const destino = reservaCard.querySelector('.route-point:last-child .city').textContent;
        const horaSalida = reservaCard.querySelector('.route-point:first-child .time').textContent;
        const fecha = reservaCard.querySelector('.detail-value i.far.fa-calendar-alt').parentElement.textContent.trim();
        const pasajeros = reservaCard.querySelector('.detail-value i.fas.fa-user').parentElement.textContent.trim();
        const puntoEncuentro = reservaCard.querySelector('.detail-value i.fas.fa-map-marker-alt').parentElement.textContent.trim();
        const precio = reservaCard.querySelector('.reservation-price span').textContent;
        const estadoElement = reservaCard.querySelector('.reservation-status');
        const estado = estadoElement.textContent.trim();
        const estadoClase = Array.from(estadoElement.classList)
          .find(cls => cls !== 'reservation-status') || '';
        const viajeId = viajesData[reservaId] ? viajesData[reservaId].ID_Viaje : null;
        const conductorId = viajesData[reservaId] ? viajesData[reservaId].ID_Usuario : null;
        const modalHTML = `
          <div class="modal-detalle" id="modalDetalle">
            <div class="modal-content">
              <div class="modal-header">
                <h3>Detalles de Reserva #${reservaId}</h3>
                <span class="modal-close" id="cerrarModal">&times;</span>
              </div>
              <div class="modal-body">
                <div class="detalle-section">
                  <h4>Información de viaje</h4>
                  <p><strong>Origen:</strong> ${origen}</p>
                  <p><strong>Destino:</strong> ${destino}</p>
                  <p><strong>Fecha:</strong> ${fecha}</p>
                  <p><strong>Hora de salida:</strong> ${horaSalida}</p>
                  <p><strong>Pasajeros:</strong> ${pasajeros}</p>
                  <p><strong>Punto de encuentro:</strong> ${puntoEncuentro}</p>
                </div>
                <div class="detalle-section">
                  <h4>Estado de la reserva</h4>
                  <p><strong>Estado:</strong> <span class="estado-${estadoClase}">${estado}</span></p>
                  <p><strong>Precio total:</strong> ${precio}</p>
                </div>
                <div class="detalle-section">
                  <h4>Instrucciones</h4>
                  <p>Llega al punto de encuentro 10 minutos antes de la hora de salida. El conductor te está esperando.</p>
                  <p>Si necesitas contactar con el conductor, puedes hacerlo a través de la plataforma.</p>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn-secondary" id="cerrarDetalle">Cerrar</button>
                ${conductorId ? `
                <button class="btn-primary" id="btnAbrirChat" data-reserva-id="${reservaId}" data-viaje-id="${viajeId || ''}">
                  <i class="fas fa-comments"></i> Chat
                </button>` : ''}
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = document.getElementById('modalDetalle');
        modal.style.display = 'flex';
        document.getElementById('cerrarModal').addEventListener('click', () => {
          modal.remove();
        });
        
        document.getElementById('cerrarDetalle').addEventListener('click', () => {
          modal.remove();
        });
        const btnChat = document.getElementById('btnAbrirChat');
        if (btnChat) {
          btnChat.addEventListener('click', () => {
            const reservaIdChat = parseInt(btnChat.getAttribute('data-reserva-id'));
            const viajeIdChat = parseInt(btnChat.getAttribute('data-viaje-id'));
            modal.remove();
            abrirChat(reservaIdChat, viajeIdChat);
          });
        }
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.remove();
          }
        });
        
    } catch (error) {
        console.error("Error al mostrar detalles de la reserva:", error);
        alert("No se pudieron cargar los detalles de la reserva");
    }
}
function abrirChat(reservaId, viajeId) {
    try {
        const viajeData = viajesData[reservaId];
        
        if (!viajeData) {
            console.warn("No se encontraron datos del viaje para la reserva:", reservaId);
            alert("No se pudo abrir el chat: información del viaje no disponible");
            return;
        }
        
        const conductorId = viajeData.ID_Usuario;
        
        if (!conductorId) {
            console.warn("No se encontró el ID del conductor para el viaje:", viajeId);
            alert("No se pudo abrir el chat: información del conductor no disponible");
            return;
        }
        localStorage.removeItem('reserva_seleccionada');
        localStorage.removeItem('viaje_seleccionado');
        localStorage.removeItem('chat_conductor_id');
        localStorage.setItem('reserva_seleccionada', reservaId.toString());
        localStorage.setItem('viaje_seleccionado', JSON.stringify(viajeData));
        localStorage.setItem('chat_conductor_id', conductorId.toString());
        window.location.href = 'chat.html';
    } catch (error) {
        console.error("Error al abrir chat:", error);
        alert("No se pudo abrir el chat. Por favor, inténtalo de nuevo.");
    }
}