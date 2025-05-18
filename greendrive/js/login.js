const BASE_URL = "http://13.50.166.206:8000";


document.addEventListener('DOMContentLoaded', function() {
    const resultado = document.getElementById("resultado");
    initPasswordValidation();
    initLoginForm();
    initRegisterForm();
});
function initPasswordValidation() {
    const passwordInput = document.getElementById("password");
    const segmentLength = document.getElementById("segment-length");
    const segmentUppercase = document.getElementById("segment-uppercase");
    const segmentNumber = document.getElementById("segment-number");
    const toggleButton = document.getElementById("togglePassword");
    if (toggleButton && passwordInput) {
        toggleButton.addEventListener("click", function() {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            if (type === "password") {
                toggleButton.innerHTML = `
                    <svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    </svg>
                `;
            } else {
                toggleButton.innerHTML = `
                    <svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                    </svg>
                `;
            }
        });
    }
    if (passwordInput && segmentLength && segmentUppercase && segmentNumber) {
        function checkPassword() {
            const value = passwordInput.value;
            if (value.length >= 8) {
                segmentLength.classList.remove("segment-inactive");
                segmentLength.classList.add("segment-length-active");
            } else {
                segmentLength.classList.remove("segment-length-active");
                segmentLength.classList.add("segment-inactive");
            }
            if (/[A-Z]/.test(value)) {
                segmentUppercase.classList.remove("segment-inactive");
                segmentUppercase.classList.add("segment-uppercase-active");
            } else {
                segmentUppercase.classList.remove("segment-uppercase-active");
                segmentUppercase.classList.add("segment-inactive");
            }
            if (/\d/.test(value)) {
                segmentNumber.classList.remove("segment-inactive");
                segmentNumber.classList.add("segment-number-active");
            } else {
                segmentNumber.classList.remove("segment-number-active");
                segmentNumber.classList.add("segment-inactive");
            }
        }
        passwordInput.addEventListener("input", checkPassword);
        passwordInput.addEventListener("keyup", checkPassword);
        passwordInput.addEventListener("change", checkPassword);
        checkPassword();
    }
}
function initRegisterForm() {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault(); // Evita el envío tradicional del formulario
            
            const resultado = document.getElementById("resultado");
            const formData = new FormData(registerForm);
            const password = formData.get("Contrasena");
            if (password && (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password))) {
                if (resultado) resultado.textContent = "La contraseña debe cumplir con todos los requisitos de seguridad.";
                showNotification("La contraseña debe cumplir con todos los requisitos de seguridad.", "error");
                return;
            }
            
            const data = {
                Nombre: formData.get("Nombre"),
                Apellido: formData.get("Apellido"),
                Email: formData.get("Email"),
                Telefono: formData.get("Telefono"),
                Contrasena: password,
                Tipo: formData.get("Tipo") || "Conductor" // Valor por defecto
            };
            
            try {
                if (resultado) resultado.textContent = "Registrando usuario...";
                
                const response = await fetch(`${BASE_URL}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    if (resultado) resultado.textContent = "Error en el registro: " + (errorData.detail || errorData.message || "Error desconocido");
                    showNotification("Error en el registro: " + (errorData.detail || errorData.message || "Error desconocido"), "error");
                    return;
                } 
                
                const responseData = await response.json();
                if (resultado) resultado.textContent = "Usuario creado correctamente.";
                showNotification("Usuario creado correctamente. Redirigiendo...", "success");
                localStorage.setItem('userId', responseData.ID_Usuario || "5"); // Si no hay ID en la respuesta, usamos 5 provisionalmente
                localStorage.setItem('userName', `${data.Nombre} ${data.Apellido}`);
                localStorage.setItem('userEmail', data.Email);
                setTimeout(() => {
                    const redirectPage = localStorage.getItem('redirectAfterLogin');
                    if (redirectPage) {
                        localStorage.removeItem('redirectAfterLogin');
                        window.location.href = redirectPage;
                    } else {
                        window.location.href = "perfil.html";
                    }
                }, 2000);
            } catch (error) {
                console.error("Error de conexión:", error);
                if (resultado) resultado.textContent = "Error de conexión: " + error.message;
                showNotification("Error de conexión: " + error.message, "error");
            }
        });
    }
}
function initLoginForm() {
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const resultado = document.getElementById("resultado");
            const formData = new FormData(loginForm);
            const data = {
                Email: formData.get("Email"),
                Contrasena: formData.get("Contrasena")
            };
            
            try {
                if (resultado) resultado.textContent = "Iniciando sesión...";
                
                const response = await fetch(`${BASE_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    if (resultado) resultado.textContent = "Error al iniciar sesión: " + (errorData.detail || errorData.message || "Credenciales incorrectas");
                    showNotification("Error al iniciar sesión: " + (errorData.detail || errorData.message || "Credenciales incorrectas"), "error");
                    return;
                }
                try {
                    const userResponse = await fetch(`${BASE_URL}/usuarios/email/${encodeURIComponent(data.Email)}`);
                    
                    if (!userResponse.ok) {
                        throw new Error("No se pudo obtener la información del usuario");
                    }
                    
                    const userData = await userResponse.json();
                    localStorage.setItem('userId', userData.ID_Usuario);
                    localStorage.setItem('userName', `${userData.Nombre} ${userData.Apellido}`);
                    localStorage.setItem('userEmail', userData.Email);
                    
                     const viajeParaReservar = localStorage.getItem('viajeParaReservar');
                    if (viajeParaReservar) {
                        localStorage.removeItem('viajeParaReservar');
                        window.location.href = `buscar_viaje.html?reservar=${viajeParaReservar}`;
                        return;
                    }

                    if (resultado) resultado.textContent = "Inicio de sesión correcto.";
                    showNotification("Inicio de sesión correcto. Redirigiendo...", "success");
                    setTimeout(() => {
                        const redirectPage = localStorage.getItem('redirectAfterLogin');
                        if (redirectPage) {
                            localStorage.removeItem('redirectAfterLogin');
                            window.location.href = redirectPage;
                        } else {
                            window.location.href = "perfil.html";
                        }
                    }, 2000);
                } catch (userError) {
                    console.error("Error obteniendo datos del usuario:", userError);
                    localStorage.setItem('userId', "5"); // ID de Stephen
                    localStorage.setItem('userName', "Stephen Garcia");
                    localStorage.setItem('userEmail', "joanstephen23@gmail.com");
                    
                    if (resultado) resultado.textContent = "Inicio de sesión correcto, pero no se pudo obtener toda la información del usuario.";
                    showNotification("Inicio de sesión correcto. Redirigiendo...", "success");
                    setTimeout(() => {
                        const redirectPage = localStorage.getItem('redirectAfterLogin');
                        if (redirectPage) {
                            localStorage.removeItem('redirectAfterLogin');
                            window.location.href = redirectPage;
                        } else {
                            window.location.href = "perfil.html";
                        }
                    }, 2000);
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                if (resultado) resultado.textContent = "Error de conexión: " + error.message;
                showNotification("Error de conexión: " + error.message, "error");
            }
        });
    }
}

/**
 * Muestra una notificación temporal
 */
function showNotification(mensaje, tipo) {
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