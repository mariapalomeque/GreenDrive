const BASE_URL = "http://localhost:8000";

document.addEventListener("DOMContentLoaded", function() {
    // Verificar usuario autenticado
    const userId = localStorage.getItem('userId');
    if (!userId) {
        // Ya se redirigirá desde session.js si no hay sesión
        return;
    }

    const publishForm = document.getElementById("publish-form");
    const roundTripFields = document.getElementById("round-trip-fields");
    const regularTripFields = document.getElementById("regular-trip-fields");
    const oneWayRadio = document.getElementById("one_way");
    const roundTripRadio = document.getElementById("round_trip");
    const regularRadio = document.getElementById("regular");

    // Mostrar/ocultar campos según la opción seleccionada
    if (oneWayRadio && roundTripRadio && regularRadio) {
        oneWayRadio.addEventListener("change", function() {
            if (this.checked) {
                if (roundTripFields) roundTripFields.style.display = "none";
                if (regularTripFields) regularTripFields.style.display = "none";
            }
        });

        roundTripRadio.addEventListener("change", function() {
            if (this.checked) {
                if (roundTripFields) roundTripFields.style.display = "block";
                if (regularTripFields) regularTripFields.style.display = "none";
            }
        });

        regularRadio.addEventListener("change", function() {
            if (this.checked) {
                if (roundTripFields) roundTripFields.style.display = "none";
                if (regularTripFields) regularTripFields.style.display = "block";
            }
        });
    }

    if (publishForm) {
        publishForm.addEventListener("submit", async function(e) {
            e.preventDefault();

            const formData = new FormData(publishForm);
            const tripType = formData.get("trip_type");
            const fecha = formData.get("fecha_salida");
            const hora = formData.get("hora_salida");
            // Crear fecha local desde la entrada del formulario
let fechaHoraLocal = new Date(`${fecha}T${hora}`);
// Ajustar la hora para compensar la diferencia con UTC
let fechaHoraUTC = new Date(Date.UTC(
    fechaHoraLocal.getFullYear(),
    fechaHoraLocal.getMonth(),
    fechaHoraLocal.getDate(),
    fechaHoraLocal.getHours(),
    fechaHoraLocal.getMinutes()
));

// Usar el ID del usuario de la sesión para todos los viajes
const userId = parseInt(localStorage.getItem('userId'));

const viajeData = {
    ID_Usuario: userId,
    Origen: formData.get("origen"),
    Destino: formData.get("destino"),
    Fecha_Hora_Salida: fechaHoraUTC.toISOString(),  // Usar la fecha UTC ajustada
    Plazas_disponibles: parseInt(formData.get("plazas")),
    Coste: parseFloat(formData.get("precio"))
};

            try {
                if (tripType === "one_way") {
                    await crearViaje(viajeData);
                } else if (tripType === "round_trip") {
                    await crearViaje(viajeData);

                    const fechaRegreso = formData.get("fecha_regreso");
                    const horaRegreso = formData.get("hora_regreso");

                    if (fechaRegreso && horaRegreso) {
                        // Crear fecha local de regreso desde la entrada del formulario
let fechaHoraRegresoLocal = new Date(`${fechaRegreso}T${horaRegreso}`);
// Ajustar la hora para compensar la diferencia con UTC
let fechaHoraRegresoUTC = new Date(Date.UTC(
    fechaHoraRegresoLocal.getFullYear(),
    fechaHoraRegresoLocal.getMonth(),
    fechaHoraRegresoLocal.getDate(),
    fechaHoraRegresoLocal.getHours(),
    fechaHoraRegresoLocal.getMinutes()
));

const viajeVueltaData = {
    ID_Usuario: userId,
    Origen: viajeData.Destino,
    Destino: viajeData.Origen,
    Fecha_Hora_Salida: fechaHoraRegresoUTC.toISOString(), // Usar la fecha UTC ajustada
    Plazas_disponibles: viajeData.Plazas_disponibles,
    Coste: viajeData.Coste
};

                        await crearViaje(viajeVueltaData);
                    }
                } else if (tripType === "regular") {
                    const repeatDays = formData.getAll("repeat_days").map(day => parseInt(day));
                    const fechaFin = new Date(formData.get("fecha_fin"));

                    if (repeatDays.length > 0 && !isNaN(fechaFin.getTime())) {
                        await crearViajesRegulares(viajeData, repeatDays, fechaFin, userId);
                    } else {
                        throw new Error("Para viajes regulares, selecciona al menos un día y una fecha final");
                    }
                }

                // Mostrar modal de éxito
                document.getElementById('modal-container').classList.add('active');
                document.getElementById('success-modal').classList.add('active');
                publishForm.reset();

            } catch (error) {
                // Mostrar modal de error
                const errorMessage = document.getElementById('error-message');
                errorMessage.textContent = error.message || "Ha ocurrido un error al publicar el viaje. Inténtalo de nuevo más tarde.";
                document.getElementById('modal-container').classList.add('active');
                document.getElementById('error-modal').classList.add('active');
            }
        });
    }

    // Establecer fecha mínima como hoy para los campos de fecha
    const camposFecha = document.querySelectorAll('input[type="date"]');
    if (camposFecha.length > 0) {
        const hoy = new Date();
        const fechaFormateada = hoy.toISOString().split('T')[0];
        camposFecha.forEach(campo => {
            campo.min = fechaFormateada;
        });
    }

    // Eventos para los modales
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
            document.getElementById('modal-container').classList.remove('active');
        });
    });

    // Botón aceptar en modal de éxito
    const successOkBtn = document.getElementById('success-ok');
    if (successOkBtn) {
        successOkBtn.addEventListener('click', () => {
            document.getElementById('success-modal').classList.remove('active');
            document.getElementById('modal-container').classList.remove('active');
            
        });
    }

    // Botón aceptar en modal de error
    const errorOkBtn = document.getElementById('error-ok');
    if (errorOkBtn) {
        errorOkBtn.addEventListener('click', () => {
            document.getElementById('error-modal').classList.remove('active');
            document.getElementById('modal-container').classList.remove('active');
        });
    }

    // Cerrar modales haciendo clic fuera del contenido
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
        modalContainer.addEventListener('click', event => {
            if (event.target === modalContainer) {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.classList.remove('active');
                });
                modalContainer.classList.remove('active');
            }
        });
    }
});

