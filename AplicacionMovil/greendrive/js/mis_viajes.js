// ================== CONFIGURACIÓN DE SESIÓN Y VARIABLES ==================
const BASE_URL = "http://localhost:8000";

// Obtener el ID de usuario de la sesión (localStorage)
const usuarioId = localStorage.getItem('userId');

// Variable para guardar el ID del viaje seleccionado
let viajeSeleccionadoId = null;

// ================== INICIALIZACIÓN DEL DOM ==================
document.addEventListener("DOMContentLoaded", function() {
    // Verificar autenticación
    if (!usuarioId) {
        window.location.href = 'login.html'; // Redirigir al login si no hay usuario
        return;
    }

    // Cargar viajes del usuario
    cargarViajes();

    // Agregar event listener al botón de publicar viaje
    const btnPublicar = document.querySelector('.btn-primary');
    if (btnPublicar) {
        btnPublicar.addEventListener('click', function() {
            window.location.href = 'publicar_viaje.html';
        });
    }

    // Configurar eventos para los modales
    configurarEventosModales();
});

// ================== FUNCIONES PRINCIPALES ==================

// Función para cargar los viajes del usuario
async function cargarViajes() {
    const viajesContainer = document.getElementById('viajes-container');
    const noViajesMsg = document.getElementById('no-viajes');
    try {
        const response = await fetch(`${BASE_URL}/viajes/`);
        let viajes = await response.json();

        // Filtrar solo los viajes del usuario logueado
        viajes = viajes.filter(viaje => viaje.ID_Usuario === parseInt(usuarioId));

        // Limpiar el contenedor
        viajesContainer.innerHTML = '';

        if (viajes.length === 0) {
            // Mostrar mensaje de no viajes
            noViajesMsg.style.display = 'block';
        } else {
            // Ocultar mensaje de no viajes
            noViajesMsg.style.display = 'none';

            // Añadir cada viaje al contenedor
            viajes.forEach(viaje => {
                // Convertir la fecha a formato legible
                const fecha = new Date(viaje.Fecha_Hora_Salida);
                const fechaLocal = new Date(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate(), 
                          fecha.getUTCHours(), fecha.getUTCMinutes());
                const fechaFormateada = fecha.toLocaleDateString();
                const horaFormateada = fecha.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                const viajeHTML = `
                    <div class="trip-card" data-id="${viaje.ID_Viaje}">
                        <div class="trip-info">
                            <span class="trip-route">${viaje.Origen} → ${viaje.Destino}</span>
                            <span class="trip-details">Fecha: ${fechaFormateada} | Hora: ${horaFormateada} | Plazas: ${viaje.Plazas_disponibles} disponibles</span>
                        </div>
                        <div class="trip-actions">
                            <button class="btn-primary btn-edit" data-id="${viaje.ID_Viaje}">Editar</button>
                            <button class="btn-primary btn-delete" data-id="${viaje.ID_Viaje}">Cancelar</button>
                        </div>
                    </div>
                `;

                viajesContainer.innerHTML += viajeHTML;
            });

            // Agregar event listeners a los botones
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', function() {
                    const viajeId = this.getAttribute('data-id');
                    abrirModalEdicion(viajeId);
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', function() {
                    const viajeId = this.getAttribute('data-id');
                    abrirModalCancelacion(viajeId);
                });
            });
        }
    } catch (error) {
        viajesContainer.innerHTML = `
            <div class="error-message">
                Error al cargar los viajes: ${error.message}
            </div>
        `;
    }
}

// Función para abrir el modal de edición
async function abrirModalEdicion(viajeId) {
    viajeSeleccionadoId = viajeId;

    try {
        // Obtener información del viaje desde el backend
        const response = await fetch(`${BASE_URL}/viajes/${viajeId}`);

        if (!response.ok) {
            throw new Error(`Error al obtener información del viaje: ${response.status}`);
        }

        const viaje = await response.json();

        // Rellenar el formulario con los datos del viaje
        document.getElementById('edit-viaje-id').value = viaje.ID_Viaje;
        document.getElementById('edit-origen').value = viaje.Origen;
        document.getElementById('edit-destino').value = viaje.Destino;

        // Formatear fecha y hora
        const fechaHora = new Date(viaje.Fecha_Hora_Salida);

        // Formatear fecha (YYYY-MM-DD)
        const fecha = fechaHora.toISOString().split('T')[0];

        // Formatear hora (HH:MM)
        let horas = fechaHora.getHours();
        let minutos = fechaHora.getMinutes();

        horas = horas < 10 ? '0' + horas : horas;
        minutos = minutos < 10 ? '0' + minutos : minutos;

        const hora = `${horas}:${minutos}`;

        document.getElementById('edit-fecha').value = fecha;
        document.getElementById('edit-hora').value = hora;
        document.getElementById('edit-plazas').value = viaje.Plazas_disponibles;

        // Mostrar el modal
        document.getElementById('modal-container').classList.add('active');
        document.getElementById('edit-modal').classList.add('active');

    } catch (error) {
        console.error('Error al abrir modal de edición:', error);
        mostrarError('No se pudo cargar la información del viaje. Inténtalo de nuevo más tarde.');
    }
}

