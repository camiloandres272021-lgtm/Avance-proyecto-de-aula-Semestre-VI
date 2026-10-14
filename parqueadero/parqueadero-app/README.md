# parqueadero_app

App móvil (Flutter) de ZONE PARKING. Por ahora incluye:

- Login contra `parqueadero-backend` (`/auth/login`).
- **Gestión de usuarios** (`/usuarios`), igual que `AdminUsuarios.jsx` del frontend web:
  listar, cambiar rol (operador/admin), bloquear/desbloquear y eliminar. Un admin no puede
  tocar su propia cuenta (mismas reglas que ya tiene el backend).
- Pantalla Home con acceso a "Gestión de usuarios" solo si el rol es `admin`.

Este zip trae `pubspec.yaml` y `lib/`, pero **no** trae las carpetas `android/` e `ios/`
(el entorno donde se generó no tiene el SDK de Flutter instalado para crearlas). Se generan
en un paso, abajo.

## 1. Descomprimir y generar las carpetas de plataforma

```bash
unzip parqueadero_app.zip -d parqueadero_app
cd parqueadero_app
flutter create .
```

`flutter create .` sobre un proyecto que ya tiene `pubspec.yaml` y `lib/` solo agrega lo que
falta (android/, ios/, etc.) — no te va a pisar el código.

## 2. Instalar dependencias

```bash
flutter pub get
```

## 3. Apuntar la app a tu backend

La URL del backend se pasa en tiempo de compilación (no hay `.env` en Flutter). Por defecto
usa `http://10.0.2.2:3000`, que es como el **emulador de Android** ve tu `localhost`.

```bash
# Emulador Android (valor por defecto, no hace falta pasarlo)
flutter run

# Simulador iOS
flutter run --dart-define=API_URL=http://localhost:3000

# Dispositivo físico (celular real en la misma red que tu PC)
flutter run --dart-define=API_URL=http://TU_IP_LOCAL:3000
```

Recuerda que tu `parqueadero-backend` debe estar corriendo (`npm start` o `node server.js`)
y accesible desde donde corras la app.

## 4. Compilar el APK

```bash
flutter build apk --dart-define=API_URL=http://TU_IP_O_DOMINIO:3000
```

El APK queda en `build/app/outputs/flutter-apk/app-release.apk`.

## Estructura

```
lib/
  main.dart                     -> arranque de la app + decide login u home según sesión
  models/usuario.dart           -> modelo Usuario (igual forma que el backend)
  services/api_service.dart     -> cliente HTTP + guardado de sesión (SharedPreferences)
  services/auth_provider.dart   -> equivalente a AuthContext.jsx (login/logout/estado)
  services/usuarios_service.dart-> llamadas a /usuarios (listar, rol, estado, eliminar)
  screens/login_screen.dart
  screens/home_screen.dart
  screens/usuarios_screen.dart  -> pantalla de administración de usuarios
```

## Próximos pasos sugeridos

- Pantalla de parqueaderos / puestos / registros de entrada-salida (usa
  `parqueaderos.routes.js`, `puestos.routes.js`, `registros.routes.js`), ahora que el backend
  soporta múltiples parqueaderos.
- Socket.io en tiempo real (el backend ya lo expone en `config/socket.js`), con el paquete
  `socket_io_client` de pub.dev.