// Función para crear un viaje
async function crearViaje(viajeData) {
    const response = await fetch(`${BASE_URL}/viajes/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(viajeData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Error al crear el viaje");
    }

    return data;
}

// Función para crear viajes regulares
async function crearViajesRegulares(baseViajeData, repeatDays, fechaFin, userId) {
    // Fecha inicial (usamos la del viaje base)
    let currentDate = new Date(baseViajeData.Fecha_Hora_Salida);
    const hora = currentDate.getHours();
    const minutos = currentDate.getMinutes();

    // Crear el primer viaje (el de la fecha seleccionada)
    await crearViaje(baseViajeData);

    // Avanzar al siguiente día
    currentDate.setDate(currentDate.getDate() + 1);

    // Crear viajes para cada semana hasta la fecha final
    while (currentDate <= fechaFin) {
        const diaSemana = currentDate.getDay(); // 0=Dom, 1=Lun, ..., 6=Sáb

        if (repeatDays.includes(diaSemana)) {
            const nuevaFechaHora = new Date(currentDate);
            nuevaFechaHora.setHours(hora, minutos, 0, 0);

            const nuevoViajeData = {
                ...baseViajeData,
                ID_Usuario: userId,
                Fecha_Hora_Salida: nuevaFechaHora.toISOString()
            };

            await crearViaje(nuevoViajeData);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
}

// Script para evitar que se seleccione la misma ciudad en origen y destino
document.addEventListener('DOMContentLoaded', function() {
    const origenSelect = document.getElementById('origen');
    const destinoSelect = document.getElementById('destino');

    function actualizarOpciones() {
        const origenValor = origenSelect.value;
        const destinoValor = destinoSelect.value;

        Array.from(origenSelect.options).forEach(opt => { opt.disabled = false; });
        Array.from(destinoSelect.options).forEach(opt => { opt.disabled = false; });

        if (origenValor) {
            const destinoOpt = Array.from(destinoSelect.options).find(opt => opt.value === origenValor);
            if (destinoOpt) destinoOpt.disabled = true;
        }

        if (destinoValor) {
            const origenOpt = Array.from(origenSelect.options).find(opt => opt.value === destinoValor);
            if (origenOpt) origenOpt.disabled = true;
        }
    }

    if (origenSelect && destinoSelect) {
        origenSelect.addEventListener('change', actualizarOpciones);
        destinoSelect.addEventListener('change', actualizarOpciones);
        actualizarOpciones();
    }
});

const precioInput = document.getElementById('precio');
let precio = precioInput.value.replace(',', '.');
precio = parseFloat(precio);

