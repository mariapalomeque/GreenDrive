
document.addEventListener('DOMContentLoaded', function () {
    const botonFoto = document.getElementById('boton-subir-foto');
    const inputFoto = document.getElementById('foto-perfil-input');
    const imgPerfil = document.getElementById('foto-perfil-img');
    const userId = localStorage.getItem('userId'); // Ajusta si tienes otro método
    function cargarFotoPerfil() {
        if (userId) {
            imgPerfil.src = `http://13.50.166.206:8000/usuarios/${userId}/foto?t=${Date.now()}`;
        }
    }

    cargarFotoPerfil();
    botonFoto.addEventListener('click', () => inputFoto.click());
    inputFoto.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            imgPerfil.src = e.target.result;
        };
        reader.readAsDataURL(file);
        const formData = new FormData();
        formData.append('foto', file);

        fetch(`http://13.50.166.206:8000/usuarios/${userId}/foto`, {
            method: 'POST',
            body: formData
        })
        .then(r => r.json())
        .then(data => {
            if (data.url) {
                imgPerfil.src = data.url + '?t=' + Date.now();
                mostrarNotificacion('Foto subida correctamente', 'success');
            } else {
                mostrarNotificacion('Error: ' + (data.detail || "No se pudo subir"), 'error');
                cargarFotoPerfil(); // Vuelve a mostrar la actual si hubo error
            }
        })
        .catch(() => {
            mostrarNotificacion('Error al subir la foto', 'error');
            cargarFotoPerfil(); // Vuelve a mostrar la actual si hubo error
        });
    });
});
function mostrarNotificacion(mensaje, tipo) {
    const existente = document.querySelector('.notificacion-perfil');
    if (existente) existente.remove();

    const notif = document.createElement('div');
    notif.className = `notificacion-perfil ${tipo}`;
    notif.textContent = mensaje;
    notif.style.position = 'fixed';
    notif.style.top = '30px';
    notif.style.right = '30px';
    notif.style.padding = '12px 24px';
    notif.style.backgroundColor = (tipo === 'success') ? '#d1fae5' : '#fee2e2';
    notif.style.color = (tipo === 'success') ? '#059669' : '#dc2626';
    notif.style.borderRadius = '8px';
    notif.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
    notif.style.zIndex = '9999';
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 2600);
}
