import psycopg2 # Con este import utilizamos Postgres para usarlo en Pythom

try:
    conn = psycopg2.connect( # Estos son los datos para realizar la conección con la base de datos
        database="greendrive",
        user="stephen",
        password="ubuntu",
        host="localhost",
        port="5432"
    )
    cursor = conn.cursor() # Este es el objeto el cual nos indica si se a realizado bien la conexión
    print(cursor)
except psycopg2.Error as e:
    print(f"Error en establir la connexió: {e}") # En caso de error se imprime este error
