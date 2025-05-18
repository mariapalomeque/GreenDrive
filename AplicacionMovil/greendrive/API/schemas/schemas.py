from typing import Optional
from pydantic import BaseModel, Field
from datetime import date, datetime

class Usuario(BaseModel):
    ID_Usuario: int
    Nombre: str
    Apellido: str
    Tipo: str
    Email: str
    Telefono: str

class UsuarioUpdate(BaseModel):
    Nombre: str
    Apellido: str
    Email: str
    Telefono: str
    Tipo: str = Field(default="Conductor")
    Contrasena: Optional[str] = None 

class UsuarioCreate(BaseModel):
    Nombre: str
    Apellido: str
    Email: str
    Telefono: str
    Contrasena: str
    Tipo: str = Field(default="Conductor")  

class UsuarioLogin(BaseModel):
    Email: str
    Contrasena: str

class Vehiculo(BaseModel):
    ID_Vehiculo: int
    ID_Usuario: int
    Marca: str
    Modelo: str
    Matricula: str
    Plazas_disponibles: int

class VehiculoCreate(BaseModel):
    ID_Usuario: int
    Marca: str
    Modelo: str
    Matricula: str
    Plazas_disponibles: int

class Viaje(BaseModel):
    ID_Viaje: int
    ID_Usuario: int
    Origen: str
    Destino: str
    Fecha_Hora_Salida: datetime
    Plazas_disponibles: int
    Coste: float

class ViajeCreate(BaseModel):
    ID_Usuario: int
    Origen: str
    Destino: str
    Fecha_Hora_Salida: datetime
    Plazas_disponibles: int
    Coste: float

class Reserva(BaseModel):
    ID_Reserva: int
    ID_Viaje: int
    ID_Usuario: int
    Estado: str

class ReservaCreate(BaseModel):
    ID_Viaje: int
    ID_Usuario: int
    Estado: str

class Pago(BaseModel):
    ID_Pago: int
    Coste: float
    Metodo_Pago: str
    Estado: str

class PagoCreate(BaseModel):
    Coste: float
    Metodo_Pago: str
    Estado: str

class Suscripcion(BaseModel):
    ID_Suscripcion: int
    ID_Usuario: int
    Tipo: str
    Fecha_Inicio: date
    Fecha_Final: date
    Coste: float

class SuscripcionCreate(BaseModel):
    ID_Usuario: int
    Tipo: str
    Fecha_Inicio: date
    Fecha_Final: date
    Coste: float


class Mensaje(BaseModel):
    ID_Mensaje: int
    Remitente: int
    Destinatario: int
    Mensaje: str
    Fecha: datetime
    Leido: bool

class MensajeCreate(BaseModel):
    Remitente: int
    Destinatario: int
    Mensaje: str


class Reserva(BaseModel):
    ID_Reserva: int
    ID_Viaje: int
    ID_Usuario: int
    Estado: str
    NumPasajeros: int = 1  

class ReservaCreate(BaseModel):
    ID_Viaje: int
    ID_Usuario: int
    Estado: str
    NumPasajeros: int = 1    


class ReservasViajeResponse(BaseModel):
    tieneReservas: bool
    plazasReservadas: int