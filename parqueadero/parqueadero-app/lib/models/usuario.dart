class Usuario {
  final String id;
  final String nombre;
  final String? email;
  final String? telefono;
  final String rol;
  final bool activo;

  Usuario({
    required this.id,
    required this.nombre,
    this.email,
    this.telefono,
    required this.rol,
    this.activo = true,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) {
    return Usuario(
      id: (json['_id'] ?? json['id']).toString(),
      nombre: json['nombre'] ?? '',
      email: json['email'],
      telefono: json['telefono'],
      rol: json['rol'] ?? 'operador',
      activo: json['activo'] ?? true,
    );
  }

  Usuario copyWith({String? rol, bool? activo}) {
    return Usuario(
      id: id,
      nombre: nombre,
      email: email,
      telefono: telefono,
      rol: rol ?? this.rol,
      activo: activo ?? this.activo,
    );
  }

  bool get esAdmin => rol == 'admin';

  String get contacto => email ?? telefono ?? '—';
}
