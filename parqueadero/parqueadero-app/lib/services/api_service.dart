import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiException implements Exception {
  final String mensaje;
  final int? statusCode;
  ApiException(this.mensaje, {this.statusCode});

  @override
  String toString() => mensaje;
}

class ApiService {
  ApiService._();
  static final ApiService instance = ApiService._();

  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );

  static const _tokenKey = 'token';
  static const _usuarioKey = 'usuario';

  Future<String?> get _token async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> guardarSesion({
    required String token,
    required Map<String, dynamic> usuario,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_usuarioKey, jsonEncode(usuario));
  }

  Future<Map<String, dynamic>?> sesionGuardada() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    final usuarioStr = prefs.getString(_usuarioKey);
    if (token == null || usuarioStr == null) return null;
    return {
      'token': token,
      'usuario': jsonDecode(usuarioStr) as Map<String, dynamic>,
    };
  }

  Future<void> limpiarSesion() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_usuarioKey);
  }

  Future<Map<String, String>> _headers() async {
    final token = await _token;
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Uri _uri(String path) => Uri.parse('$baseUrl$path');

  dynamic _procesar(http.Response respuesta) {
    final body = respuesta.body.isNotEmpty ? jsonDecode(respuesta.body) : null;
    if (respuesta.statusCode >= 200 && respuesta.statusCode < 300) {
      return body;
    }
    final mensaje = (body is Map && body['error'] != null)
        ? body['error'].toString()
        : 'Error inesperado del servidor (${respuesta.statusCode})';
    throw ApiException(mensaje, statusCode: respuesta.statusCode);
  }

  Future<dynamic> get(String path) async {
    try {
      final respuesta = await http.get(_uri(path), headers: await _headers());
      return _procesar(respuesta);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException(
        'No se pudo conectar con el servidor. Revisa tu conexión.',
      );
    }
  }

  Future<dynamic> post(String path, Map<String, dynamic> data) async {
    try {
      final respuesta = await http.post(
        _uri(path),
        headers: await _headers(),
        body: jsonEncode(data),
      );
      return _procesar(respuesta);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException(
        'No se pudo conectar con el servidor. Revisa tu conexión.',
      );
    }
  }

  Future<dynamic> put(String path, Map<String, dynamic> data) async {
    try {
      final respuesta = await http.put(
        _uri(path),
        headers: await _headers(),
        body: jsonEncode(data),
      );
      return _procesar(respuesta);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException(
        'No se pudo conectar con el servidor. Revisa tu conexión.',
      );
    }
  }

  Future<dynamic> delete(String path) async {
    try {
      final respuesta = await http.delete(
        _uri(path),
        headers: await _headers(),
      );
      return _procesar(respuesta);
    } on ApiException {
      rethrow;
    } catch (_) {
      throw ApiException(
        'No se pudo conectar con el servidor. Revisa tu conexión.',
      );
    }
  }
}
