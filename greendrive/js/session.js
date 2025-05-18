document.addEventListener('DOMContentLoaded', function() {
    checkSession();
    const logoutButtons = document.querySelectorAll('.btn-logout');
    logoutButtons.forEach(button => {
        button.addEventListener('click', logout);
    });
    initMobileMenu();
});

function checkSession() {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    
    if (userId) {
        console.log('Sesión detectada, actualizando UI para:', userName);
        updateNavbarUserUI(userName);
        showLoggedInUI();
        checkProtectedPage();
    } else {
        console.log('No hay sesión activa');
        showLoggedOutUI();
        checkProtectedPage();
    }
}

function updateNavbarUserUI(userName) {
    const userIconElement = document.querySelector('.nav-user-icon, .user-avatar, [href="perfil.html"]');
    if (userIconElement) {
        userIconElement.innerHTML = '<i class="fas fa-user-circle"></i>';
        userIconElement.setAttribute('href', 'perfil.html');
        userIconElement.setAttribute('title', userName);
        userIconElement.style.display = 'flex';
        userIconElement.style.alignItems = 'center';
        userIconElement.style.justifyContent = 'center';
        userIconElement.style.width = '40px';
        userIconElement.style.height = '40px';
        userIconElement.style.borderRadius = '50%';
        userIconElement.style.backgroundColor = '#10b981';
        userIconElement.style.color = 'white';
        userIconElement.style.fontSize = '20px';
        userIconElement.style.textDecoration = 'none';
    }
    const loginButtons = document.querySelectorAll('a[href="inicio.html"], a[href="Inicio.html"], a[href="iniciar_sesion.html"], button.login-btn');
    const registerButtons = document.querySelectorAll('a[href="crear_cuenta.html"], a[href="registro.html"], a[href="registrarse.html"], button.register-btn');
    loginButtons.forEach(btn => { 
        if (btn) btn.style.display = 'none';
    });
    
    registerButtons.forEach(btn => { 
        if (btn) btn.style.display = 'none';
    });
    const authContainer = document.querySelector('.auth-buttons, .login-buttons, .user-menu');
    if (authContainer && !authContainer.querySelector('a[href="perfil.html"]')) {
        authContainer.innerHTML = `
            <a href="perfil.html" class="btn-user-icon" style="display:flex; align-items:center; justify-content:center; width:40px; height:40px; border-radius:50%; background-color:#10b981; color:white; font-size:20px; text-decoration:none;">
                <i class="fas fa-user-circle"></i>
            </a>
            <button class="btn-logout" style="margin-left:10px;">Cerrar sesión</button>
        `;
        const logoutBtn = authContainer.querySelector('.btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }

}

function showLoggedInUI() {
    const loggedOutElements = document.querySelectorAll('.logged-out-only, .guest-only');
    loggedOutElements.forEach(el => {
        el.style.display = 'none';
    });
    const loggedInElements = document.querySelectorAll('.logged-in-only, .user-only');
    loggedInElements.forEach(el => {
        el.style.display = '';
    });
}

function showLoggedOutUI() {
    const loggedInElements = document.querySelectorAll('.logged-in-only, .user-only');
    loggedInElements.forEach(el => {
        el.style.display = 'none';
    });
    const loggedOutElements = document.querySelectorAll('.logged-out-only, .guest-only');
    loggedOutElements.forEach(el => {
        el.style.display = '';
    });
}

function checkProtectedPage() {
    const protectedPages = [
        'mis_viajes.html',
        'suscripciones.html',
        'soporte.html',
        'mis_reservas.html',
        'chat.html',
        'buscar_viaje.html',
        'publicar_viaje.html',
        'perfil.html'
    ];
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    
    console.log('Verificando protección para página:', currentPage);
    if (protectedPages.includes(currentPage) && !localStorage.getItem('userId')) {
        console.log('Página protegida detectada sin sesión activa, redirigiendo...');
        localStorage.setItem('redirectAfterLogin', window.location.href);
        showNotification('Por favor, inicia sesión para acceder a esta página', 'info');
        setTimeout(() => {
            window.location.href = 'Inicio.html';
        }, 1500);
    }
}

function logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userUbicacion');
    localStorage.removeItem('userPreferences');
    showNotification('Has cerrado sesión correctamente', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

function initMobileMenu() {
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    const navContainer = document.querySelector('.nav-container');
    const closeMenu = document.querySelector('.close-menu');
    
    if (menuToggle && navContainer) {
        if (!closeMenu && navContainer) {
            const newCloseBtn = document.createElement('button');
            newCloseBtn.className = 'close-menu';
            newCloseBtn.innerHTML = '<i class="fas fa-times"></i>';
            newCloseBtn.style.display = 'none'; // Ocultarlo visualmente
            navContainer.appendChild(newCloseBtn);
        } else if (closeMenu) {
            closeMenu.style.display = 'none'; // Ocultar el botón existente
        }
        menuToggle.addEventListener('click', () => {
            navContainer.classList.add('active');
        });
        
        document.addEventListener('click', function(e) {
            if (navContainer.classList.contains('active') && 
                !navContainer.contains(e.target) && 
                e.target !== menuToggle) {
                navContainer.classList.remove('active');
            }
        });
    }
}

function getUserId() {
    return localStorage.getItem('userId');
}

function getUserName() {
    return localStorage.getItem('userName');
}

function getUserEmail() {
    return localStorage.getItem('userEmail');
}

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