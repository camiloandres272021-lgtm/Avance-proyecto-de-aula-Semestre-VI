import '../models/usuario.dart';
import 'api_service.dart';

class UsuariosService {
  final _api = ApiService.instance;

  Future<List<Usuario>> listar() async {
    final respuesta = await _api.get('/usuarios');
    final lista = (respuesta['usuarios'] as List).cast<Map<String, dynamic>>();
    return lista.map(Usuario.fromJson).toList();
  }

  Future<Usuario> cambiarRol(String id, String nuevoRol) async {
    final respuesta = await _api.put('/usuarios/$id/rol', {'rol': nuevoRol});
    return Usuario.fromJson(respuesta['usuario'] as Map<String, dynamic>);
  }

  Future<Usuario> cambiarEstado(String id, bool activo) async {
    final respuesta =
        await _api.put('/usuarios/$id/estado', {'activo': activo});
    return Usuario.fromJson(respuesta['usuario'] as Map<String, dynamic>);
  }

  Future<void> eliminar(String id) async {
    await _api.delete('/usuarios/$id');
  }
}
