from db_connect.connection import conn

def read_usuarios():
    try:
        query = """
            SELECT ID_Usuario, Nombre, Apellido, Tipo, Email, Telefono 
            FROM public.Usuarios
        """
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
        if rows:
            usuarios = []
            for row in rows:
                usuarios.append({
                    "ID_Usuario": row[0],
                    "Nombre": row[1],
                    "Apellido": row[2],
                    "Tipo": row[3],
                    "Email": row[4],
                    "Telefono": row[5]
                })
            return usuarios
        else:
            return {"status": 0, "message": "No hay usuarios para mostrar."}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al obtener usuarios: {e}"}

def get_usuario_by_id(id_usuario: int):
    try:
        query = """
            SELECT ID_Usuario, Nombre, Apellido, Tipo, Email, Telefono 
            FROM public.Usuarios 
            WHERE ID_Usuario = %s
        """
        with conn.cursor() as cur:
            cur.execute(query, (id_usuario,))
            row = cur.fetchone()
        if row:
            return {
                "ID_Usuario": row[0],
                "Nombre": row[1],
                "Apellido": row[2],
                "Tipo": row[3],
                "Email": row[4],
                "Telefono": row[5]
            }
        else:
            return {"status": 0, "message": "Usuario no encontrado"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al obtener usuario: {e}"}

def get_usuario_by_email(email: str):
    try:
        query = """
            SELECT ID_Usuario, Nombre, Apellido, Tipo, Email, Telefono, Contrasena
            FROM public.Usuarios 
            WHERE Email = %s
        """
        with conn.cursor() as cur:
            cur.execute(query, (email,))
            row = cur.fetchone()
        if row:
            return {
                "ID_Usuario": row[0],
                "Nombre": row[1],
                "Apellido": row[2],
                "Tipo": row[3],
                "Email": row[4],
                "Telefono": row[5],
                "Contrasena": row[6]  
            }
        else:
            return {"status": 0, "message": "Usuario no encontrado"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al obtener usuario: {e}"}


def create_usuario(new_usuario):
    try:
        query = """
            INSERT INTO public.Usuarios (Nombre, Apellido, Tipo, Email, Telefono, Contrasena)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING ID_Usuario;
        """
        with conn.cursor() as cur:
            cur.execute(query, (
                new_usuario.Nombre,
                new_usuario.Apellido,
                new_usuario.Tipo,
                new_usuario.Email,
                new_usuario.Telefono,
                new_usuario.Contrasena 
            ))
            new_id = cur.fetchone()[0]
        conn.commit()
        return {"status": 1, "message": "Usuario creado", "ID_Usuario": new_id}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al crear usuario: {e}"}


def update_usuario(id_usuario: int, data: dict):
    try:
        existing_user = get_usuario_by_id(id_usuario)
        
        query = """
            UPDATE public.Usuarios
            SET Nombre = %s, Apellido = %s, Tipo = %s, Email = %s, Telefono = %s
            WHERE ID_Usuario = %s
            RETURNING ID_Usuario;
        """
        with conn.cursor() as cur:
            cur.execute(query, (
                data.get("Nombre"),
                data.get("Apellido"),
                data.get("Tipo"),
                data.get("Email"),
                data.get("Telefono"),
                id_usuario
            ))
            updated = cur.fetchone()
        conn.commit()
        if updated:
            return {"status": 1, "message": "Usuario actualizado"}
        else:
            return {"status": 0, "message": "Usuario no encontrado"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al actualizar usuario: {e}"}
def delete_usuario(id_usuario: int):
    try:
        query = "DELETE FROM public.Usuarios WHERE ID_Usuario = %s RETURNING ID_Usuario;"
        with conn.cursor() as cur:
            cur.execute(query, (id_usuario,))
            deleted = cur.fetchone()
        conn.commit()
        if deleted:
            return {"status": 1, "message": "Usuario eliminado"}
        else:
            return {"status": 0, "message": "Usuario no encontrado"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al eliminar usuario: {e}"}

def read_vehiculos():
    try:
        query = """
            SELECT ID_Vehiculo, ID_Usuario, Marca, Modelo, Matricula, Plazas_disponibles 
            FROM public.Vehiculos
        """
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
        if rows:
            vehiculos = []
            for row in rows:
                vehiculos.append({
                    "ID_Vehiculo": row[0],
                    "ID_Usuario": row[1],
                    "Marca": row[2],
                    "Modelo": row[3],
                    "Matricula": row[4],
                    "Plazas_disponibles": row[5]
                })
            return vehiculos
        else:
            return {"status": 0, "message": "No hay vehículos para mostrar."}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al obtener vehículos: {e}"}

def get_vehiculo_by_id(id_vehiculo: int):
    try:
        query = """
    SELECT 
        id_vehiculo AS "ID_Vehiculo", 
        id_usuario AS "ID_Usuario", 
        marca AS "Marca", 
        modelo AS "Modelo", 
        matricula AS "Matricula", 
        plazas_disponibles AS "Plazas_disponibles"
    FROM public.vehiculos
    WHERE id_vehiculo = %s
"""

        with conn.cursor() as cur:
            cur.execute(query, (id_vehiculo,))
            row = cur.fetchone()
        if row:
            return {
                "ID_Vehiculo": row[0],
                "ID_Usuario": row[1],
                "Marca": row[2],
                "Modelo": row[3],
                "Matricula": row[4],
                "Plazas_disponibles": row[5]
            }
        else:
            return {"status": 0, "message": "Vehículo no encontrado"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al obtener vehículo: {e}"}

def create_vehiculo(new_vehiculo):
    try:
        query = """
            INSERT INTO public.Vehiculos (ID_Usuario, Marca, Modelo, Matricula, Plazas_disponibles)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING ID_Vehiculo;
        """
        with conn.cursor() as cur:
            cur.execute(query, (
                new_vehiculo.ID_Usuario,
                new_vehiculo.Marca,
                new_vehiculo.Modelo,
                new_vehiculo.Matricula,
                new_vehiculo.Plazas_disponibles
            ))
            new_id = cur.fetchone()[0]
        conn.commit()
        return {"status": 1, "message": "Vehículo creado", "ID_Vehiculo": new_id}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al crear vehículo: {e}"}

def update_vehiculo(id_vehiculo: int, data: dict):
    try:
        query = """
            UPDATE public.Vehiculos
            SET ID_Usuario = %s, Marca = %s, Modelo = %s, Matricula = %s, Plazas_disponibles = %s
            WHERE ID_Vehiculo = %s
            RETURNING ID_Vehiculo;
        """
        with conn.cursor() as cur:
            cur.execute(query, (
                data.get("ID_Usuario"),
                data.get("Marca"),
                data.get("Modelo"),
                data.get("Matricula"),
                data.get("Plazas_disponibles"),
                id_vehiculo
            ))
            updated = cur.fetchone()
        conn.commit()
        if updated:
            return {"status": 1, "message": "Vehículo actualizado"}
        else:
            return {"status": 0, "message": "Vehículo no encontrado"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al actualizar vehículo: {e}"}

def delete_vehiculo(id_vehiculo: int):
    try:
        query = "DELETE FROM public.Vehiculos WHERE ID_Vehiculo = %s RETURNING ID_Vehiculo;"
        with conn.cursor() as cur:
            cur.execute(query, (id_vehiculo,))
            deleted = cur.fetchone()
        conn.commit()
        if deleted:
            return {"status": 1, "message": "Vehículo eliminado"}
        else:
            return {"status": 0, "message": "Vehículo no encontrado"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al eliminar vehículo: {e}"}

def read_viajes():
    try:
        query = """
            SELECT ID_Viaje, ID_Usuario, Origen, Destino, Fecha_Hora_Salida, Plazas_disponibles, Coste 
            FROM public.Viajes
        """
        with conn.cursor() as cur:
            cur.execute(query)
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
            return {"status": 0, "message": "No hay viajes para mostrar."}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al obtener viajes: {e}"}

def get_viaje_by_id(id_viaje: int):
    try:
        query = """
            SELECT ID_Viaje, ID_Usuario, Origen, Destino, Fecha_Hora_Salida, Plazas_disponibles, Coste 
            FROM public.Viajes 
            WHERE ID_Viaje = %s
        """
        with conn.cursor() as cur:
            cur.execute(query, (id_viaje,))
            row = cur.fetchone()
        if row:
            return {
                "ID_Viaje": row[0],
                "ID_Usuario": row[1],
                "Origen": row[2],
                "Destino": row[3],
                "Fecha_Hora_Salida": row[4],
                "Plazas_disponibles": row[5],
                "Coste": float(row[6])
            }
        else:
            return {"status": 0, "message": "Viaje no encontrado"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al obtener viaje: {e}"}

def create_viaje(new_viaje):
    try:
        query = """
            INSERT INTO public.Viajes (ID_Usuario, Origen, Destino, Fecha_Hora_Salida, Plazas_disponibles, Coste)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING ID_Viaje;
        """
        with conn.cursor() as cur:
            cur.execute(query, (
                new_viaje.ID_Usuario,
                new_viaje.Origen,
                new_viaje.Destino,
                new_viaje.Fecha_Hora_Salida,
                new_viaje.Plazas_disponibles,
                new_viaje.Coste
            ))
            new_id = cur.fetchone()[0]
        conn.commit()
        return {"status": 1, "message": "Viaje creado", "ID_Viaje": new_id}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al crear viaje: {e}"}

def update_viaje(id_viaje: int, data: dict):
    try:
        print(f"Actualizando viaje {id_viaje} con datos: {data}")
        id_usuario = data.get("ID_Usuario")
        origen = data.get("Origen")
        destino = data.get("Destino")
        fecha_hora = data.get("Fecha_Hora_Salida")
        plazas = data.get("Plazas_disponibles")
        coste = data.get("Coste")
        if plazas is not None:
            plazas = max(0, int(plazas))
        query = """
            UPDATE public.Viajes
            SET ID_Usuario = %s, 
                Origen = %s, 
                Destino = %s, 
                Fecha_Hora_Salida = %s, 
                Plazas_disponibles = %s, 
                Coste = %s
            WHERE ID_Viaje = %s
            RETURNING ID_Viaje;
        """
        
        print(f"Parámetros de consulta: {id_usuario}, {origen}, {destino}, {fecha_hora}, {plazas}, {coste}, {id_viaje}")
        
        with conn.cursor() as cur:
            cur.execute(query, (
                id_usuario,
                origen,
                destino,
                fecha_hora,
                plazas,
                coste,
                id_viaje
            ))
            updated = cur.fetchone()
            
        conn.commit()
        
        if updated:
            print(f"Viaje {id_viaje} actualizado correctamente")
            return {"status": 1, "message": "Viaje actualizado"}
        else:
            print(f"Viaje {id_viaje} no encontrado")
            return {"status": 0, "message": "Viaje no encontrado"}
    except Exception as e:
        conn.rollback()
        print(f"Error en update_viaje: {e}")
        return {"status": -1, "message": f"Error al actualizar viaje: {e}"}
    
def delete_viaje(id_viaje: int):
    try:
        query = "DELETE FROM public.Viajes WHERE ID_Viaje = %s RETURNING ID_Viaje;"
        with conn.cursor() as cur:
            cur.execute(query, (id_viaje,))
            deleted = cur.fetchone()
        conn.commit()
        if deleted:
            return {"status": 1, "message": "Viaje eliminado"}
        else:
            return {"status": 0, "message": "Viaje no encontrado"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al eliminar viaje: {e}"}

def create_reserva(new_reserva):
    try:
        query = """
            INSERT INTO public.Reservas (ID_Viaje, ID_Usuario, Estado, num_pasajeros)
            VALUES (%s, %s, %s, %s)
            RETURNING ID_Reserva;
        """
        with conn.cursor() as cur:
            cur.execute(query, (
                new_reserva.ID_Viaje,
                new_reserva.ID_Usuario,
                new_reserva.Estado,
                new_reserva.NumPasajeros if hasattr(new_reserva, 'NumPasajeros') else 1
            ))
            new_id = cur.fetchone()[0]
        conn.commit()
        return {"status": 1, "message": "Reserva creada", "ID_Reserva": new_id}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al crear reserva: {e}"}

def get_reservas_by_usuario(id_usuario: int):
    try:
        query = """
            SELECT r.ID_Reserva, r.ID_Viaje, r.ID_Usuario, r.Estado, r.num_pasajeros
            FROM public.Reservas r
            WHERE r.ID_Usuario = %s
        """
        with conn.cursor() as cur:
            cur.execute(query, (id_usuario,))
            rows = cur.fetchall()
        if rows:
            reservas = []
            for row in rows:
                reservas.append({
                    "ID_Reserva": row[0],
                    "ID_Viaje": row[1],
                    "ID_Usuario": row[2],
                    "Estado": row[3],
                    "NumPasajeros": row[4] if len(row) > 4 else 1
                })
            return reservas
        else:
            return {"status": 0, "message": "No se encontraron reservas para este usuario"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al obtener reservas: {e}"}
    

def delete_reserva(id_reserva: int):
    try:
        query = "DELETE FROM public.Reservas WHERE ID_Reserva = %s RETURNING ID_Reserva;"
        with conn.cursor() as cur:
            cur.execute(query, (id_reserva,))
            deleted = cur.fetchone()
        conn.commit()
        if deleted:
            return {"status": 1, "message": "Reserva eliminada"}
        else:
            return {"status": 0, "message": "Reserva no encontrada"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al eliminar reserva: {e}"}
    
def get_reserva_by_id(id_reserva: int):
    try:
        query = """
            SELECT ID_Reserva, ID_Viaje, ID_Usuario, Estado, NumPasajeros 
            FROM public.Reservas 
            WHERE ID_Reserva = %s
        """
        with conn.cursor() as cur:
            cur.execute(query, (id_reserva,))
            row = cur.fetchone()
        if row:
            return {
                "ID_Reserva": row[0],
                "ID_Viaje": row[1],
                "ID_Usuario": row[2],
                "Estado": row[3],
                "NumPasajeros": row[4] if len(row) > 4 else 1
            }
        else:
            return {"status": 0, "message": "Reserva no encontrada"}
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al obtener reserva: {e}"}


def create_mensaje(new_mensaje):
    try:
        query = """
            INSERT INTO public.Mensajes (Remitente, Destinatario, Mensaje)
            VALUES (%s, %s, %s)
            RETURNING ID_Mensaje, Fecha, Leido;
        """
        with conn.cursor() as cur:
            cur.execute(query, (
                new_mensaje.Remitente,
                new_mensaje.Destinatario,
                new_mensaje.Mensaje
            ))
            row = cur.fetchone()
        conn.commit()
        return {
            "ID_Mensaje": row[0],
            "Remitente": new_mensaje.Remitente,
            "Destinatario": new_mensaje.Destinatario,
            "Mensaje": new_mensaje.Mensaje,
            "Fecha": row[1],
            "Leido": row[2]
        }
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al enviar mensaje: {e}"}

def get_mensajes_entre_usuarios(id1, id2):
    try:
        query = """
            SELECT ID_Mensaje, Remitente, Destinatario, Mensaje, Fecha, Leido
            FROM public.Mensajes
            WHERE (Remitente = %s AND Destinatario = %s)
               OR (Remitente = %s AND Destinatario = %s)
            ORDER BY Fecha ASC;
        """
        with conn.cursor() as cur:
            cur.execute(query, (id1, id2, id2, id1))
            rows = cur.fetchall()
        mensajes = [{
            "ID_Mensaje": row[0],
            "Remitente": row[1],
            "Destinatario": row[2],
            "Mensaje": row[3],
            "Fecha": row[4],
            "Leido": row[5]
        } for row in rows]
        return mensajes
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al obtener mensajes: {e}"}



def verificar_reservas_viaje(id_viaje: int):
    try:
        query = """
            SELECT COUNT(*) AS num_reservas, COALESCE(SUM(num_pasajeros), 0) AS plazas_reservadas
            FROM public.Reservas
            WHERE ID_Viaje = %s
        """
        with conn.cursor() as cur:
            cur.execute(query, (id_viaje,))
            row = cur.fetchone()
        if row and row[0] > 0 and row[1] > 0:
            return {
                "tieneReservas": True,
                "plazasReservadas": row[1]
            }
        else:
            return {
                "tieneReservas": False,
                "plazasReservadas": 0
            }
    except Exception as e:
        conn.rollback()
        return {"status": -1, "message": f"Error al verificar reservas del viaje: {e}"}