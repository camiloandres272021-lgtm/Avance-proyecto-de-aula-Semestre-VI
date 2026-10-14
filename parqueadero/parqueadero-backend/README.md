# Backend - Aplicación de Parqueadero

## Requisitos previos
- Node.js instalado (v18 o superior recomendado)
- MongoDB instalado y corriendo localmente, o una cuenta gratuita en [MongoDB Atlas](https://www.mongodb.com/atlas) (recomendado si no quieres instalar nada localmente)

## Pasos para levantar el proyecto

1. Instala las dependencias:
   ```
   npm install
   ```

2. Copia el archivo `.env.example` y renómbralo a `.env`:
   ```
   cp .env.example .env
   ```

3. Configura tu conexión a MongoDB en el `.env`:
   - **Si instalaste MongoDB localmente:** deja el valor por defecto `mongodb://localhost:27017/parqueadero` (la base de datos se crea sola la primera vez que se usa, no necesitas crearla a mano)
   - **Si usas MongoDB Atlas (nube, más fácil para empezar):** crea un cluster gratuito, obtén tu cadena de conexión desde el botón "Connect" y pégala en `MONGO_URI`

4. Levanta el servidor en modo desarrollo:
   ```
   npm run dev
   ```

5. Verifica que todo funcione entrando a:
   ```
   http://localhost:3000
   ```
   Deberías ver un mensaje confirmando que la API está corriendo, y en la consola debería aparecer "Conexion a MongoDB exitosa".

## Estructura del proyecto

```
parqueadero-backend/
├── config/         # Configuración (conexión a la base de datos)
├── controllers/    # Lógica de negocio de cada ruta
├── middlewares/    # Funciones intermedias (ej: validar token JWT)
├── models/         # Modelos de Mongoose (colecciones de MongoDB)
├── routes/         # Definición de endpoints
├── server.js       # Punto de entrada de la aplicación
└── .env            # Variables de entorno (no se sube a git)
```

## Próximos pasos
- Definir los modelos: Usuario, Puesto, RegistroEntrada, Factura
- Implementar autenticación (registro/login con JWT)
- Crear el CRUD de puestos de parqueo

---

## Actualización: demo para la Expoferia

### Endpoints públicos (solo lectura, sin token)
- `GET /parqueaderos`, `GET /parqueaderos/resumen` (con puestos totales/libres/ocupados), `GET /parqueaderos/:id`
- `GET /puestos`, `GET /puestos/:id`

Todo lo que crea, modifica o elimina sigue requiriendo token (y rol admin donde ya lo exigía).

### Endpoint nuevo (con token)
- `GET /registros/ocupacion-por-hora?parqueaderoId=...` → entradas por hora de los últimos 7 días.

### Validaciones nuevas
- La placa se normaliza a mayúsculas y debe tener 5–7 letras/números.
- Una placa no puede tener dos entradas activas al mismo tiempo.
- Corregido: el registro de usuarios por correo fallaba porque `telefono` era obligatorio en el modelo.

### Datos de demostración
```
npm run seed:mallplaza   # crea el parqueadero Mall Plaza con sus puestos
npm run seed:demo        # usuarios demo, ~40% de puestos ocupados y 7 días de historial
```
Usuarios demo (contraseña `Demo1234`): `admin@demo.com` y `operador@demo.com`.
Se puede volver a correr `seed:demo` cuantas veces quieras para reiniciar la demo.

> Importante: `serviceAccountKey.json` y `.env` son secretos. No los subas a GitHub ni los compartas.

---

## Actualización: más parqueaderos y tarifa por sede

```
npm run seed:mallplaza      # Mall Plaza (plano especial)
npm run seed:parqueaderos   # 6 parqueaderos nuevos, ~600 puestos con plano generado
npm run seed:demo           # ocupación y 7 días de historial en TODAS las sedes
npm run seed:todo           # los tres anteriores en orden
```

- Nuevos parqueaderos: Centro Comercial Santafe, Plaza Norte, Torre Empresarial Central, Terminal de Transporte, Universidad - Campus Principal y Aeropuerto Internacional. Cada uno con distintos niveles, puestos preferenciales, motos y bicicletas.
- **Tarifa por sede**: el modelo `Parqueadero` tiene `tarifaPorMinuto` (por defecto 100). La factura de salida cobra con la tarifa de la sede del puesto. Se puede enviar en `POST /parqueaderos` y `PUT /parqueaderos/:id` (valida que sea número ≥ 0).
- `GET /registros/activos` devuelve `tarifaPorMinuto` en cada registro.
- Al eliminar un parqueadero también se borran sus facturas (antes quedaban huérfanas).
- Los seeds son idempotentes: se pueden correr varias veces sin duplicar puestos.
