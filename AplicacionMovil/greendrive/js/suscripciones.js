// URL base para la API (si se necesita)
const BASE_URL = "http://localhost:8000";


// Nota: Este script puede ser guardado como 'js/suscripciones.js'
// y luego incluido en la página HTML para implementar la funcionalidad.

// Precios de los planes (mensual y anual)
const precios = {
    basico: {
        mensual: 12.99,
        anual: 9.99 // Precio mensual en plan anual
    },
    premium: {
        mensual: 19.99,
        anual: 14.99
    },
    corporativo: {
        mensual: 29.99,
        anual: 22.99
    }
};

// Cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const toggleSwitch = document.querySelector('.toggle-switch');
    const toggleLabels = document.querySelectorAll('.toggle-label');
    const planCards = document.querySelectorAll('.plan-card');
    const seleccionarBtns = document.querySelectorAll('.btn-seleccionar-plan');
    const modalContainer = document.getElementById('modal-container');
    const suscripcionModal = document.getElementById('suscripcion-modal');
    const confirmacionModal = document.getElementById('confirmacion-modal');
    const btnConfirmarSuscripcion = document.getElementById('btn-confirmar-suscripcion');
    const btnCerrarModal = document.querySelectorAll('.modal-close');
    const btnAceptarConfirmacion = document.getElementById('btn-aceptar-confirmacion');
    
    // Estado actual (mensual o anual)
    let periodoActual = 'mensual';
    
    // Inicializar precios
    actualizarPrecios();
    
    // Event listener para el toggle de precios
    if (toggleSwitch) {
        toggleSwitch.addEventListener('click', function() {
            this.classList.toggle('yearly');
            
            // Actualizar estado
            periodoActual = this.classList.contains('yearly') ? 'anual' : 'mensual';
            
            // Actualizar clases activas en las etiquetas
            toggleLabels.forEach(label => {
                label.classList.toggle('active');
            });
            
            // Actualizar precios mostrados
            actualizarPrecios();
        });
    }
    
    // Event listeners para los botones de selección de plan
    if (seleccionarBtns) {
        seleccionarBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Obtener datos del plan seleccionado
                const planCard = this.closest('.plan-card');
                const planNombre = planCard.getAttribute('data-plan');
                const planPrecio = precios[planNombre][periodoActual];
                const planPeriodo = periodoActual;
                
                // Abrir modal de confirmación
                abrirModalSuscripcion(planNombre, planPrecio, planPeriodo);
            });
        });
    }
    
    // Event listeners para cerrar modales
    if (btnCerrarModal) {
        btnCerrarModal.forEach(btn => {
            btn.addEventListener('click', cerrarModales);
        });
    }
    
    // Evento para el fondo del modal (cerrar al hacer clic fuera)
    if (modalContainer) {
        modalContainer.addEventListener('click', function(e) {
            if (e.target === this) {
                cerrarModales();
            }
        });
    }
    
    // Evento para el botón de confirmar suscripción
    if (btnConfirmarSuscripcion) {
        btnConfirmarSuscripcion.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Validar formulario
            const form = document.getElementById('suscripcion-form');
            if (form.checkValidity()) {
                // Ocultar modal de suscripción
                if (suscripcionModal) suscripcionModal.classList.remove('active');
                
                // Mostrar modal de confirmación
                if (confirmacionModal) confirmacionModal.classList.add('active');
                
                // Opcional: Enviar datos al servidor
                // procesarSuscripcion(form);
            } else {
                // Mostrar validaciones del navegador
                form.reportValidity();
            }
        });
    }
    
    // Evento para el botón de aceptar en la confirmación
    if (btnAceptarConfirmacion) {
        btnAceptarConfirmacion.addEventListener('click', function() {
            // Redirigir a la página de perfil o dashboard
            window.location.href = 'perfil.html';
        });
    }
    
    // Funcionalidad de FAQ
    const faqQuestions = document.querySelectorAll('.faq-question');
    if (faqQuestions) {
        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
                const answer = this.nextElementSibling;
                
                // Cerrar todas las demás respuestas
                document.querySelectorAll('.faq-answer').forEach(item => {
                    if (item !== answer) {
                        item.style.display = 'none';
                    }
                });
                
                // Alternar la visibilidad de esta respuesta
                if (answer.style.display === 'block') {
                    answer.style.display = 'none';
                } else {
                    answer.style.display = 'block';
                }
                
                // Rotar el icono
                this.querySelector('i').classList.toggle('fa-rotate-180');
            });
        });
    }
    
    // Event listeners para la comparativa
    const compareToggles = document.querySelectorAll('.compare-toggle');
    if (compareToggles) {
        compareToggles.forEach(toggle => {
            toggle.addEventListener('click', function() {
                // Obtener la categoría a mostrar
                const category = this.getAttribute('data-category');
                
                // Actualizar clases activas
                compareToggles.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Mostrar/ocultar las filas correspondientes
                document.querySelectorAll('.compare-table tbody tr').forEach(row => {
                    if (category === 'all' || row.classList.contains(category)) {
                        row.style.display = 'table-row';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        });
    }
    
    // Función para actualizar los precios mostrados
    function actualizarPrecios() {
        planCards.forEach(card => {
            const planType = card.getAttribute('data-plan');
            const priceElement = card.querySelector('.price-value');
            const saveElement = card.querySelector('.price-save');
            
            if (priceElement && planType && precios[planType]) {
                // Actualizar el precio mostrado
                const precio = precios[planType][periodoActual];
                priceElement.innerHTML = `<span class="currency">€</span>${precio}<span>.99</span>`;
                
                // Actualizar el texto de periodo
                const periodElement = card.querySelector('.price-period');
                if (periodElement) {
                    periodElement.textContent = periodoActual === 'mensual' 
                        ? 'por mes' 
                        : 'por mes (facturado anualmente)';
                }
                
                // Mostrar el ahorro para planes anuales
                if (saveElement) {
                    if (periodoActual === 'anual') {
                        const ahorroMensual = precios[planType].mensual - precios[planType].anual;
                        const ahorroPorcentaje = Math.round((ahorroMensual / precios[planType].mensual) * 100);
                        saveElement.textContent = `Ahorras un ${ahorroPorcentaje}%`;
                        saveElement.style.display = 'block';
                    } else {
                        saveElement.style.display = 'none';
                    }
                }
            }
        });
    }
    
    // Función para abrir el modal de suscripción
    function abrirModalSuscripcion(plan, precio, periodo) {
        // Actualizar los detalles del plan en el modal
        const modalTitle = document.querySelector('#suscripcion-modal .modal-title');
        const modalPrice = document.querySelector('#suscripcion-modal .modal-price');
        const modalPeriod = document.querySelector('#suscripcion-modal .modal-period');
        const planInput = document.querySelector('#suscripcion-form input[name="plan"]');
        const precioInput = document.querySelector('#suscripcion-form input[name="precio"]');
        const periodoInput = document.querySelector('#suscripcion-form input[name="periodo"]');
        
        if (modalTitle) modalTitle.textContent = `Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`;
        if (modalPrice) modalPrice.textContent = `€${precio}`;
        if (modalPeriod) modalPeriod.textContent = periodo === 'mensual' ? 'al mes' : 'al mes (facturado anualmente)';
        
        // Actualizar los valores ocultos del formulario
        if (planInput) planInput.value = plan;
        if (precioInput) precioInput.value = precio;
        if (periodoInput) periodoInput.value = periodo;
        
        // Mostrar el modal
        if (modalContainer) modalContainer.classList.add('active');
        if (suscripcionModal) suscripcionModal.classList.add('active');
    }
    
    // Función para cerrar todos los modales
    function cerrarModales() {
        if (modalContainer) modalContainer.classList.remove('active');
        if (suscripcionModal) suscripcionModal.classList.remove('active');
        if (confirmacionModal) confirmacionModal.classList.remove('active');
    }
    
    // Opcional: Enviar datos de suscripción al servidor
    async function procesarSuscripcion(form) {
        try {
            const formData = new FormData(form);
            const datos = Object.fromEntries(formData.entries());
            
            const response = await fetch(`${BASE_URL}/suscripciones/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos)
            });
            
            if (!response.ok) {
                throw new Error('Error al procesar la suscripción');
            }
            
            const result = await response.json();
            console.log('Suscripción procesada:', result);
            
            // Mostrar confirmación
            if (suscripcionModal) suscripcionModal.classList.remove('active');
            if (confirmacionModal) confirmacionModal.classList.add('active');
            
        } catch (error) {
            console.error('Error:', error);
            // Mostrar mensaje de error
            alert('Ha ocurrido un error al procesar la suscripción. Por favor, inténtalo de nuevo.');
        }
    }
    
    // Inicialización de calculadora de ahorro
    const calculadoraBtn = document.getElementById('calcular-ahorro-btn');
    if (calculadoraBtn) {
        calculadoraBtn.addEventListener('click', function() {
            const viajesInput = document.getElementById('viajes-mensuales');
            const planSelect = document.getElementById('plan-calculadora');
            
            if (viajesInput && planSelect) {
                const viajesMensuales = parseInt(viajesInput.value) || 0;
                const planSeleccionado = planSelect.value;
                
                if (viajesMensuales > 0 && planSeleccionado) {
                    calcularAhorro(viajesMensuales, planSeleccionado);
                } else {
                    alert('Por favor, ingresa un número válido de viajes y selecciona un plan.');
                }
            }
        });
    }
    
    // Función para calcular y mostrar el ahorro
    function calcularAhorro(viajes, plan) {
        // Costo promedio de un viaje sin suscripción (ejemplo)
        const costoPromedioViaje = 15;
        
        // Costo total sin suscripción
        const costoSinSuscripcion = viajes * costoPromedioViaje;
        
        // Costo de la suscripción
        const costoSuscripcion = precios[plan][periodoActual];
        
        // Calcular ahorro
        const ahorro = costoSinSuscripcion - costoSuscripcion;
        const ahorroAnual = ahorro * 12;
        const porcentajeAhorro = Math.round((ahorro / costoSinSuscripcion) * 100);
        
        // Mostrar resultados
        const resultadoElement = document.getElementById('calculadora-resultado');
        if (resultadoElement) {
            if (ahorro > 0) {
                resultadoElement.innerHTML = `
                    <div class="calculadora-ahorro-positivo">
                        <h3>¡Podrías ahorrar!</h3>
                        <div class="ahorro-cantidad">€${ahorro.toFixed(2)}</div>
                        <div class="ahorro-mensual">al mes (${porcentajeAhorro}% de ahorro)</div>
                        <div class="ahorro-anual">Eso es €${ahorroAnual.toFixed(2)} al año</div>
                        <button class="btn-primary mt-4" onclick="document.querySelector('.toggle-switch').click(); document.getElementById('plan-${plan}').scrollIntoView({behavior: 'smooth'})">
                            Ver plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}
                        </button>
                    </div>
                `;
            } else {
                resultadoElement.innerHTML = `
                    <div class="calculadora-sin-ahorro">
                        <h3>Con tu cantidad actual de viajes</h3>
                        <p>La suscripción podría no ser la opción más económica para ti en este momento.</p>
                        <p>Te recomendamos considerar una suscripción si realizas más de ${Math.ceil(costoSuscripcion / costoPromedioViaje)} viajes al mes.</p>
                    </div>
                `;
            }
            
            resultadoElement.style.display = 'block';
            resultadoElement.scrollIntoView({behavior: 'smooth'});
        }
    }
});