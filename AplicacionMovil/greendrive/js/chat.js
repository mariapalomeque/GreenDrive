const BASE_URL = "http://13.50.166.206:8000";

let usuarioLogueado = localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null;
let contactos = [];
let mensajesActuales = [];
let contactoActual = null;
let usuariosInfo = {}; // NUEVO: aquí guardamos los nombres de usuarios
async function cargarUsuariosInfo() {
    try {
        const response = await fetch(`${BASE_URL}/usuarios/`);
        if (response.ok) {
            const usuarios = await response.json();
            usuarios.forEach(usuario => {
                usuariosInfo[usuario.ID_Usuario] = `${usuario.Nombre} ${usuario.Apellido}`;
            });
        }
    } catch (error) {
        console.error("No se pudieron cargar los nombres de usuarios:", error);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await cargarUsuariosInfo(); // NUEVO: carga los nombres antes de nada

    if (!localStorage.getItem('userId')) {
        return;
    }
    configurarVistaMovil();
    ajustarLayoutChat();

    const reservaId = localStorage.getItem('reserva_seleccionada');
    const viajeDataStr = localStorage.getItem('viaje_seleccionado');
    const conductorId = localStorage.getItem('chat_conductor_id');

    if (reservaId && viajeDataStr && conductorId) {
        try {
            const viajeData = JSON.parse(viajeDataStr);

            const nombreReal = usuariosInfo[conductorId] || `Conductor #${conductorId}`; // CAMBIO

            const contactoConductor = {
                id: parseInt(conductorId),
                nombre: nombreReal,
                avatar: generarAvatarUrl(nombreReal, ""),
                estado: "online",
                viaje: {
                    origen: viajeData.Origen,
                    destino: viajeData.Destino,
                    fecha: new Date(viajeData.Fecha_Hora_Salida).toLocaleDateString(),
                    horaSalida: new Date(viajeData.Fecha_Hora_Salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    horaLlegada: "Estimada",
                    plazas: viajeData.Plazas_disponibles + 1,
                    plazasOcupadas: 1,
                    precio: viajeData.Coste,
                    conductor: nombreReal // CAMBIO
                }
            };

            contactos = [contactoConductor];
            mostrarContactos();
            seleccionarContacto(contactoConductor.id);

            if (window.innerWidth <= 768) {
                document.querySelector('.contacts-list')?.classList.remove('active');
                document.querySelector('.chat-window')?.style.setProperty('display', 'flex');
            }

            localStorage.removeItem('reserva_seleccionada');
            localStorage.removeItem('viaje_seleccionado');
            localStorage.removeItem('chat_conductor_id');

        } catch (err) {
            console.error("Error cargando datos desde la reserva:", err);
            await cargarContactosDesdeReservas();
        }
    } else {
        await cargarContactosDesdeReservas();
    }

    const chatForm = document.querySelector('.chat-input-form');
    if (chatForm) {
        chatForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const inputField = this.querySelector('input[type="text"]');
            const mensaje = inputField.value.trim();
            if (mensaje && contactoActual) {
                enviarMensaje(mensaje);
                inputField.value = '';
            }
        });
    }

    const infoButton = document.querySelector('.chat-action-btn[title="Información del viaje"]');
    if (infoButton) {
        infoButton.addEventListener('click', () => {
            const tripInfoPanel = document.querySelector('.trip-info-panel');
            if (tripInfoPanel) {
                tripInfoPanel.style.display = tripInfoPanel.style.display === 'none' ? 'block' : 'none';
            }
        });
    }
    const btnVolver = document.getElementById('btnVolverReservas');
    if (btnVolver) {
        btnVolver.addEventListener('click', function () {
            window.location.href = "mis_reservas.html";
        });
    }
    const btnVolverHeader = document.getElementById('btnVolverReservasHeader');
    if (btnVolverHeader) {
        btnVolverHeader.addEventListener('click', function () {
            window.location.href = "mis_reservas.html";
        });
    }
});
async function cargarContactosDesdeReservas() {
    contactos = [];
    try {
        const res = await fetch(`${BASE_URL}/reservas/usuario/${usuarioLogueado}`);
        if (!res.ok) throw new Error("No se pudieron cargar tus reservas");

        const reservas = await res.json();

        for (const reserva of reservas) {
            const viajeRes = await fetch(`${BASE_URL}/viajes/${reserva.ID_Viaje}`);
            if (!viajeRes.ok) continue;
            const viajeData = await viajeRes.json();

            const conductorId = viajeData.ID_Usuario;
            const nombreReal = usuariosInfo[conductorId] || `Conductor #${conductorId}`; // CAMBIO

            contactos.push({
                id: conductorId,
                nombre: nombreReal,
                avatar: generarAvatarUrl(nombreReal, ""),
                estado: "online",
                viaje: {
                    origen: viajeData.Origen,
                    destino: viajeData.Destino,
                    fecha: new Date(viajeData.Fecha_Hora_Salida).toLocaleDateString(),
                    horaSalida: new Date(viajeData.Fecha_Hora_Salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    horaLlegada: "Estimada",
                    plazas: viajeData.Plazas_disponibles + 1,
                    plazasOcupadas: 1,
                    precio: viajeData.Coste,
                    conductor: nombreReal // CAMBIO
                }
            });
        }
        mostrarContactos();
        if (contactos.length > 0) seleccionarContacto(contactos[0].id);

    } catch (e) {
        alert("No se pudieron cargar los chats reales.");
        console.error(e);
    }
}

async function mostrarContactos() {
    const container = document.querySelector('.contacts-list-container');
    if (!container) return;

    container.innerHTML = '';

    for (const contacto of contactos) {
        try {
            const mensajes = await cargarMensajesReales(contacto.id);

            let ultimoMensaje = '';
            let horaUltimoMensaje = '';

            if (mensajes && mensajes.length > 0) {
                const ultimo = mensajes[mensajes.length - 1];
                ultimoMensaje = ultimo.Mensaje || '';
                horaUltimoMensaje = formatearHora(new Date(ultimo.Fecha));
            }

            const div = document.createElement('div');
            div.classList.add('contact-item');
            div.setAttribute('data-id', contacto.id);

            div.innerHTML = `
                <div class="contact-avatar"><img src="${contacto.avatar}" alt="${contacto.nombre}"></div>
                <div class="contact-info">
                    <div class="contact-name">
                        ${contacto.nombre}
                        ${horaUltimoMensaje ? `<span class="time">${horaUltimoMensaje}</span>` : ''}
                    </div>
                    <div class="contact-last-message">${ultimoMensaje}</div>
                    <div class="contact-status">
                        <span class="status-indicator ${contacto.estado}"></span>
                        ${formatearEstado(contacto.estado)}
                    </div>
                </div>`;
            div.addEventListener('click', () => seleccionarContacto(contacto.id));
            container.appendChild(div);

        } catch (error) {
            console.error(`Error al cargar mensajes para contacto ${contacto.id}:`, error);

            const div = document.createElement('div');
            div.classList.add('contact-item');
            div.setAttribute('data-id', contacto.id);

            div.innerHTML = `
                <div class="contact-avatar"><img src="${contacto.avatar}" alt="${contacto.nombre}"></div>
                <div class="contact-info">
                    <div class="contact-name">${contacto.nombre}</div>
                    <div class="contact-last-message">Sin mensajes</div>
                    <div class="contact-status">
                        <span class="status-indicator ${contacto.estado}"></span>
                        ${formatearEstado(contacto.estado)}
                    </div>
                </div>`;
            div.addEventListener('click', () => seleccionarContacto(contacto.id));
            container.appendChild(div);
        }
    }
}

function seleccionarContacto(contactoId) {
    mensajesActuales = [];
    contactoActual = contactos.find(c => c.id === parseInt(contactoId));
    if (!contactoActual) return;

    document.querySelectorAll('.contact-item').forEach(el => {
        el.classList.toggle('active', parseInt(el.dataset.id) === parseInt(contactoId));
    });

    actualizarCabeceraChatContacto(contactoActual);
    actualizarInformacionViaje(contactoActual.viaje);

    document.title = `Chat con ${contactoActual.nombre} - GreenDrive`;

    const container = document.querySelector('.chat-messages-container');
    if (container) {
        container.innerHTML = `
            <div class="loading-state" style="text-align: center; padding: 40px;">
                <div style="margin-bottom: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 36px; color: #10b981;"></i>
                </div>
                <p>Cargando mensajes...</p>
            </div>
        `;
    }

    cargarMensajesReales(contactoId).then(mensajes => {
        mensajesActuales = mensajes || [];
        mostrarMensajes();
    }).catch(error => {
        console.error("Error al cargar mensajes:", error);
        mensajesActuales = [];
        mostrarMensajes();
    });
}

async function cargarMensajesReales(contactoId) {
    try {
        const res = await fetch(`${BASE_URL}/mensajes/${usuarioLogueado}/${contactoId}`);
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || `Error ${res.status}: ${res.statusText}`);
        }
        return await res.json();
    } catch (err) {
        console.error("Error al cargar mensajes:", err);
        throw err;
    }
}

