from datetime import time, timedelta
from fastapi import FastAPI, HTTPException, Body, Query, Form, Request, UploadFile, File
from typing import List, Dict
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from schemas.schemas import *
from consultas.consultas import *
from passlib.context import CryptContext 
import smtplib
from email.mime.text import MIMEText
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/usuarios/", response_model=List[Usuario])
async def obtener_usuarios():
    result = read_usuarios()
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result

@app.get("/usuarios/{id_usuario}", response_model=Usuario)
async def obtener_usuario(id_usuario: int):
    result = get_usuario_by_id(id_usuario)
    if not isinstance(result, dict) or "ID_Usuario" not in result:
        raise HTTPException(status_code=404, detail=result.get("message", "Usuario no encontrado"))
    return result


@app.get("/usuarios/email/{email}", response_model=Usuario)
async def obtener_usuario_por_email(email: str):
    result = get_usuario_by_email(email)
    if isinstance(result, dict) and "status" in result and result.get("status") != 1:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not result:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if "Contrasena" in result:
        result.pop("Contrasena")
    return result


@app.post("/usuarios/add")
async def add_usuario(new_usuario: UsuarioCreate = Body(...)):
    result = create_usuario(new_usuario)
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return {"message": "Usuario añadido correctamente"}

@app.put("/usuarios/update/{id_usuario}")
async def update_usuario_endpoint(id_usuario: int, updated_usuario: UsuarioUpdate = Body(...)):
    result = update_usuario(id_usuario, updated_usuario.dict(exclude_unset=True))
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return {"message": "Usuario actualizado correctamente"}

@app.delete("/usuarios/delete/{id_usuario}")
async def delete_usuario_endpoint(id_usuario: int):
    result = delete_usuario(id_usuario)
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return {"message": "Usuario eliminado correctamente"}


@app.get("/vehiculos/", response_model=List[Vehiculo])
async def obtener_vehiculos():
    result = read_vehiculos()
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result

@app.get("/vehiculos/{id_vehiculo}", response_model=Vehiculo)
async def obtener_vehiculo(id_vehiculo: int):
    result = get_vehiculo_by_id(id_vehiculo)
    if not isinstance(result, dict) or "ID_Vehiculo" not in result:
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result

@app.post("/vehiculos/add")
async def add_vehiculo(new_vehiculo: VehiculoCreate = Body(...)):
    result = create_vehiculo(new_vehiculo)
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message", "Vehículo no encontrado"))
    return {"message": "Vehículo añadido correctamente"}

@app.put("/vehiculos/update/{id_vehiculo}")
async def update_vehiculo_endpoint(id_vehiculo: int, updated_vehiculo: VehiculoCreate = Body(...)):
    result = update_vehiculo(id_vehiculo, updated_vehiculo.dict())
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return {"message": "Vehículo actualizado correctamente"}

@app.delete("/vehiculos/delete/{id_vehiculo}")
async def delete_vehiculo_endpoint(id_vehiculo: int):
    result = delete_vehiculo(id_vehiculo)
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return {"message": "Vehículo eliminado correctamente"}

@app.get("/viajes/", response_model=List[Viaje])
async def obtener_viajes():
    result = read_viajes()
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result


@app.get("/viajes/buscar", response_model=List[Viaje])
async def buscar_viajes(origen: str = Query(...), destino: str = Query(...), fecha: str = Query(...)):
    try:
        query = """
            SELECT ID_Viaje, ID_Usuario, Origen, Destino, Fecha_Hora_Salida, Plazas_disponibles, Coste
            FROM public.Viajes
            WHERE Origen ILIKE %s AND Destino ILIKE %s AND TO_CHAR(Fecha_Hora_Salida, 'YYYY-MM-DD') = %s
        """
        with conn.cursor() as cur:
            cur.execute(query, (f"%{origen}%", f"%{destino}%", fecha))
            rows = cur.fetchall()
        
        viajes = [
            {
                "ID_Viaje": row[0],
                "ID_Usuario": row[1],
                "Origen": row[2],
                "Destino": row[3],
                "Fecha_Hora_Salida": row[4],
                "Plazas_disponibles": row[5],
                "Coste": float(row[6])
            }
            for row in rows
        ]

        return viajes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/viajes/{id_viaje}", response_model=None)  
