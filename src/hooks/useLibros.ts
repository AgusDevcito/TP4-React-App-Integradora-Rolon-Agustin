import { useCallback, useEffect, useState } from 'react';

import { obtenerLibros } from '../lib/api';
import type { Libro } from '../types';

type ResultadoUseLibros = {
  libros: Libro[];
  cargando: boolean;
  error: string | null;
  reintentar: () => void;
};

export function useLibros(): ResultadoUseLibros {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState<number>(0);

  useEffect(() => {
    let cancelado = false;

    async function cargarCatalogo() {
      setCargando(true);
      setError(null);
      try {
        const datos = await obtenerLibros();
        if (!cancelado) {
          setLibros(datos);
          setCargando(false);
        }
      } catch {
        if (!cancelado) {
          setError(
            'No pudimos conectarnos con el catálogo de la biblioteca. Intentá nuevamente.',
          );
          setCargando(false);
        }
      }
    }

    cargarCatalogo();

    return () => {
      cancelado = true;
    };
  }, [intento]);

  const reintentar = useCallback(() => {
    setIntento((actual) => actual + 1);
  }, []);

  return { libros, cargando, error, reintentar };
}
