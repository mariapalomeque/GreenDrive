// Funciones GET para refrescar listas
function fetchUsuarios() {
    fetch('http://localhost:8000/usuarios/')
      .then(response => response.json())
      .then(data => {
        const listaUsuarios = document.getElementById('listaUsuarios');
        listaUsuarios.innerHTML = "";
        data.forEach(usuario => {
          const li = document.createElement('li');
          li.textContent = `ID: ${usuario.ID_Usuario}, Nombre: ${usuario.Nombre} ${usuario.Apellido}, Email: ${usuario.Email}`;
          listaUsuarios.appendChild(li);
        });
      })
      .catch(error => console.error('Error al obtener usuarios:', error));
  }
  
  function fetchVehiculos() {
    fetch('http://localhost:8000/vehiculos/')
      .then(response => response.json())
      .then(data => {
        const listaVehiculos = document.getElementById('listaVehiculos');
        listaVehiculos.innerHTML = "";
        data.forEach(vehiculo => {
          const li = document.createElement('li');
          li.textContent = `ID: ${vehiculo.ID_Vehiculo}, Marca: ${vehiculo.Marca}, Modelo: ${vehiculo.Modelo}, Matrícula: ${vehiculo.Matricula}`;
          listaVehiculos.appendChild(li);
        });
      })
      .catch(error => console.error('Error al obtener vehículos:', error));
  }
  
  function fetchViajes() {
    fetch('http://localhost:8000/viajes/')
      .then(response => response.json())
      .then(data => {
        const listaViajes = document.getElementById('listaViajes');
        listaViajes.innerHTML = "";
        data.forEach(viaje => {
          const fechaHora = new Date(viaje.Fecha_Hora_Salida);
          const fecha = fechaHora.toLocaleDateString();
          const hora = fechaHora.toLocaleTimeString();
          const li = document.createElement('li');
          li.textContent = `ID: ${viaje.ID_Viaje}, Origen: ${viaje.Origen}, Destino: ${viaje.Destino}, Fecha/Hora: ${fecha} ${hora}, Coste: ${viaje.Coste}`;
          listaViajes.appendChild(li);
        });
      })
      .catch(error => console.error('Error al obtener viajes:', error));
  }
  
  // Event listeners para formularios
  
  // Crear Usuario
  document.getElementById('crearUsuarioForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const usuario = Object.fromEntries(formData.entries());
    fetch('http://localhost:8000/usuarios/add', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(usuario)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Usuario creado:', data);
      fetchUsuarios();
    })
    .catch(error => console.error('Error al crear usuario:', error));
  });
  
  // Actualizar Usuario
  document.getElementById('actualizarUsuarioForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const usuario = Object.fromEntries(formData.entries());
    const id = usuario.ID_Usuario;
    delete usuario.ID_Usuario;
    fetch(`http://localhost:8000/usuarios/update/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(usuario)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Usuario actualizado:', data);
      fetchUsuarios();
    })
    .catch(error => console.error('Error al actualizar usuario:', error));
  });
  
  // Crear Vehículo
  document.getElementById('crearVehiculoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const vehiculo = Object.fromEntries(formData.entries());
    vehiculo.Plazas_disponibles = Number(vehiculo.Plazas_disponibles);
    fetch('http://localhost:8000/vehiculos/add', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(vehiculo)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Vehículo creado:', data);
      fetchVehiculos();
    })
    .catch(error => console.error('Error al crear vehículo:', error));
  });
  
  // Actualizar Vehículo
  document.getElementById('actualizarVehiculoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const vehiculo = Object.fromEntries(formData.entries());
    const id = vehiculo.ID_Vehiculo;
    delete vehiculo.ID_Vehiculo;
    vehiculo.Plazas_disponibles = Number(vehiculo.Plazas_disponibles);
    fetch(`http://localhost:8000/vehiculos/update/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(vehiculo)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Vehículo actualizado:', data);
      fetchVehiculos();
    })
    .catch(error => console.error('Error al actualizar vehículo:', error));
  });
  
  // Crear Viaje
  document.getElementById('crearViajeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const viaje = Object.fromEntries(formData.entries());
    fetch('http://localhost:8000/viajes/add', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(viaje)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Viaje creado:', data);
      fetchViajes();
    })
    .catch(error => console.error('Error al crear viaje:', error));
  });
  
  // Actualizar Viaje
  document.getElementById('actualizarViajeForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const viaje = Object.fromEntries(formData.entries());
    const id = viaje.ID_Viaje;
    delete viaje.ID_Viaje;
    fetch(`http://localhost:8000/viajes/update/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(viaje)
    })
    .then(response => response.json())
    .then(data => {
      console.log('Viaje actualizado:', data);
      fetchViajes();
    })
    .catch(error => console.error('Error al actualizar viaje:', error));
  });
  
  // Llamadas iniciales
  document.addEventListener('DOMContentLoaded', () => {
    fetchUsuarios();
    fetchVehiculos();
    fetchViajes();
  });
  

  