async def obtener_viaje(id_viaje: int):
    print(f"Solicitando viaje con ID: {id_viaje}")  
    result = get_viaje_by_id(id_viaje)
    print(f"Resultado obtenido: {result}")  
    
    if isinstance(result, dict) and "status" in result and result.get("status") != 1:
        raise HTTPException(status_code=404, detail=f"Viaje con ID {id_viaje} no encontrado: {result.get('message')}")
    if result is None:
        return {
            "ID_Viaje": id_viaje,
            "ID_Usuario": 1,
            "Origen": f"Origen del viaje {id_viaje}",
            "Destino": f"Destino del viaje {id_viaje}",
            "Fecha_Hora_Salida": "2025-05-01T12:00:00",
            "Plazas_disponibles": 2,
            "Coste": 25.00
        }
    
    return result


@app.get("/viajes/usuario/{id_usuario}", response_model=List[Viaje])
async def obtener_viajes_usuario(id_usuario: int):
    try:
        query = """
            SELECT ID_Viaje, ID_Usuario, Origen, Destino, Fecha_Hora_Salida, Plazas_disponibles, Coste 
            FROM public.Viajes 
            WHERE ID_Usuario = %s
        """
        with conn.cursor() as cur:
            cur.execute(query, (id_usuario,))
            rows = cur.fetchall()
        
        if rows:
            viajes = []
            for row in rows:
                viajes.append({
                    "ID_Viaje": row[0],
                    "ID_Usuario": row[1],
                    "Origen": row[2],
                    "Destino": row[3],
                    "Fecha_Hora_Salida": row[4],
                    "Plazas_disponibles": row[5],
                    "Coste": float(row[6])
                })
            return viajes
        else:
            return []
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Error al obtener viajes del usuario: {e}")

@app.post("/viajes/add")
async def add_viaje(new_viaje: ViajeCreate = Body(...)):
    result = create_viaje(new_viaje)
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return {"message": "Viaje añadido correctamente"}

@app.put("/viajes/update/{id_viaje}")
async def update_viaje_endpoint(id_viaje: int, updated_viaje: ViajeCreate = Body(...)):
    result = update_viaje(id_viaje, updated_viaje.dict())
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return {"message": "Viaje actualizado correctamente"}

@app.delete("/viajes/delete/{id_viaje}")
async def delete_viaje_endpoint(id_viaje: int):
    result = delete_viaje(id_viaje)
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return {"message": "Viaje eliminado correctamente"}


@app.post("/register")
async def register(new_usuario: UsuarioCreate = Body(...)):
    hashed_password = get_password_hash(new_usuario.Contrasena)
    new_usuario.Contrasena = hashed_password
    result = create_usuario(new_usuario)
    if result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return {"message": "Usuario creado correctamente", "ID_Usuario": result.get("ID_Usuario")}


@app.post("/login")
async def login(usuario: UsuarioLogin = Body(...)):
    user = get_usuario_by_email(usuario.Email)
    
    if not user or isinstance(user, dict) and "status" in user and user.get("status") != 1:
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")

    if "Contrasena" not in user:
        print(f"Error: Usuario encontrado pero sin campo 'Contrasena'. Datos: {user}")
        raise HTTPException(status_code=500, detail="Error interno del servidor: datos de usuario incompletos")
    if not verify_password(usuario.Contrasena, user["Contrasena"]):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos")
    
    return {"message": "Inicio de sesión correcto"}

