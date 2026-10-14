# Parqueadero — Frontend (React + Vite)

Plano de parqueadero en tiempo real. **Ver los puestos no requiere iniciar sesión**;
el login se pide solo cuando se quiere registrar una entrada o una salida.

## Requisitos
- Node.js 18 o superior
- El backend corriendo (por defecto en `http://localhost:3000`)

## Cómo correrlo
```
npm install
npm run dev
```
Abre la URL que muestra Vite (normalmente `http://localhost:5173`).

Si el backend está en otra dirección, cambia `VITE_API_URL` en el archivo `.env`.

## Rutas
| Ruta | Acceso | Qué hace |
|---|---|---|
| `/` | público | Página de inicio |
| `/parqueaderos` | público | Lista de parqueaderos con cupos libres en vivo |
| `/dashboard/:id` | público (lectura) | Plano en vivo. Con sesión: registrar entradas/salidas y ver horas pico |
| `/acceso` | público | Iniciar sesión / crear cuenta (`?volver=/ruta` regresa al plano) |
| `/admin/usuarios` | solo admin | Administración de usuarios |

## Mejoras SCAMPER aplicadas
- **Reorganizar:** plano y cupos públicos; la sesión se pide al registrar la entrada.
- **Adaptar:** contador de puestos libres/ocupados (como el letrero de un centro comercial).
- **Eliminar:** una sola ventana para la entrada (placa) y para la salida (placa, tiempo y valor).
- **Modificar:** botones grandes y plano desplazable en celular.
- **Dar otros usos:** gráfica de horas pico usando los registros existentes.
