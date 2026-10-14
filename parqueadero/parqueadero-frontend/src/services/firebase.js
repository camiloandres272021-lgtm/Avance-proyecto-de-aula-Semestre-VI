import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
} from 'firebase/auth';

// Pega aqui la configuracion que te dio la consola de Firebase
// (Project settings > General > Tus apps > Config del SDK).
// Recomendado: sacar estos valores de variables de entorno (.env) para no
// dejarlos escritos directo en el codigo si vas a subir esto a un repo publico.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase se inicia solo cuando se usa (login con Google o telefono). Si faltan
// las variables VITE_FIREBASE_* en el .env, la app igual abre y el login normal
// con email funciona; solo Google/telefono avisan que falta configurar.
let authInstancia = null;
function obtenerAuth() {
  if (!firebaseConfig.apiKey) {
    throw new Error('Falta configurar Firebase (variables VITE_FIREBASE_* en el .env del frontend)');
  }
  if (!authInstancia) authInstancia = getAuth(initializeApp(firebaseConfig));
  return authInstancia;
}
export const googleProvider = new GoogleAuthProvider();

// --- Login con Google (popup) ---
export async function iniciarSesionConGoogle() {
  const resultado = await signInWithPopup(obtenerAuth(), googleProvider);
  const idToken = await resultado.user.getIdToken();
  return idToken;
}

// --- Login con telefono (paso 1: enviar el codigo por SMS) ---
// containerId: el id del div invisible donde Firebase monta el reCAPTCHA
export function crearRecaptcha(containerId) {
  return new RecaptchaVerifier(obtenerAuth(), containerId, {
    size: 'invisible',
  });
}

export async function enviarCodigoSMS(numeroTelefono, recaptchaVerifier) {
  // numeroTelefono debe incluir el codigo de pais, ej: "+573001234567"
  const confirmationResult = await signInWithPhoneNumber(obtenerAuth(), numeroTelefono, recaptchaVerifier);
  return confirmationResult; // guarda esto para el paso 2 (confirmar codigo)
}

// --- Login con telefono (paso 2: confirmar el codigo que el usuario recibio) ---
export async function confirmarCodigoSMS(confirmationResult, codigo) {
  const resultado = await confirmationResult.confirm(codigo);
  const idToken = await resultado.user.getIdToken();
  return idToken;
}