@app.post("/reservas/add")
async def add_reserva(new_reserva: ReservaCreate = Body(...)):
    try:
        viaje = get_viaje_by_id(new_reserva.ID_Viaje)
        if not viaje or isinstance(viaje, dict) and "status" in viaje and viaje.get("status") != 1:
            raise HTTPException(status_code=404, detail="Viaje no encontrado")
        if viaje["Plazas_disponibles"] <= 0:
            raise HTTPException(status_code=400, detail="No hay plazas disponibles para este viaje")
        nuevas_plazas = max(0, viaje["Plazas_disponibles"] - 1)
        viaje_actualizado = {
            "ID_Usuario": viaje["ID_Usuario"],
            "Origen": viaje["Origen"],
            "Destino": viaje["Destino"],
            "Fecha_Hora_Salida": viaje["Fecha_Hora_Salida"],
            "Plazas_disponibles": nuevas_plazas,
            "Coste": viaje["Coste"]
        }
        update_result = update_viaje(new_reserva.ID_Viaje, viaje_actualizado)
        if isinstance(update_result, dict) and update_result.get("status") != 1:
            error_msg = update_result.get("message", "Error al actualizar plazas disponibles")
            print(f"Error al actualizar viaje: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        result = create_reserva(new_reserva)
        if isinstance(result, dict) and result.get("status") != 1:
            viaje["Plazas_disponibles"] = viaje["Plazas_disponibles"]  # Restaurar plazas originales
            update_viaje(new_reserva.ID_Viaje, viaje)  # Revertir cambios
            raise HTTPException(status_code=500, detail=result.get("message", "Error al crear reserva"))
        
        return {"message": "Reserva creada correctamente", "ID_Reserva": result.get("ID_Reserva")}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error inesperado en add_reserva: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error inesperado: {str(e)}")

@app.get("/reservas/usuario/{id_usuario}", response_model=List[Reserva])
async def obtener_reservas_usuario(id_usuario: int):
    result = get_reservas_by_usuario(id_usuario)
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=404, detail=result.get("message"))
    return result


@app.delete("/reservas/delete/{id_reserva}")
async def delete_reserva_endpoint(id_reserva: int):
    result = delete_reserva(id_reserva)
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return {"message": "Reserva eliminada correctamente"}



@app.post("/mensajes/", response_model=Mensaje)
async def enviar_mensaje(new_mensaje: MensajeCreate = Body(...)):
    result = create_mensaje(new_mensaje)
    if isinstance(result, dict) and result.get("status") == -1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return result

@app.get("/mensajes/{remitente_id}/{destinatario_id}", response_model=List[Mensaje])
async def obtener_mensajes(remitente_id: int, destinatario_id: int):
    result = get_mensajes_entre_usuarios(remitente_id, destinatario_id)
    if isinstance(result, dict) and result.get("status") == -1:
        raise HTTPException(status_code=500, detail=result.get("message"))
    return result


SMTP_SERVER = "smtp.ethereal.email"
SMTP_PORT = 587
SMTP_USER = "shanna81@ethereal.email"
SMTP_PASS = "GU74jrdeJBX8QJx2Hv"

@app.post("/contacto")
async def enviar_contacto(
    nombre: str = Form(...),
    correo: str = Form(...),
    asunto: str = Form(...),
    mensaje: str = Form(...)
):
    destinatario = SMTP_USER

    cuerpo = f"Nombre: {nombre}\nCorreo: {correo}\nAsunto: {asunto}\nMensaje:\n{mensaje}"

    msg = MIMEText(cuerpo)
    msg["Subject"] = f"Contacto desde GreenDrive: {asunto}"
    msg["From"] = correo
    msg["To"] = destinatario

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(correo, destinatario, msg.as_string())
        return JSONResponse(content={"ok": True, "msg": "Mensaje enviado correctamente."})
    except Exception as e:
        print("Error enviando email:", e)
        return JSONResponse(content={"ok": False, "msg": "No se pudo enviar el mensaje."}, status_code=500)


@app.post("/reservas/multi/add")
async def add_multi_reserva(new_reserva: ReservaCreate = Body(...)):
    viaje = get_viaje_by_id(new_reserva.ID_Viaje)
    if isinstance(viaje, dict) and viaje.get("status") != 1:
        if not viaje:
            raise HTTPException(status_code=404, detail="Viaje no encontrado")

    num_pasajeros = getattr(new_reserva, 'NumPasajeros', 1)

    if viaje["Plazas_disponibles"] < num_pasajeros:
        raise HTTPException(status_code=400, detail=f"No hay suficientes plazas disponibles. Se necesitan {num_pasajeros} plazas.")

    result = create_reserva(new_reserva)
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))

    viaje_actualizado = {
        "ID_Usuario": viaje["ID_Usuario"],
        "Origen": viaje["Origen"],
        "Destino": viaje["Destino"],
        "Fecha_Hora_Salida": viaje["Fecha_Hora_Salida"],
        "Plazas_disponibles": viaje["Plazas_disponibles"] - num_pasajeros,
        "Coste": viaje["Coste"]
    }

    update_result = update_viaje(new_reserva.ID_Viaje, viaje_actualizado)
    if isinstance(update_result, dict) and update_result.get("status") != 1:
        delete_reserva(result.get("ID_Reserva"))
        raise HTTPException(status_code=500, detail="Error al actualizar plazas disponibles")

    return {"message": "Reserva creada correctamente", "ID_Reserva": result.get("ID_Reserva")}