function mostrarMensajes() {
    const container = document.querySelector('.chat-messages-container');
    const chatWindow = document.querySelector('.chat-window');
    const inputContainer = document.querySelector('.chat-input-container');
    if (!container) return;

    container.innerHTML = '';

    if (!contactoActual) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="far fa-comments"></i>
                <h3>Selecciona un chat</h3>
                <p>Elige un conductor para ver tus mensajes</p>
            </div>
        `;
        return;
    }

    if (!mensajesActuales || mensajesActuales.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="far fa-comments"></i>
                <h3>No hay mensajes aún</h3>
                <p>Comienza la conversación enviando un mensaje</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `<div class="message-day"><span>Hoy</span></div>`;

    mensajesActuales.forEach(m => {
        const esEntrante = m.Remitente !== usuarioLogueado;
        const div = document.createElement('div');
        div.className = `message ${esEntrante ? 'incoming' : 'outgoing'}`;

        const avatarUrl = esEntrante ?
            (contactoActual.avatar || generarAvatarUrl(contactoActual.nombre, '')) :
            generarAvatarUrl('Tú', '');

        div.innerHTML = `
            <div class="message-avatar">
                <img src="${avatarUrl}" alt="${esEntrante ? contactoActual.nombre : 'Tú'}">
            </div>
            <div class="message-content">
                <div class="message-text">${m.Mensaje}</div>
                <div class="message-time">${formatearHora(new Date(m.Fecha))}</div>
                ${!esEntrante ? `<div class="message-status">
                    <span>${m.Leido ? 'Leído' : 'Enviado'}</span>
                    <i class="fas fa-check-double ${m.Leido ? 'read' : ''}"></i>
                </div>` : ''}
            </div>
        `;
        container.appendChild(div);
    });

    if (chatWindow) {
        chatWindow.style.display = 'flex';
        chatWindow.style.flexDirection = 'column';
    }

    if (inputContainer) {
        inputContainer.style.display = 'block';
        inputContainer.style.position = 'sticky';
        inputContainer.style.bottom = '0';
        inputContainer.style.backgroundColor = 'var(--white)';
        inputContainer.style.zIndex = '10';
    }

    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);

    const inputField = document.querySelector('.chat-input-field input');
    if (inputField) {
        setTimeout(() => {
            inputField.focus();
        }, 100);
    }
}

async function enviarMensaje(texto) {
    if (!contactoActual) return;

    const mensajeData = {
        Remitente: usuarioLogueado,
        Destinatario: contactoActual.id,
        Mensaje: texto
    };

    try {
        const res = await fetch(`${BASE_URL}/mensajes/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mensajeData)
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || `Error ${res.status}: ${res.statusText}`);
        }

        cargarMensajesReales(contactoActual.id).then(mensajes => {
            mensajesActuales = mensajes;
            mostrarMensajes();
            mostrarContactos();
            const container = document.querySelector('.chat-messages-container');
            if (container) {
                setTimeout(() => {
                    container.scrollTop = container.scrollHeight;
                }, 100);
            }
        });

    } catch (err) {
        console.error("Error al enviar mensaje:", err);
        alert("No se pudo enviar el mensaje. Intente nuevamente.");
    }
}

