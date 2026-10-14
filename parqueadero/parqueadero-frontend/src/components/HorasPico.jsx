import { useEffect, useState } from 'react';
import api from '../services/api';

// Reutiliza los registros de entrada existentes para mostrar a que horas
// llegan mas vehiculos (ultimos 7 dias). Mejora SCAMPER "Dar otros usos".
export default function HorasPico({ parqueaderoId }) {
  const [horas, setHoras] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    api
      .get('/registros/ocupacion-por-hora', { params: { parqueaderoId } })
      .then((r) => activo && setHoras(r.data.horas))
      .catch(() => activo && setError('No se pudo cargar el reporte'));
    return () => {
      activo = false;
    };
  }, [parqueaderoId]);

  if (error) return <p style={{ color: '#dc2626' }}>{error}</p>;
  if (!horas) return <p>Cargando reporte...</p>;

  const maximo = Math.max(1, ...horas.map((h) => h.entradas));
  const total = horas.reduce((suma, h) => suma + h.entradas, 0);
  const pico = horas.reduce((a, b) => (b.entradas > a.entradas ? b : a), horas[0]);

  return (
    <div>
      <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem' }}>Horas pico · ultimos 7 dias</h2>
      <p style={{ margin: '0 0 1rem', color: '#6b7280', fontSize: '0.9rem' }}>
        {total === 0
          ? 'Aun no hay entradas registradas en este parqueadero.'
          : `${total} entradas. Hora con mas llegadas: ${String(pico.hora).padStart(2, '0')}:00 (${pico.entradas}).`}
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '120px', overflowX: 'auto' }}>
        {horas.map((h) => (
          <div
            key={h.hora}
            title={`${String(h.hora).padStart(2, '0')}:00 · ${h.entradas} entradas`}
            style={{ flex: '1 0 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}
          >
            <div
              style={{
                width: '100%',
                height: `${(h.entradas / maximo) * 100}%`,
                minHeight: h.entradas > 0 ? '3px' : '0',
                borderRadius: '3px 3px 0 0',
                background: h.hora === pico.hora && total > 0 ? '#f5a623' : '#93c5fd',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '3px', marginTop: '4px', fontSize: '0.65rem', color: '#6b7280', overflowX: 'auto' }}>
        {horas.map((h) => (
          <span key={h.hora} style={{ flex: '1 0 14px', textAlign: 'center' }}>
            {h.hora % 3 === 0 ? h.hora : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
