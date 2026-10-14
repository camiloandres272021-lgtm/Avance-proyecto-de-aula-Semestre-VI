// Config visual del plano de MallPlaza.
// Estas coordenadas (en el mismo sistema de porcentaje 0-100 / 0-56 que usan
// los puestos reales) dibujan el "esqueleto" del plano: contorno del
// edificio, rampas, nucleo de ascensores y las zonas de color, tal como en
// el plano fisico. Los puestos individuales (los rectangulos clicables)
// vienen siempre del backend, esto solo es la decoracion de fondo.

export const VIEWBOX = '0 0 100 56';

export const COLORES_ZONA = {
  estandar: { relleno: '#e5e7eb', borde: '#9ca3af' },
  preferencial: { relleno: '#dbeafe', borde: '#3b82f6' },
  moto: { relleno: '#fed7aa', borde: '#f97316' },
  bicicleta: { relleno: '#bbf7d0', borde: '#22c55e' },
};

export const COLORES_ESTADO = {
  libre: { relleno: '#86efac', borde: '#16a34a' },
  ocupado: { relleno: '#fca5a5', borde: '#dc2626' },
};

const ZONAS_SOTANO_1 = [
  { x: 2, y: 3, ancho: 96, alto: 48, tipo: 'contorno' },
  { x: 3, y: 5, ancho: 16, alto: 10, tipo: 'preferencial', label: 'ZONA\nPREFERENCIAL' },
  { x: 3, y: 16, ancho: 16, alto: 10, tipo: 'moto', label: 'ZONA\nMOTOCICLETAS' },
  { x: 3, y: 28, ancho: 16, alto: 10, tipo: 'bicicleta', label: 'ZONA\nBICICLETAS' },
  { x: 3, y: 40, ancho: 16, alto: 10, tipo: 'rampa', label: 'RAMPA DE\nSALIDA' },
  { x: 70, y: 5, ancho: 10, alto: 10, tipo: 'ascensor', label: 'ACCESO\nMALLPLAZA' },
  { x: 70, y: 16, ancho: 10, alto: 21, tipo: 'ascensor', label: 'NÚCLEO DE\nASCENSORES Y\nESCALERAS' },
  { x: 70, y: 40, ancho: 10, alto: 10, tipo: 'ascensor', label: 'SALIDA\nVEHÍCULOS' },
];

const ZONAS_SOTANO_2 = [
  { x: 2, y: 3, ancho: 96, alto: 48, tipo: 'contorno' },
  { x: 71, y: 5, ancho: 9, alto: 45, tipo: 'ascensor', label: 'NÚCLEO DE\nASCENSORES' },
  { x: 81, y: 5, ancho: 17, alto: 45, tipo: 'ancla', label: 'TIENDAS ANCLA\nJUMBO · FALABELLA' },
];

export const LAYOUTS_POR_NIVEL = {
  'Sotano 1': {
    etiqueta: 'Nivel Sótano 1',
    zonas: ZONAS_SOTANO_1,
    rotulos: [
      { x: 21, y: 4.5, texto: '▼ RAMPA DE ENTRADA' },
      { x: 40, y: 53.5, texto: '↔ CIRCULACIÓN VEHICULAR' },
    ],
  },
  'Sotano 2': {
    etiqueta: 'Nivel Sótano 2',
    zonas: ZONAS_SOTANO_2,
    rotulos: [
      { x: 4, y: 4.5, texto: 'HACIA CENTRO COMERCIAL →' },
      { x: 40, y: 53.5, texto: '↔ CIRCULACIÓN VEHICULAR' },
    ],
  },
};

export const NIVELES = ['Sotano 1', 'Sotano 2'];

// Devuelve el layout decorativo (contorno, zonas de color, rotulos) para un
// nivel dado. Si el nivel tiene un plano dibujado a mano (como los de Mall
// Plaza, arriba) lo usa; si no (parqueaderos nuevos, creados desde la
// pantalla "Parqueaderos"), devuelve una cuadricula generica: solo el
// contorno del edificio, sin zonas de color ni rotulos, para que el admin
// la vaya llenando con puestos reales desde el modo "Editar posiciones".
export function obtenerLayoutNivel(nivel) {
  return (
    LAYOUTS_POR_NIVEL[nivel] || {
      etiqueta: nivel,
      zonas: [{ x: 2, y: 3, ancho: 96, alto: 48, tipo: 'contorno' }],
      rotulos: [],
    }
  );
}