function actualizarCabeceraChatContacto(contacto) {
    if (!contacto) return;

    const avatarElement = document.querySelector('.chat-contact-avatar img');
    const nameElement = document.querySelector('.chat-contact-details h3');
    const statusElement = document.querySelector('.chat-contact-details .contact-status');

    if (avatarElement) {
        avatarElement.src = contacto.avatar;
        avatarElement.alt = contacto.nombre;
    }

    if (nameElement) {
        nameElement.textContent = contacto.nombre;
    }

    if (statusElement) {
        statusElement.innerHTML = `
            <span class="status-indicator ${contacto.estado}"></span>
            ${formatearEstado(contacto.estado)}
        `;
    }
}

function actualizarInformacionViaje(viajeInfo) {
    if (!viajeInfo) return;
    const panel = document.querySelector('.trip-info-panel');
    if (!panel) return;
    const origenElement = panel.querySelector('.route-point:first-child .city');
    const destinoElement = panel.querySelector('.route-point:last-child .city');
    const horaSalidaElement = panel.querySelector('.route-point:first-child .time');
    const horaLlegadaElement = panel.querySelector('.route-point:last-child .time');

    if (origenElement) origenElement.textContent = viajeInfo.origen || "";
    if (destinoElement) destinoElement.textContent = viajeInfo.destino || "";
    if (horaSalidaElement) horaSalidaElement.textContent = viajeInfo.horaSalida || "";
    if (horaLlegadaElement) horaLlegadaElement.textContent = viajeInfo.horaLlegada || "";
    const fechaElement = panel.querySelector('.detail-item:nth-child(1) .detail-value');
    const precioElement = panel.querySelector('.detail-item:nth-child(2) .detail-value');
    const conductorElement = panel.querySelector('.detail-item:nth-child(3) .detail-value');
    const plazasElement = panel.querySelector('.detail-item:nth-child(4) .detail-value');

    if (fechaElement) fechaElement.textContent = viajeInfo.fecha || "";
    if (precioElement) precioElement.textContent = viajeInfo.precio ? `${viajeInfo.precio}€ por persona` : "";
    let conductorId = contactoActual?.id || "";
    if (conductorElement) conductorElement.textContent = usuariosInfo[conductorId] || viajeInfo.conductor || "";

    if (plazasElement) plazasElement.textContent =
        typeof viajeInfo.plazas === 'number' && typeof viajeInfo.plazasOcupadas === 'number'
            ? `${viajeInfo.plazasOcupadas} ocupadas (${viajeInfo.plazas - viajeInfo.plazasOcupadas} disponible)`
            : "";
}

