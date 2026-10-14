import { useEffect, useRef, useState } from 'react';


export function useEnVista(umbral = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observador.unobserve(elemento);
        }
      },
      { threshold: umbral }
    );

    observador.observe(elemento);
    return () => observador.disconnect();
  }, [umbral]);

  return [ref, visible];
}
