import { useEffect, useState } from 'react';

const PUESTOS_DEMO = [
  { id: 1, x: 4, y: 8, estado: 'libre' },
  { id: 2, x: 16, y: 8, estado: 'ocupado' },
  { id: 3, x: 28, y: 8, estado: 'libre' },
  { id: 4, x: 4, y: 26, estado: 'ocupado' },
  { id: 5, x: 16, y: 26, estado: 'libre' },
  { id: 6, x: 28, y: 26, estado: 'libre' },
  { id: 7, x: 4, y: 44, estado: 'ocupado' },
  { id: 8, x: 16, y: 44, estado: 'libre' },
];

export default function MiniPlanoAnimado() {
  const [puestos, setPuestos] = useState(PUESTOS_DEMO);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setPuestos((actuales) => {
        const indice = Math.floor(Math.random() * actuales.length);
        return actuales.map((p, i) =>
          i === indice ? { ...p, estado: p.estado === 'libre' ? 'ocupado' : 'libre' } : p
        );
      });
    }, 1400);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <svg viewBox="0 0 40 58" className="mini-plano">
      <rect x="0" y="0" width="40" height="58" rx="2" fill="var(--asfalto-suave)" />
      <text x="2" y="4" fontSize="2" fill="var(--papel)" opacity="0.5" fontFamily="var(--fuente-mono)">
        ENTRADA ↓
      </text>
      {puestos.map((p) => (
        <rect
          key={p.id}
          x={p.x}
          y={p.y}
          width="10"
          height="14"
          rx="1"
          fill={p.estado === 'libre' ? 'var(--verde-ruta)' : 'var(--coral-alerta)'}
          style={{ transition: 'fill 0.5s ease' }}
        />
      ))}
    </svg>
  );
}