function formatearHora(fecha) {
    if (!(fecha instanceof Date) || isNaN(fecha)) return '00:00';
    return fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatearEstado(estado) {
    if (estado === 'online') return 'En línea';
    if (estado === 'away') return 'Ausente';
    return 'Desconectado';
}

function generarAvatarUrl(nombre, apellido) {
    const iniciales = nombre
        ? nombre.split(' ').map(p => p[0]).join('').toUpperCase().substring(0,2)
        : '?';
    return `https://ui-avatars.com/api/?name=${iniciales}&background=random&color=fff&rounded=true&size=100`;
}

function configurarVistaMovil() {
    const backButton = document.querySelector('.back-to-contacts');
    if (!backButton) return;

    backButton.addEventListener('click', () => {
        const contactsList = document.querySelector('.contacts-list');
        const chatWindow = document.querySelector('.chat-window');

        if (contactsList) contactsList.classList.add('active');
        if (chatWindow) chatWindow.style.display = 'none';

        contactoActual = null;
        mensajesActuales = [];

        document.title = "Mensajería - GreenDrive";
    });

    document.addEventListener('click', function (event) {
        const contactItem = event.target.closest('.contact-item');
        if (contactItem && window.innerWidth <= 768) {
            const contactsList = document.querySelector('.contacts-list');
            const chatWindow = document.querySelector('.chat-window');
            if (contactsList) contactsList.classList.remove('active');
            if (chatWindow) chatWindow.style.display = 'flex';
        }
    });

    const ajustarVistas = () => {
        const contactsList = document.querySelector('.contacts-list');
        const chatWindow = document.querySelector('.chat-window');
        if (window.innerWidth > 768) {
            if (contactsList) contactsList.classList.remove('active');
            if (chatWindow) chatWindow.style.display = 'flex';
        } else {
            if (!contactoActual) {
                if (contactsList) contactsList.classList.add('active');
                if (chatWindow) chatWindow.style.display = 'none';
            }
        }
    };

    ajustarVistas();
    window.addEventListener('resize', ajustarVistas);
}

function ajustarLayoutChat() {
    const chatSection = document.querySelector('.chat-section');
    const chatWindow = document.querySelector('.chat-window');
    const messagesContainer = document.querySelector('.chat-messages-container');
    const inputContainer = document.querySelector('.chat-input-container');
    if (chatSection && chatWindow && messagesContainer && inputContainer) {
        const chatHeaderHeight = document.querySelector('.chat-header')?.offsetHeight || 0;
        const inputContainerHeight = inputContainer.offsetHeight;
        messagesContainer.style.height = `calc(100% - ${chatHeaderHeight + inputContainerHeight}px)`;
        messagesContainer.style.maxHeight = `calc(100% - ${chatHeaderHeight + inputContainerHeight}px)`;
        messagesContainer.style.minHeight = '200px';
        messagesContainer.style.overflowY = 'auto';
        messagesContainer.style.paddingBottom = '20px';
        inputContainer.style.flexShrink = '0';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}