// Función para abrir el modal de cancelación
function abrirModalCancelacion(viajeId) {
    viajeSeleccionadoId = viajeId;
    document.getElementById('modal-container').classList.add('active');
    document.getElementById('confirm-cancel-modal').classList.add('active');
}

// Función para guardar cambios en un viaje
async function guardarCambiosViaje(event) {
    event.preventDefault();

    try {
        const viajeId = document.getElementById('edit-viaje-id').value;
        const fechaStr = document.getElementById('edit-fecha').value;
        const horaStr = document.getElementById('edit-hora').value;

        // Crear un objeto Date local
        const [year, month, day] = fechaStr.split('-').map(Number);
        const [hours, minutes] = horaStr.split(':').map(Number);

        const fechaLocal = new Date(year, month - 1, day, hours, minutes);

        // Convertir a UTC manualmente para enviar al servidor
        const fechaUTC = new Date(Date.UTC(
            fechaLocal.getFullYear(),
            fechaLocal.getMonth(),
            fechaLocal.getDate(),
            fechaLocal.getHours(),
            fechaLocal.getMinutes()
        ));

        // Obtener el viaje existente para mantener el campo coste
        const responsePrevio = await fetch(`${BASE_URL}/viajes/${viajeId}`);
        let coste = 0;

        if (responsePrevio.ok) {
            const viajePrevio = await responsePrevio.json();
            coste = viajePrevio.Coste;
        }

        // Datos del viaje actualizado - USAR ID DE SESIÓN
        const viajeData = {
            ID_Usuario: parseInt(usuarioId),
            Origen: document.getElementById('edit-origen').value,
            Destino: document.getElementById('edit-destino').value,
            Fecha_Hora_Salida: fechaUTC.toISOString(),
            Plazas_disponibles: parseInt(document.getElementById('edit-plazas').value),
            Coste: coste
        };

        // Enviar la solicitud al servidor
        const response = await fetch(`${BASE_URL}/viajes/update/${viajeId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(viajeData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al actualizar el viaje');
        }

        // Ocultar modal de edición
        document.getElementById('edit-modal').classList.remove('active');

        // Mostrar modal de éxito
        document.getElementById('success-title').textContent = 'Viaje actualizado';
        document.getElementById('success-message').textContent = 'El viaje se ha actualizado correctamente.';
        document.getElementById('success-modal').classList.add('active');

    } catch (error) {
        console.error('Error al guardar cambios:', error);
        mostrarError(error.message || 'No se pudo actualizar el viaje. Inténtalo de nuevo más tarde.');
    }
}

// Función para cancelar un viaje
async function cancelarViaje() {
    try {
        if (!viajeSeleccionadoId) return;

        // Enviar la solicitud al servidor
        const response = await fetch(`${BASE_URL}/viajes/delete/${viajeSeleccionadoId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Error al cancelar el viaje');
        }

        // Ocultar modal de confirmación
        document.getElementById('confirm-cancel-modal').classList.remove('active');

        // Mostrar modal de éxito
        document.getElementById('success-title').textContent = 'Viaje cancelado';
        document.getElementById('success-message').textContent = 'El viaje se ha cancelado correctamente.';
        document.getElementById('success-modal').classList.add('active');

    } catch (error) {
        console.error('Error al cancelar viaje:', error);
        mostrarError(error.message || 'No se pudo cancelar el viaje. Inténtalo de nuevo más tarde.');
    }
}

// ================== GESTIÓN DE MODALES ==================

// Función para mostrar errores en el modal
function mostrarError(mensaje) {
    document.getElementById('error-message').textContent = mensaje;
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    document.getElementById('error-modal').classList.add('active');
}

// Función para configurar eventos de los modales
function configurarEventosModales() {
    // Configurar eventos para el modal de edición
    const editForm = document.getElementById('edit-form');
    if (editForm) {
        editForm.addEventListener('submit', guardarCambiosViaje);
    }

    // Botón cancelar en modal de edición
    const editCancel = document.getElementById('edit-cancel');
    if (editCancel) {
        editCancel.addEventListener('click', cerrarTodosLosModales);
    }

    // Botones del modal de cancelación
    const cancelNo = document.getElementById('cancel-no');
    if (cancelNo) {
        cancelNo.addEventListener('click', cerrarTodosLosModales);
    }

    const cancelYes = document.getElementById('cancel-yes');
    if (cancelYes) {
        cancelYes.addEventListener('click', cancelarViaje);
    }

    // Botón aceptar del modal de éxito
    const successOk = document.getElementById('success-ok');
    if (successOk) {
        successOk.addEventListener('click', function() {
            cerrarTodosLosModales();
            cargarViajes(); // Recargar los viajes para reflejar los cambios
        });
    }

    // Botón aceptar del modal de error
    const errorOk = document.getElementById('error-ok');
    if (errorOk) {
        errorOk.addEventListener('click', cerrarTodosLosModales);
    }

    // Cerrar modales al hacer clic en X
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', cerrarTodosLosModales);
    });

    // Cerrar modales al hacer clic fuera del contenido
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.addEventListener('click', function(event) {
            if (event.target === this) {
                cerrarTodosLosModales();
            }
        });
    }
}

// Función para cerrar todos los modales
function cerrarTodosLosModales() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });

    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.classList.remove('active');
    }

    viajeSeleccionadoId = null;
}
