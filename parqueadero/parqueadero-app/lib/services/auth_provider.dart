import 'package:flutter/foundation.dart';
import '../models/usuario.dart';
import 'api_service.dart';

class AuthProvider extends ChangeNotifier {
  Usuario? _usuario;
  bool _cargandoSesion = true;

  Usuario? get usuario => _usuario;
  bool get estaLogueado => _usuario != null;
  bool get cargandoSesion => _cargandoSesion;
  bool get esAdmin => _usuario?.esAdmin ?? false;

  AuthProvider() {
    _restaurarSesion();
  }

  Future<void> _restaurarSesion() async {
    final sesion = await ApiService.instance.sesionGuardada();
    if (sesion != null) {
      _usuario = Usuario.fromJson(sesion['usuario'] as Map<String, dynamic>);
    }
    _cargandoSesion = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final respuesta = await ApiService.instance.post('/auth/login', {
      'email': email,
      'password': password,
    });
    final datosUsuario = respuesta['usuario'] as Map<String, dynamic>;
    await ApiService.instance
        .guardarSesion(token: respuesta['token'], usuario: datosUsuario);
    _usuario = Usuario.fromJson(datosUsuario);
    notifyListeners();
  }

  Future<void> logout() async {
    await ApiService.instance.limpiarSesion();
    _usuario = null;
    notifyListeners();
  }
}
