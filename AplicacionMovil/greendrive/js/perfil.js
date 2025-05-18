const BASE_URL = "http://13.50.166.206:8000";

function obtenerIdUsuarioActual() {
    let userId = localStorage.getItem('userId');
    if (!userId) return null;
    return parseInt(userId);
}

document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .form-input, .form-textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            margin-top: 5px;
        }
        .form-textarea {
            min-height: 100px;
            resize: vertical;
        }
        .form-group {
            margin-bottom: 15px;
        }
        .form-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 15px;
        }
        .nuevo-vehiculo-form, .editar-vehiculo-form {
            background-color: #f9fafb;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        .preference-checkboxes {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
        }
        .pref-checkbox-label {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 5px 12px;
            background-color: #f3f4f6;
            border-radius: 20px;
            font-size: 0.875rem;
            color: #6b7280;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .pref-checkbox-label.is-selected {
            background-color: #d1fae5;
            color: #10b981;
        }
        .pref-checkbox-label:hover {
            background-color: #d1fae5;
            color: #10b981;
        }
        .pref-checkbox {
            position: absolute;
            opacity: 0;
            height: 0;
            width: 0;
        }
        .notificacion {
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease-in-out;
        }
    `;
    document.head.appendChild(style);
    const editarInfoBtn = document.querySelector('.content-card-header .btn-secondary');
    const anadirVehiculoBtn = document.querySelector('.content-card-header .btn-primary');
    const guardarCambiosBtn = document.querySelector('.action-buttons .btn-primary');
    const cancelarCambiosBtn = document.querySelector('.action-buttons .btn-secondary');
    if (editarInfoBtn) {
        editarInfoBtn.addEventListener('click', function() {
            if (this.classList.contains('modo-edicion')) {
                guardarInformacionPersonal();
            } else {
                mostrarFormularioEdicionPersonal();
            }
        });
    }
    if (anadirVehiculoBtn) {
        anadirVehiculoBtn.addEventListener('click', mostrarFormularioNuevoVehiculo);
    }
    if (guardarCambiosBtn) {
        guardarCambiosBtn.addEventListener('click', function() {
            const modoEdicionBtn = document.querySelector('.modo-edicion');
            if (modoEdicionBtn) modoEdicionBtn.click();
            const guardarVehiculoBtn = document.querySelector('.guardar-vehiculo');
            if (guardarVehiculoBtn) guardarVehiculoBtn.click();
            const guardarEdicionVehiculoBtn = document.querySelector('.guardar-edicion-vehiculo');
            if (guardarEdicionVehiculoBtn) guardarEdicionVehiculoBtn.click();
            const guardarPrefBtn = document.querySelector('.btn-guardar-preferencias');
            if (guardarPrefBtn) guardarPrefBtn.click();
            if (!modoEdicionBtn && !guardarVehiculoBtn && !guardarEdicionVehiculoBtn && !guardarPrefBtn) {
                mostrarNotificacion('No hay cambios pendientes por guardar', 'success');
            }
        });
    }
    if (cancelarCambiosBtn) {
        cancelarCambiosBtn.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que deseas cancelar todos los cambios?')) {
                window.location.reload();
            }
        });
    }
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('guardar-vehiculo')) {
            guardarNuevoVehiculo();
        } else if (e.target.classList.contains('cancelar-vehiculo')) {
            const formulario = document.querySelector('.nuevo-vehiculo-form');
            if (formulario) formulario.remove();
        } else if (e.target.classList.contains('btn-editar-vehiculo')) {
            const idVehiculo = e.target.getAttribute('data-id');
            if (idVehiculo) mostrarFormularioEditarVehiculo(idVehiculo);
        } else if (e.target.classList.contains('btn-eliminar-vehiculo')) {
            const idVehiculo = e.target.getAttribute('data-id');
            if (idVehiculo) eliminarVehiculo(idVehiculo);
        } else if (e.target.classList.contains('guardar-edicion-vehiculo')) {
            const idVehiculo = e.target.getAttribute('data-id');
            if (idVehiculo) guardarEdicionVehiculo(idVehiculo);
        } else if (e.target.classList.contains('cancelar-edicion-vehiculo')) {
            const idVehiculo = e.target.getAttribute('data-id');
            if (idVehiculo) cancelarEdicionVehiculo(idVehiculo);
        }
        if (e.target.closest('.btn-secondary') && e.target.closest('.content-card-header') && 
            e.target.closest('.content-card').querySelector('.preferences-section')) {
            const btn = e.target.closest('.btn-secondary');
            if (btn.classList.contains('btn-guardar-preferencias')) {
                guardarPreferencias();
            } else {
                mostrarEdicionPreferencias();
            }
        }
    });
    cargarDatosUsuario();
    cargarVehiculos();
    cargarPreferencias();
function cargarDatosUsuario() {
    const userId = obtenerIdUsuarioActual();
    if (!userId) return;
    
    fetch(`http://13.50.166.206:8000/usuarios/${userId}`)
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}: No se pudo obtener la información del usuario`);
            return response.json();
        })
        .then(usuario => {
            actualizarUIConDatosUsuario(usuario);
            cargarVehiculos();
        })
        .catch(error => {
            console.error('Error al cargar datos del usuario:', error);
            mostrarNotificacion('No se pudo cargar tu información. Usando datos de ejemplo.', 'error');
            const userName = localStorage.getItem('userName') || 'Usuario';
            const userEmail = localStorage.getItem('userEmail') || 'usuario@ejemplo.com';
            const usuarioEjemplo = {
                ID_Usuario: userId,
                Nombre: userName.split(' ')[0] || 'Usuario',
                Apellido: userName.split(' ').slice(1).join(' ') || '',
                Email: userEmail,
                Telefono: '123456789',
                Tipo: 'Conductor'
            };
            actualizarUIConDatosUsuario(usuarioEjemplo);
            cargarVehiculos();
        });
}

function actualizarUIConDatosUsuario(usuario) {
    const profileNameElements = document.querySelectorAll('.profile-name');
    profileNameElements.forEach(el => { 
        if (el) el.textContent = usuario.Nombre; 
    });
    const ubicacion = localStorage.getItem('userUbicacion') || 'Barcelona, España';
    const existingSeparateBio = document.querySelector('.bio-section');
    const bio = "Apasionado por viajar, explorar lugares nuevos y comprometido con el cuidado del medioambiente.";
    const personalInfoSection = document.querySelector('.personal-info-section');
    if (personalInfoSection) {
        personalInfoSection.innerHTML = `
            <div class="info-group">
                <div class="info-label">Nombre completo</div>
                <div class="info-value">${usuario.Nombre} ${usuario.Apellido}</div>
            </div>
            <div class="info-group">
                <div class="info-label">Correo electrónico</div>
                <div class="info-value">
                    <span>${usuario.Email}</span>
                    <i class="${usuario.Email.includes('@') ? 'fas fa-check-circle verified' : 'fas fa-exclamation-circle pending'}" 
                       title="${usuario.Email.includes('@') ? 'Verificado' : 'Pendiente de verificar'}"></i>
                </div>
            </div>
            <div class="info-group">
                <div class="info-label">Teléfono</div>
                <div class="info-value">
                    <span>${usuario.Telefono}</span>
                    <i class="fas fa-check-circle verified" title="Verificado"></i>
                </div>
            </div>
            <div class="info-group">
                <div class="info-label">Ubicación</div>
                <div class="info-value">${ubicacion}</div>
            </div>
        `;
        if (!existingSeparateBio) {
            const bioGroup = document.createElement('div');
            bioGroup.className = 'info-group bio-section';
            bioGroup.innerHTML = `
                <div class="info-label">Sobre mí</div>
                <div class="bio-text">${bio}</div>
            `;
            personalInfoSection.appendChild(bioGroup);
        }
    }
    if (existingSeparateBio) {
        const bioTextElement = existingSeparateBio.querySelector('.bio-text');
        if (bioTextElement) {
            bioTextElement.textContent = bio;
        }
    }
}
   
  function mostrarFormularioEdicionPersonal() {
    const personalInfoSection = document.querySelector('.personal-info-section');
    if (!personalInfoSection) return;
    const nombreCompletoElement = personalInfoSection.querySelector('.info-group:nth-child(1) .info-value');
    let nombreCompleto = '';
    if (nombreCompletoElement) nombreCompleto = nombreCompletoElement.textContent.trim();
    const emailElement = personalInfoSection.querySelector('.info-group:nth-child(2) .info-value span');
    const telefonoElement = personalInfoSection.querySelector('.info-group:nth-child(3) .info-value span');
    
    const email = emailElement ? emailElement.textContent.trim() : '';
    const telefono = telefonoElement ? telefonoElement.textContent.trim() : '';
    const nombreParts = nombreCompleto.split(' ');
    const nombre = nombreParts[0] || '';
    const apellido = nombreParts.slice(1).join(' ') || '';
    const ubicacionElement = personalInfoSection.querySelector('.info-group:nth-child(4) .info-value');
    const ubicacion = ubicacionElement ? ubicacionElement.textContent.trim() : 'Barcelona, España';
    localStorage.setItem('userUbicacion', ubicacion);
    personalInfoSection.innerHTML = `
        <div class="info-group">
            <div class="info-label">Nombre</div>
            <input type="text" id="input-nombre" class="form-input" value="${nombre}">
        </div>
        <div class="info-group">
            <div class="info-label">Apellido</div>
            <input type="text" id="input-apellido" class="form-input" value="${apellido}">
        </div>
        <div class="info-group">
            <div class="info-label">Correo electrónico</div>
            <input type="email" id="input-email" class="form-input" value="${email}">
        </div>
        <div class="info-group">
            <div class="info-label">Teléfono</div>
            <input type="tel" id="input-telefono" class="form-input" value="${telefono}">
        </div>
    `;
    if (editarInfoBtn) {
        editarInfoBtn.innerHTML = '<i class="fas fa-check"></i> Guardar';
        editarInfoBtn.classList.add('modo-edicion');
    }
}
function guardarInformacionPersonal() {
    const nombre = document.getElementById('input-nombre')?.value || '';
    const apellido = document.getElementById('input-apellido')?.value || '';
    const email = document.getElementById('input-email')?.value || '';
    const telefono = document.getElementById('input-telefono')?.value || '';
    const userId = obtenerIdUsuarioActual();
    if (!userId) return;
    const ubicacionElement = document.querySelector('.personal-info-section .info-group:nth-child(4) .info-value');
    const ubicacion = ubicacionElement ? ubicacionElement.textContent.trim() : 'Barcelona, España';
    
    const datosActualizados = {
        Nombre: nombre,
        Apellido: apellido,
        Email: email,
        Telefono: telefono,
        Contrasena: "password123", // Temporal
        Tipo: "Conductor"
    };
    
    fetch(`http://13.50.166.206:8000/usuarios/update/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.detail || 'Error al actualizar datos');
            });
        }
        return response.json();
    })
    .then(data => {
        localStorage.setItem('userName', `${nombre} ${apellido}`);
        localStorage.setItem('userEmail', email);
        mostrarNotificacion('Datos actualizados correctamente', 'success');
        const personalInfoSection = document.querySelector('.personal-info-section');
        if (personalInfoSection) {
            personalInfoSection.innerHTML = `
                <div class="info-group">
                    <div class="info-label">Nombre completo</div>
                    <div class="info-value">${nombre} ${apellido}</div>
                </div>
                <div class="info-group">
                    <div class="info-label">Correo electrónico</div>
                    <div class="info-value">
                        <span>${email}</span>
                        <i class="${email.includes('@') ? 'fas fa-check-circle verified' : 'fas fa-exclamation-circle pending'}" 
                           title="${email.includes('@') ? 'Verificado' : 'Pendiente de verificar'}"></i>
                    </div>
                </div>
                <div class="info-group">
                    <div class="info-label">Teléfono</div>
                    <div class="info-value">
                        <span>${telefono}</span>
                        <i class="fas fa-check-circle verified" title="Verificado"></i>
                    </div>
                </div>
                <div class="info-group">
                    <div class="info-label">Ubicación</div>
                    <div class="info-value">${ubicacion}</div>
                </div>
            `;
            const bioSectionExists = document.querySelector('.bio-section');
            if (!bioSectionExists) {
                personalInfoSection.innerHTML += `
                    <div class="info-group bio-section">
                        <div class="info-label">Sobre mí</div>
                        <div class="bio-text">Apasionado por viajar, explorar lugares nuevos y comprometido con el cuidado del medioambiente.</div>
                    </div>
                `;
            }
        }
        if (editarInfoBtn) {
            editarInfoBtn.innerHTML = '<i class="fas fa-pen"></i> Editar';
            editarInfoBtn.classList.remove('modo-edicion');
        }
    })
    .catch(error => {
        console.error('Error al actualizar usuario:', error);
        mostrarNotificacion('Error al guardar los cambios: ' + error.message, 'error');
    });
}
  function cargarVehiculos() {
    const userId = obtenerIdUsuarioActual();
    if (!userId) return;
    
    fetch(`http://13.50.166.206:8000/vehiculos/`)
        .then(response => {
            if (!response.ok) throw new Error('No se pudieron obtener los vehículos');
            return response.json();
        })
        .then(vehiculos => {
            const vehiculosUsuario = Array.isArray(vehiculos) 
                ? vehiculos.filter(v => v.ID_Usuario === parseInt(userId))
                : [];
            
            const vehiclesList = document.querySelector('.vehicles-list');
            if (!vehiclesList) return;
            
            vehiclesList.innerHTML = '';
            
            if (vehiculosUsuario.length === 0) {
                vehiclesList.innerHTML = `
                    <div class="no-vehicles">
                        No tienes vehículos registrados. ¡Añade uno haciendo clic en el botón "Añadir vehículo"!
                    </div>
                `;
                return;
            }
            
            vehiculosUsuario.forEach(vehiculo => {
                const vehiculoHTML = `
                <div class="vehicle-card" data-id="${vehiculo.ID_Vehiculo}">
                    <div class="vehicle-image">
                        <i class="fas fa-car"></i>
                    </div>
                    <div class="vehicle-info">
                        <div class="vehicle-title">
                            ${vehiculo.Marca} ${vehiculo.Modelo}
                            <div class="eco-badge">
                                <i class="fas fa-leaf"></i> Eco
                            </div>
                        </div>
                        <div class="vehicle-details">
                            <span>Matrícula: ${vehiculo.Matricula}</span>
                            <span>Plazas: ${vehiculo.Plazas_disponibles}</span>
                        </div>
                        <div class="vehicle-actions">
                            <button class="btn-secondary btn-sm btn-editar-vehiculo" data-id="${vehiculo.ID_Vehiculo}">
                                <i class="fas fa-pen"></i> Editar
                            </button>
                            <button class="btn-secondary btn-sm btn-eliminar-vehiculo" data-id="${vehiculo.ID_Vehiculo}">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>`;
                vehiclesList.insertAdjacentHTML('beforeend', vehiculoHTML);
            });
        })
        .catch(error => {
            console.error('Error al cargar vehículos:', error);
            const vehiclesList = document.querySelector('.vehicles-list');
            if (vehiclesList) {
                vehiclesList.innerHTML = `
                    <div class="no-vehicles">
                        Error al cargar vehículos. Intenta recargar la página.
                    </div>
                `;
            }
        });
}
   function mostrarFormularioNuevoVehiculo() {
    const vehiclesList = document.querySelector('.vehicles-list');
    if (!vehiclesList) return;
    const existingForm = vehiclesList.querySelector('.nuevo-vehiculo-form');
    if (existingForm) {
        existingForm.remove();
    }
    
    const formularioHTML = `
    <div class="nuevo-vehiculo-form">
        <div class="form-group">
            <label for="vehiculo-marca">Marca</label>
            <input type="text" id="vehiculo-marca" class="form-input" placeholder="Ej: Toyota">
        </div>
        <div class="form-group">
            <label for="vehiculo-modelo">Modelo</label>
            <input type="text" id="vehiculo-modelo" class="form-input" placeholder="Ej: Corolla">
        </div>
        <div class="form-group">
            <label for="vehiculo-matricula">Matrícula</label>
            <input type="text" id="vehiculo-matricula" class="form-input" placeholder="Ej: 1234ABC">
        </div>
        <div class="form-group">
            <label for="vehiculo-plazas">Plazas disponibles</label>
            <input type="number" id="vehiculo-plazas" class="form-input" value="4" min="1" max="9">
        </div>
        <div class="vehicle-actions">
            <button class="btn-primary guardar-vehiculo">
                <i class="fas fa-save"></i> Guardar
            </button>
            <button class="btn-secondary cancelar-vehiculo">
                <i class="fas fa-times"></i> Cancelar
            </button>
        </div>
    </div>`;
    if (vehiclesList.querySelector('.no-vehicles')) {
        vehiclesList.innerHTML = formularioHTML;
    } else {
        vehiclesList.insertAdjacentHTML('afterbegin', formularioHTML);
    }
}

   function guardarNuevoVehiculo() {
    const marca = document.getElementById('vehiculo-marca')?.value || '';
    const modelo = document.getElementById('vehiculo-modelo')?.value || '';
    const matricula = document.getElementById('vehiculo-matricula')?.value || '';
    const plazas = document.getElementById('vehiculo-plazas')?.value || 4;
    
    if (!marca || !modelo || !matricula) {
        mostrarNotificacion('Por favor completa todos los campos', 'error');
        return;
    }
    
    const userId = obtenerIdUsuarioActual();
    if (!userId) return;
    fetch(`http://13.50.166.206:8000/vehiculos/`)
        .then(response => {
            if (!response.ok) throw new Error('No se pudieron obtener los vehículos');
            return response.json();
        })
        .then(vehiculos => {
            const matriculaExiste = vehiculos.some(v => v.Matricula.toLowerCase() === matricula.toLowerCase());
            
            if (matriculaExiste) {
                mostrarNotificacion('Ya existe un vehículo con esta matrícula', 'error');
                return Promise.reject(new Error('Matrícula duplicada'));
            }
            const nuevoVehiculo = {
                ID_Usuario: parseInt(userId),
                Marca: marca,
                Modelo: modelo,
                Matricula: matricula,
                Plazas_disponibles: parseInt(plazas)
            };
            
            return fetch('http://13.50.166.206:8000/vehiculos/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoVehiculo),
            });
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.detail || 'Error al añadir vehículo');
                });
            }
            return response.json();
        })
        .then(data => {
            mostrarNotificacion('Vehículo añadido correctamente', 'success');
            const formulario = document.querySelector('.nuevo-vehiculo-form');
            if (formulario) formulario.remove();
            cargarVehiculos(); // Recargar la lista de vehículos
        })
        .catch(error => {
            if (error.message === 'Matrícula duplicada') {
                return;
            }
            console.error('Error al añadir vehículo:', error);
            mostrarNotificacion('Error al añadir vehículo: ' + error.message, 'error');
        });
}
    function mostrarFormularioEditarVehiculo(idVehiculo) {
    fetch(`http://13.50.166.206:8000/vehiculos/${idVehiculo}`)
        .then(response => {
            if (!response.ok) throw new Error('No se pudo obtener la información del vehículo');
            return response.json();
        })
        .then(vehiculo => {
            const vehiculoCard = document.querySelector(`.vehicle-card[data-id="${idVehiculo}"]`);
            if (!vehiculoCard) return;
            vehiculoCard.dataset.originalContent = vehiculoCard.innerHTML;
            
            vehiculoCard.innerHTML = `
            <div class="editar-vehiculo-form">
                <div class="form-group">
                    <label for="edit-vehiculo-marca">Marca</label>
                    <input type="text" id="edit-vehiculo-marca" class="form-input" value="${vehiculo.Marca}">
                </div>
                <div class="form-group">
                    <label for="edit-vehiculo-modelo">Modelo</label>
                    <input type="text" id="edit-vehiculo-modelo" class="form-input" value="${vehiculo.Modelo}">
                </div>
                <div class="form-group">
                    <label for="edit-vehiculo-matricula">Matrícula</label>
                    <input type="text" id="edit-vehiculo-matricula" class="form-input" value="${vehiculo.Matricula}">
                </div>
                <div class="form-group">
                    <label for="edit-vehiculo-plazas">Plazas disponibles</label>
                    <input type="number" id="edit-vehiculo-plazas" class="form-input" value="${vehiculo.Plazas_disponibles}" min="1" max="9">
                </div>
                <div class="vehicle-actions">
                    <button class="btn-primary guardar-edicion-vehiculo" data-id="${idVehiculo}">
                        <i class="fas fa-save"></i> Guardar
                    </button>
                    <button class="btn-secondary cancelar-edicion-vehiculo" data-id="${idVehiculo}">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>`;
        })
        .catch(error => {
            console.error('Error al obtener datos del vehículo:', error);
            mostrarNotificacion('Error al cargar datos del vehículo', 'error');
        });
}

   function guardarEdicionVehiculo(idVehiculo) {
    const marca = document.getElementById('edit-vehiculo-marca')?.value || '';
    const modelo = document.getElementById('edit-vehiculo-modelo')?.value || '';
    const matricula = document.getElementById('edit-vehiculo-matricula')?.value || '';
    const plazas = document.getElementById('edit-vehiculo-plazas')?.value || 4;
    
    if (!marca || !modelo || !matricula) {
        mostrarNotificacion('Por favor completa todos los campos', 'error');
        return;
    }
    
    const userId = obtenerIdUsuarioActual();
    if (!userId) return;
    fetch(`http://13.50.166.206:8000/vehiculos/`)
        .then(response => {
            if (!response.ok) throw new Error('No se pudieron obtener los vehículos');
            return response.json();
        })
        .then(vehiculos => {
            const matriculaDuplicada = vehiculos.some(v => 
                v.Matricula.toLowerCase() === matricula.toLowerCase() && 
                v.ID_Vehiculo !== parseInt(idVehiculo)
            );
            
            if (matriculaDuplicada) {
                mostrarNotificacion('Ya existe otro vehículo con esta matrícula', 'error');
                return Promise.reject(new Error('Matrícula duplicada'));
            }
            const vehiculoActualizado = {
                ID_Usuario: parseInt(userId),
                Marca: marca,
                Modelo: modelo,
                Matricula: matricula,
                Plazas_disponibles: parseInt(plazas)
            };
            
            return fetch(`http://13.50.166.206:8000/vehiculos/update/${idVehiculo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vehiculoActualizado),
            });
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.detail || 'Error al actualizar vehículo');
                });
            }
            return response.json();
        })
        .then(data => {
            mostrarNotificacion('Vehículo actualizado correctamente', 'success');
            cargarVehiculos(); // Recargar la lista completa
        })
        .catch(error => {
            if (error.message === 'Matrícula duplicada') {
                return;
            }
            console.error('Error al actualizar vehículo:', error);
            mostrarNotificacion('Error al actualizar vehículo: ' + error.message, 'error');
        });
}
   function cancelarEdicionVehiculo(idVehiculo) {
    const vehiculoCard = document.querySelector(`.vehicle-card[data-id="${idVehiculo}"]`);
    if (!vehiculoCard || !vehiculoCard.dataset.originalContent) return;
    
    vehiculoCard.innerHTML = vehiculoCard.dataset.originalContent;
    const editarBtn = vehiculoCard.querySelector('.btn-editar-vehiculo');
    const eliminarBtn = vehiculoCard.querySelector('.btn-eliminar-vehiculo');
    
    if (editarBtn) {
        editarBtn.addEventListener('click', function() {
            mostrarFormularioEditarVehiculo(idVehiculo);
        });
    }
    
    if (eliminarBtn) {
        eliminarBtn.addEventListener('click', function() {
            eliminarVehiculo(idVehiculo);
        });
    }
}

  function eliminarVehiculo(idVehiculo) {
    const existingModal = document.getElementById('modal-eliminar-vehiculo');
    if (existingModal) {
        existingModal.remove();
    }
    const modalHTML = `
    <div class="modal-overlay" id="modal-eliminar-vehiculo">
        <div class="modal-container">
            <div class="modal-header">
                <h3>Confirmar eliminación</h3>
                <button type="button" class="modal-close" id="btn-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>¿Estás seguro de que deseas eliminar este vehículo?</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" id="btn-modal-cancel">Cancelar</button>
                <button type="button" class="btn-primary btn-danger" id="btn-modal-confirm">Eliminar</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        }
        
        .modal-container {
            background-color: white;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            border-bottom: 1px solid #eee;
        }
        
        .modal-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #777;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 15px 20px;
            border-top: 1px solid #eee;
        }
        
        .btn-danger {
            background-color: #ef4444 !important;
            color: white !important;
        }
    `;
    document.head.appendChild(modalStyle);
    function closeModal() {
        const modal = document.getElementById('modal-eliminar-vehiculo');
        if (modal) {
            modal.remove();
        }
        if (modalStyle) {
            modalStyle.remove();
        }
    }
    const closeBtn = document.getElementById('btn-modal-close');
    const cancelBtn = document.getElementById('btn-modal-cancel');
    const confirmBtn = document.getElementById('btn-modal-confirm');
    if (closeBtn) {
        closeBtn.onclick = function() {
            closeModal();
        };
    }
    
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            closeModal();
        };
    }
    
    if (confirmBtn) {
        confirmBtn.onclick = function() {
            fetch(`http://13.50.166.206:8000/vehiculos/delete/${idVehiculo}`, {
                method: 'DELETE',
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => {
                        throw new Error(data.detail || 'Error al eliminar vehículo');
                    });
                }
                return response.json();
            })
            .then(data => {
                mostrarNotificacion('Vehículo eliminado correctamente', 'success');
                closeModal();
                cargarVehiculos(); // Recargar la lista de vehículos
            })
            .catch(error => {
                console.error('Error al eliminar vehículo:', error);
                mostrarNotificacion('Error al eliminar vehículo: ' + error.message, 'error');
                closeModal();
            });
        };
    }
    const modalOverlay = document.getElementById('modal-eliminar-vehiculo');
    if (modalOverlay) {
        modalOverlay.onclick = function(event) {
            if (event.target === modalOverlay) {
                closeModal();
            }
        };
    }
}

   function guardarPreferencias() {
    const musicaSeleccionada = Array.from(document.querySelectorAll('input[name="musica"]:checked')).map(input => input.value);
    const mascotasSeleccionada = Array.from(document.querySelectorAll('input[name="mascotas"]:checked')).map(input => input.value);
    const fumarSeleccionado = Array.from(document.querySelectorAll('input[name="fumar"]:checked')).map(input => input.value);
    localStorage.setItem('userPreferences', JSON.stringify({
        musica: musicaSeleccionada,
        mascotas: mascotasSeleccionada,
        fumar: fumarSeleccionado
    }));
    mostrarPreferenciasGuardadas();
    const editBtn = document.querySelector('.content-card .preferences-section').closest('.content-card').querySelector('.btn-secondary');
    if (editBtn) {
        editBtn.innerHTML = '<i class="fas fa-pen"></i> Editar';
        editBtn.classList.remove('btn-guardar-preferencias');
    }
    mostrarNotificacion('Preferencias guardadas correctamente', 'success');
}
function mostrarPreferenciasGuardadas() {
    const preferencesSection = document.querySelector('.preferences-section');
    if (!preferencesSection) return;
    const prefsJSON = localStorage.getItem('userPreferences');
    let prefs = {
        musica: ['Pop'], // Valores por defecto
        mascotas: ['Acepto mascotas pequeñas'],
        fumar: ['No permitido fumar']
    };
    
    if (prefsJSON) {
        try {
            const savedPrefs = JSON.parse(prefsJSON);
            prefs.musica = savedPrefs.musica?.length ? savedPrefs.musica : prefs.musica;
            prefs.mascotas = savedPrefs.mascotas?.length ? savedPrefs.mascotas : prefs.mascotas;
            prefs.fumar = savedPrefs.fumar?.length ? savedPrefs.fumar : prefs.fumar;
        } catch (e) {
            console.error('Error al parsear preferencias guardadas:', e);
        }
    }
    preferencesSection.innerHTML = `
        <div class="preference-group">
            <div class="preference-title"><i class="fas fa-music"></i> Música</div>
            <div class="preference-list">
                ${prefs.musica.map(pref => `<div class="preference-tag selected">${pref}</div>`).join('')}
            </div>
        </div>
        <div class="preference-group">
            <div class="preference-title"><i class="fas fa-paw"></i> Mascotas</div>
            <div class="preference-list">
                ${prefs.mascotas.map(pref => `<div class="preference-tag selected">${pref}</div>`).join('')}
            </div>
        </div>
        <div class="preference-group">
            <div class="preference-title"><i class="fas fa-smoking"></i> Fumar</div>
            <div class="preference-list">
                ${prefs.fumar.map(pref => `<div class="preference-tag selected">${pref}</div>`).join('')}
            </div>
        </div>
    `;
}

