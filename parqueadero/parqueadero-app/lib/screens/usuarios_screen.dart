import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/usuario.dart';
import '../services/api_service.dart';
import '../services/auth_provider.dart';
import '../services/usuarios_service.dart';

class UsuariosScreen extends StatefulWidget {
  const UsuariosScreen({super.key});

  @override
  State<UsuariosScreen> createState() => _UsuariosScreenState();
}

class _UsuariosScreenState extends State<UsuariosScreen> {
  final _servicio = UsuariosService();

  List<Usuario> _usuarios = [];
  bool _cargando = true;
  String? _error;
  String? _procesandoId;

  @override
  void initState() {
    super.initState();
    _cargarUsuarios();
  }

  Future<void> _cargarUsuarios() async {
    setState(() {
      _cargando = true;
      _error = null;
    });
    try {
      final usuarios = await _servicio.listar();
      setState(() => _usuarios = usuarios);
    } catch (e) {
      setState(
        () => _error = e is ApiException
            ? e.mensaje
            : 'No se pudieron cargar los usuarios',
      );
    } finally {
      if (mounted) setState(() => _cargando = false);
    }
  }

  Future<void> _cambiarRol(Usuario u, String nuevoRol) async {
    if (nuevoRol == u.rol) return;
    setState(() => _procesandoId = u.id);
    try {
      final actualizado = await _servicio.cambiarRol(u.id, nuevoRol);
      setState(
        () => _usuarios =
            _usuarios.map((x) => x.id == u.id ? actualizado : x).toList(),
      );
    } catch (e) {
      _mostrarError(e, 'No se pudo cambiar el rol');
    } finally {
      if (mounted) setState(() => _procesandoId = null);
    }
  }

  Future<void> _alternarBloqueo(Usuario u) async {
    final nuevoEstado = !u.activo;
    final confirmar = await _confirmar(
      nuevoEstado ? '¿Desbloquear a ${u.nombre}?' : '¿Bloquear a ${u.nombre}?',
      nuevoEstado ? '' : 'No podrá iniciar sesión hasta que lo desbloquees.',
    );
    if (!confirmar) return;

    setState(() => _procesandoId = u.id);
    try {
      final actualizado = await _servicio.cambiarEstado(u.id, nuevoEstado);
      setState(
        () => _usuarios =
            _usuarios.map((x) => x.id == u.id ? actualizado : x).toList(),
      );
    } catch (e) {
      _mostrarError(e, 'No se pudo cambiar el estado');
    } finally {
      if (mounted) setState(() => _procesandoId = null);
    }
  }

  Future<void> _eliminar(Usuario u) async {
    final confirmar = await _confirmar(
      '¿Eliminar definitivamente a ${u.nombre}?',
      'Esta acción no se puede deshacer.',
    );
    if (!confirmar) return;

    setState(() => _procesandoId = u.id);
    try {
      await _servicio.eliminar(u.id);
      setState(() => _usuarios = _usuarios.where((x) => x.id != u.id).toList());
    } catch (e) {
      _mostrarError(e, 'No se pudo eliminar el usuario');
    } finally {
      if (mounted) setState(() => _procesandoId = null);
    }
  }

  Future<bool> _confirmar(String titulo, String contenido) async {
    final resultado = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(titulo),
        content: contenido.isNotEmpty ? Text(contenido) : null,
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancelar'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
    return resultado ?? false;
  }

  void _mostrarError(Object e, String fallback) {
    final mensaje = e is ApiException ? e.mensaje : fallback;
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(mensaje)));
  }

  @override
  Widget build(BuildContext context) {
    final miId = context.watch<AuthProvider>().usuario?.id;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestión de usuarios'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _cargarUsuarios,
            tooltip: 'Recargar',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _cargarUsuarios,
        child: _construirCuerpo(miId),
      ),
    );
  }

  Widget _construirCuerpo(String? miId) {
    if (_cargando) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return ListView(
        children: [
          const SizedBox(height: 80),
          Icon(Icons.error_outline, size: 40, color: Colors.red.shade300),
          const SizedBox(height: 8),
          Center(
            child: Text(_error!, style: TextStyle(color: Colors.red.shade300)),
          ),
        ],
      );
    }
    if (_usuarios.isEmpty) {
      return const Center(child: Text('No hay usuarios registrados'));
    }

    return ListView.separated(
      padding: const EdgeInsets.all(12),
      itemCount: _usuarios.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final u = _usuarios[i];
        final esYoMismo = u.id == miId;
        final bloqueado = !u.activo;
        final procesando = _procesandoId == u.id;

        return Card(
          color: bloqueado ? Colors.red.withValues(alpha: 0.06) : null,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text.rich(
                        TextSpan(
                          children: [
                            TextSpan(
                              text: u.nombre,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            if (esYoMismo)
                              const TextSpan(
                                text: '  (tú)',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 13,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                    _Badge(bloqueado: bloqueado),
                  ],
                ),
                const SizedBox(height: 2),
                Text(u.contacto, style: const TextStyle(color: Colors.grey)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text('Rol: '),
                    const SizedBox(width: 4),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        initialValue: u.rol,
                        isDense: true,
                        decoration: const InputDecoration(
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          border: OutlineInputBorder(),
                        ),
                        items: const [
                          DropdownMenuItem(
                            value: 'operador',
                            child: Text('Operador'),
                          ),
                          DropdownMenuItem(
                            value: 'admin',
                            child: Text('Admin'),
                          ),
                        ],
                        onChanged: (esYoMismo || procesando)
                            ? null
                            : (v) => _cambiarRol(u, v!),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: Icon(
                          bloqueado ? Icons.lock_open : Icons.lock_outline,
                          size: 18,
                        ),
                        label: Text(bloqueado ? 'Desbloquear' : 'Bloquear'),
                        onPressed: (esYoMismo || procesando)
                            ? null
                            : () => _alternarBloqueo(u),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                        ),
                        icon: const Icon(Icons.delete_outline, size: 18),
                        label: const Text('Eliminar'),
                        onPressed: (esYoMismo || procesando)
                            ? null
                            : () => _eliminar(u),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _Badge extends StatelessWidget {
  final bool bloqueado;
  const _Badge({required this.bloqueado});

  @override
  Widget build(BuildContext context) {
    final color = bloqueado ? Colors.red : Colors.green;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        bloqueado ? 'Bloqueado' : 'Activo',
        style: TextStyle(
          color: color.shade700,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
