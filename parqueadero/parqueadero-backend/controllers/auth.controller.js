const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const { admin, firebaseListo } = require('../config/firebaseAdmin');

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario._id, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function formatearUsuario(usuario) {
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol,
  };
}

async function registrar(req, res) {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Nombre, email y password son obligatorios' });
    }

    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: passwordEncriptada,
      rol: 'operador',
    });

    await nuevoUsuario.save();


    res.status(201).json({
      mensaje: 'Usuario registrado correctamente',
      usuario: {
        id: nuevoUsuario._id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      },
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno al registrar el usuario' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y password son obligatorios' });
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const passwordCorrecta = await bcrypt.compare(password, usuario.password);
    if (!passwordCorrecta) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    if (usuario.activo === false) {
      return res.status(403).json({ error: 'Tu cuenta esta bloqueada. Contacta a un administrador.' });
    }

    const token = generarToken(usuario);

    res.json({
      mensaje: 'Inicio de sesion exitoso',
      token,
      usuario: formatearUsuario(usuario),
    });
  } catch (error) {
    console.error('Error al iniciar sesion:', error);
    res.status(500).json({ error: 'Error interno al iniciar sesion' });
  }
}

async function loginConFirebase(req, res) {
  try {
    if (!firebaseListo) {
      return res.status(503).json({ error: 'El login con Google/telefono no esta configurado en el servidor todavia' });
    }

    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Falta el idToken de Firebase' });
    }

    const datosFirebase = await admin.auth().verifyIdToken(idToken);
    const { uid, email, phone_number: telefono, name } = datosFirebase;

    let usuario = await Usuario.findOne({
      $or: [{ firebaseUid: uid }, ...(email ? [{ email }] : []), ...(telefono ? [{ telefono }] : [])],
    });

    if (!usuario) {
      usuario = new Usuario({
        nombre: name || email || telefono || 'Usuario',
        email: email || undefined,
        telefono: telefono || undefined,
        firebaseUid: uid,
        rol: 'operador',
      });
      await usuario.save();
    } else if (!usuario.firebaseUid) {
      usuario.firebaseUid = uid;
      await usuario.save();
    }

    if (usuario.activo === false) {
      return res.status(403).json({ error: 'Tu cuenta esta bloqueada. Contacta a un administrador.' });
    }

    const token = generarToken(usuario);

    res.json({
      mensaje: 'Inicio de sesion exitoso',
      token,
      usuario: formatearUsuario(usuario),
    });
  } catch (error) {
    console.error('Error en login con Firebase:', error);
    res.status(401).json({ error: 'No se pudo verificar el inicio de sesion' });
  }
}

module.exports = { registrar, login, loginConFirebase };