function cargarPreferencias() {
    const preferencesSection = document.querySelector('.preferences-section');
    if (!preferencesSection) return;
    const preferenciasGuardadas = localStorage.getItem('userPreferences');
    let preferencias = {
        musica: ['Pop'], // Valores por defecto
        mascotas: ['Acepto mascotas pequeñas'],
        fumar: ['No permitido fumar']
    };
    
    if (preferenciasGuardadas) {
        try {
            preferencias = JSON.parse(preferenciasGuardadas);
        } catch (e) {
            console.error('Error al cargar preferencias:', e);
        }
    }
    preferencesSection.innerHTML = `
        <div class="preference-group">
            <div class="preference-title"><i class="fas fa-music"></i> Música</div>
            <div class="preference-list">
                ${preferencias.musica.length > 0 
                    ? preferencias.musica.map(pref => `<div class="preference-tag selected">${pref}</div>`).join('') 
                    : '<div class="no-preferences">Sin preferencias de música seleccionadas</div>'}
            </div>
        </div>
        <div class="preference-group">
            <div class="preference-title"><i class="fas fa-paw"></i> Mascotas</div>
            <div class="preference-list">
                ${preferencias.mascotas.length > 0 
                    ? preferencias.mascotas.map(pref => `<div class="preference-tag selected">${pref}</div>`).join('') 
                    : '<div class="no-preferences">Sin preferencias de mascotas seleccionadas</div>'}
            </div>
        </div>
        <div class="preference-group">
            <div class="preference-title"><i class="fas fa-smoking"></i> Fumar</div>
            <div class="preference-list">
                ${preferencias.fumar.length > 0 
                    ? preferencias.fumar.map(pref => `<div class="preference-tag selected">${pref}</div>`).join('') 
                    : '<div class="no-preferences">Sin preferencias de fumar seleccionadas</div>'}
            </div>
        </div>
    `;
}


    function verificarMatriculaExistente(matricula) {
    return fetch(`http://13.50.166.206:8000/vehiculos/`)
        .then(response => {
            if (!response.ok) throw new Error('No se pudieron obtener los vehículos');
            return response.json();
        })
        .then(vehiculos => {
            return vehiculos.some(v => v.Matricula.toLowerCase() === matricula.toLowerCase());
        });
}
function mostrarEdicionPreferencias() {
    const preferencesSection = document.querySelector('.preferences-section');
    if (!preferencesSection) return;
    const prefsJSON = localStorage.getItem('userPreferences');
    let prefs = {
        musica: ['Pop'], // Valores por defecto
        mascotas: ['Acepto mascotas pequeñas'],
        fumar: ['No permitido fumar']
    };
    
    if (prefsJSON) {
        try {
            const savedPrefs = JSON.parse(prefsJSON);
            prefs.musica = savedPrefs.musica?.length ? savedPrefs.musica : prefs.musica;
            prefs.mascotas = savedPrefs.mascotas?.length ? savedPrefs.mascotas : prefs.mascotas;
            prefs.fumar = savedPrefs.fumar?.length ? savedPrefs.fumar : prefs.fumar;
        } catch (e) {
            console.error('Error al parsear preferencias guardadas:', e);
        }
    }
    const opciones = {
        musica: ['Pop', 'Rock', 'Clásica', 'Jazz', 'Electrónica', 'Hip-hop', 'Sin música'],
        mascotas: ['No acepto mascotas', 'Acepto mascotas pequeñas', 'Acepto todas las mascotas'],
        fumar: ['No permitido fumar', 'Se permite fumar', 'Indiferente']
    };
    preferencesSection.innerHTML = `
        <form id="preferencias-form">
            <div class="preference-group">
                <div class="preference-title"><i class="fas fa-music"></i> Música</div>
                <div class="preference-checkboxes">
                    ${opciones.musica.map(opcion => `
                        <label class="pref-checkbox-label ${prefs.musica.includes(opcion) ? 'is-selected' : ''}">
                            <input type="checkbox" class="pref-checkbox" name="musica" value="${opcion}" ${prefs.musica.includes(opcion) ? 'checked' : ''}>
                            ${opcion}
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="preference-group">
                <div class="preference-title"><i class="fas fa-paw"></i> Mascotas</div>
                <div class="preference-checkboxes">
                    ${opciones.mascotas.map(opcion => `
                        <label class="pref-checkbox-label ${prefs.mascotas.includes(opcion) ? 'is-selected' : ''}">
                            <input type="checkbox" class="pref-checkbox" name="mascotas" value="${opcion}" ${prefs.mascotas.includes(opcion) ? 'checked' : ''}>
                            ${opcion}
                        </label>
                    `).join('')}
                </div>
            </div>
            
            <div class="preference-group">
                <div class="preference-title"><i class="fas fa-smoking"></i> Fumar</div>
                <div class="preference-checkboxes">
                    ${opciones.fumar.map(opcion => `
                        <label class="pref-checkbox-label ${prefs.fumar.includes(opcion) ? 'is-selected' : ''}">
                            <input type="checkbox" class="pref-checkbox" name="fumar" value="${opcion}" ${prefs.fumar.includes(opcion) ? 'checked' : ''}>
                            ${opcion}
                        </label>
                    `).join('')}
                </div>
            </div>
        </form>
    `;
    const editBtn = document.querySelector('.content-card .preferences-section').closest('.content-card').querySelector('.btn-secondary');
    if (editBtn) {
        editBtn.innerHTML = '<i class="fas fa-check"></i> Guardar preferencias';
        editBtn.classList.add('btn-guardar-preferencias');
    }
    document.querySelectorAll('.pref-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.closest('.pref-checkbox-label');
            if (this.checked) {
                label.classList.add('is-selected');
            } else {
                label.classList.remove('is-selected');
            }
            if (this.name === 'mascotas' && this.checked) {
                document.querySelectorAll(`input[name="${this.name}"]`).forEach(cb => {
                    if (cb !== this) {
                        cb.checked = false;
                        cb.closest('.pref-checkbox-label').classList.remove('is-selected');
                    }
                });
            }
            if (this.name === 'fumar' && this.checked) {
                document.querySelectorAll(`input[name="${this.name}"]`).forEach(cb => {
                    if (cb !== this) {
                        cb.checked = false;
                        cb.closest('.pref-checkbox-label').classList.remove('is-selected');
                    }
                });
            }
        });
    });
}
function mostrarNotificacion(mensaje, tipo) {
    const notificacionExistente = document.querySelector('.notificacion');
    if (notificacionExistente) notificacionExistente.remove();
    
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    notificacion.style.position = 'fixed';
    notificacion.style.top = '20px';
    notificacion.style.right = '20px';
    notificacion.style.padding = '15px 20px';
    notificacion.style.borderRadius = '5px';
    notificacion.style.zIndex = '9999';
    notificacion.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    notificacion.style.opacity = '0';
    notificacion.style.transform = 'translateY(-10px)';
    notificacion.style.transition = 'all 0.3s ease';
    
    if (tipo === 'success') {
        notificacion.style.backgroundColor = '#D1FAE5';
        notificacion.style.color = '#059669';
        notificacion.style.border = '1px solid #059669';
    } else if (tipo === 'error') {
        notificacion.style.backgroundColor = '#FEE2E2';
        notificacion.style.color = '#DC2626';
        notificacion.style.border = '1px solid #DC2626';
    } else if (tipo === 'info') {
        notificacion.style.backgroundColor = '#E0F2FE';
        notificacion.style.color = '#0369A1';
        notificacion.style.border = '1px solid #0EA5E9';
    }
    
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.style.opacity = '1';
        notificacion.style.transform = 'translateY(0)';
    }, 10);
    
    setTimeout(() => {
        notificacion.style.opacity = '0';
        notificacion.style.transform = 'translateY(-10px)';
        setTimeout(() => { notificacion.remove(); }, 300);
    }, 3000);
}
    window.mostrarFormularioEdicionPersonal = mostrarFormularioEdicionPersonal;
    window.guardarInformacionPersonal = guardarInformacionPersonal;
    window.mostrarFormularioNuevoVehiculo = mostrarFormularioNuevoVehiculo;
    window.guardarNuevoVehiculo = guardarNuevoVehiculo;
    window.mostrarFormularioEditarVehiculo = mostrarFormularioEditarVehiculo;
    window.guardarEdicionVehiculo = guardarEdicionVehiculo;
    window.cancelarEdicionVehiculo = cancelarEdicionVehiculo;
    window.eliminarVehiculo = eliminarVehiculo;
    window.mostrarEdicionPreferencias = mostrarEdicionPreferencias;
    window.guardarPreferencias = guardarPreferencias;
});
