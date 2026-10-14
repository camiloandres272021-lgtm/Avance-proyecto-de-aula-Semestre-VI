import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_provider.dart';
import 'login_screen.dart';
import 'usuarios_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final usuario = auth.usuario;

    return Scaffold(
      appBar: AppBar(
        title: const Text('ZONE PARKING'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Cerrar sesión',
            onPressed: () async {
              await auth.logout();
              if (context.mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: Text(usuario?.nombre ?? ''),
              subtitle: Text('Rol: ${usuario?.rol ?? ''}'),
            ),
          ),
          const SizedBox(height: 8),
          _Opcion(
            icon: Icons.local_parking,
            titulo: 'Parqueaderos',
            subtitulo: 'Ver puestos y registros de entrada/salida',
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Pantalla de parqueaderos: próximamente en esta app',
                  ),
                ),
              );
            },
          ),
          if (auth.esAdmin)
            _Opcion(
              icon: Icons.group,
              titulo: 'Gestión de usuarios',
              subtitulo: 'Cambiar roles, bloquear o eliminar usuarios',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const UsuariosScreen()),
                );
              },
            ),
        ],
      ),
    );
  }
}

class _Opcion extends StatelessWidget {
  final IconData icon;
  final String titulo;
  final String subtitulo;
  final VoidCallback onTap;

  const _Opcion({
    required this.icon,
    required this.titulo,
    required this.subtitulo,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(top: 8),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFF2563EB)),
        title: Text(titulo),
        subtitle: Text(subtitulo),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