@app.post("/reservas/multi/cancel/{id_reserva}")
async def cancel_multi_reserva(id_reserva: int, num_pasajeros: int = Body(...)):
    reserva = get_reserva_by_id(id_reserva)
    if not reserva or (isinstance(reserva, dict) and reserva.get("status") != 1):
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    viaje = get_viaje_by_id(reserva["ID_Viaje"])
    if not viaje or (isinstance(viaje, dict) and viaje.get("status") != 1):
        raise HTTPException(status_code=404, detail="Viaje no encontrado")

    result = delete_reserva(id_reserva)
    if isinstance(result, dict) and result.get("status") != 1:
        raise HTTPException(status_code=500, detail=result.get("message"))

    viaje_actualizado = {
        "ID_Usuario": viaje["ID_Usuario"],
        "Origen": viaje["Origen"],
        "Destino": viaje["Destino"],
        "Fecha_Hora_Salida": viaje["Fecha_Hora_Salida"],
        "Plazas_disponibles": viaje["Plazas_disponibles"] + num_pasajeros,
        "Coste": viaje["Coste"]
    }

    update_result = update_viaje(viaje["ID_Viaje"], viaje_actualizado)
    if isinstance(update_result, dict) and update_result.get("status") != 1:
        raise HTTPException(status_code=500, detail="Error al actualizar plazas disponibles")

    return {"message": "Reserva cancelada correctamente"}

@app.get("/viajes/{id_viaje}/reservas", response_model=ReservasViajeResponse)
async def verificar_reservas_viaje_endpoint(id_viaje: int):
    viaje = get_viaje_by_id(id_viaje)
    if not viaje or (isinstance(viaje, dict) and viaje.get("status") != 1):
        raise HTTPException(status_code=404, detail=f"Viaje con ID {id_viaje} no encontrado")
    result = verificar_reservas_viaje(id_viaje)
    if isinstance(result, dict) and "status" in result and result.get("status") == -1:
        raise HTTPException(status_code=500, detail=result.get("message", "Error al verificar reservas"))
    return result


RUTA_IMAGENES = os.path.join(os.path.dirname(__file__), "../img")  # ajusta si tu estructura cambia

@app.post("/usuarios/{id_usuario}/foto")
async def subir_foto_perfil(id_usuario: int, foto: UploadFile = File(...)):
    ext = foto.filename.split('.')[-1].lower()
    if ext not in ["jpg", "jpeg", "png"]:
        raise HTTPException(status_code=400, detail="Formato no soportado. Solo JPG o PNG.")
    nombre_archivo = f"perfil_{id_usuario}.{ext}"
    ruta_completa = os.path.join(RUTA_IMAGENES, nombre_archivo)
    with open(ruta_completa, "wb") as f:
        f.write(await foto.read())
    return {"url": f"/img/{nombre_archivo}"}
from fastapi.staticfiles import StaticFiles
app.mount("/img", StaticFiles(directory=RUTA_IMAGENES), name="img")
@app.get("/usuarios/{id_usuario}/foto")
def get_foto_perfil(id_usuario: int):
    for ext in ["jpg", "jpeg", "png"]:
        ruta = os.path.join(RUTA_IMAGENES, f"perfil_{id_usuario}.{ext}")
        if os.path.exists(ruta):
            return FileResponse(ruta)
    return FileResponse(os.path.join(RUTA_IMAGENES, "default.png"))

@app.post("/usuarios/{id_usuario}/foto")
async def subir_foto_perfil(id_usuario: int, foto: UploadFile = File(...)):
    ext = foto.filename.split('.')[-1].lower()
    if ext not in ["jpg", "jpeg", "png"]:
        raise HTTPException(status_code=400, detail="Formato no soportado. Solo JPG o PNG.")
    timestamp = int(time.time())
    nombre_archivo = f"perfil_{id_usuario}_{timestamp}.{ext}"
    ruta_completa = os.path.join(RUTA_IMAGENES, nombre_archivo)
    with open(ruta_completa, "wb") as f:
        f.write(await foto.read())
    return {"url": f"/img/{nombre_archivo}"}