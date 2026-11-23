import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  ALUMNO_ACTUAL,
  CREDENCIALES_PERSONAL,
  DIAS_PRESTAMO,
} from '../constants/credenciales';
import { LISTAS_ESPERA_INICIALES } from '../data/libros';
import { Cola } from '../estructuras/Cola';
import { Pila } from '../estructuras/Pila';
import { cargarEstadoGuardado, guardarEstado } from '../lib/almacenamiento';
import {
  cancelarNotificacion,
  enviarNotificacionEntrega,
  programarRecordatorioDevolucion,
} from '../lib/notificaciones';
import { buscarLibroPorIsbn, sumarDias } from '../lib/validacion';
import type {
  AvisoInterno,
  Libro,
  Prestamo,
  ResultadoEntrega,
  ResultadoReserva,
} from '../types';

type MapaListasEspera = Record<string, Cola<string>>;

function crearListasIniciales(
  datos: Record<string, string[]>,
): MapaListasEspera {
  const resultado: MapaListasEspera = {};
  for (const [isbn, personas] of Object.entries(datos)) {
    resultado[isbn] = new Cola<string>(personas);
  }
  return resultado;
}

function serializarListas(
  listas: MapaListasEspera,
): Record<string, string[]> {
  const resultado: Record<string, string[]> = {};
  for (const [isbn, cola] of Object.entries(listas)) {
    resultado[isbn] = cola.aArray();
  }
  return resultado;
}

type ValorBibliotecaContext = {
  hidratado: boolean;
  prestamos: Prestamo[];
  listasEspera: MapaListasEspera;
  avisos: AvisoInterno[];
  sesionActiva: boolean;
  recientes: Libro[];
  obtenerEjemplaresDisponibles: (libro: Libro) => number;
  obtenerCantidadEnEspera: (isbn: string) => number;
  obtenerFrenteEspera: (isbn: string) => string | undefined;
  obtenerPosicionUsuario: (isbn: string) => number;
  tieneLibroReservadoOPrestado: (isbn: string) => boolean;
  registrarVisto: (libro: Libro) => void;
  reservarLibro: (isbn: string) => ResultadoReserva;
  devolverLibro: (isbn: string) => Promise<void>;
  activarRecordatorio: (isbn: string) => Promise<boolean>;
  desactivarRecordatorio: (isbn: string) => Promise<void>;
  entregarAlSiguiente: (isbn: string) => Promise<ResultadoEntrega>;
  descartarAviso: (id: string) => void;
  iniciarSesion: (usuario: string, clave: string) => boolean;
  cerrarSesion: () => void;
};

const BibliotecaContext = createContext<ValorBibliotecaContext | null>(null);

type PropsBibliotecaProvider = {
  children: ReactNode;
};

export function BibliotecaProvider({ children }: PropsBibliotecaProvider) {
  const [hidratado, setHidratado] = useState<boolean>(false);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [pilaRecientes, setPilaRecientes] = useState<Pila<Libro>>(
    () => new Pila<Libro>(),
  );
  const [listasEspera, setListasEspera] = useState<MapaListasEspera>(() =>
    crearListasIniciales(LISTAS_ESPERA_INICIALES),
  );
  const [avisos, setAvisos] = useState<AvisoInterno[]>([]);
  const [sesionActiva, setSesionActiva] = useState<boolean>(false);

  useEffect(() => {
    let cancelado = false;

    async function hidratar() {
      const guardado = await cargarEstadoGuardado();
      if (!cancelado) {
        if (guardado) {
          setPrestamos(guardado.prestamos);
          setPilaRecientes(new Pila<Libro>(guardado.recientes));
          setListasEspera(crearListasIniciales(guardado.listasEspera));
          setAvisos(guardado.avisos);
        }
        setHidratado(true);
      }
    }

    hidratar();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!hidratado) {
      return;
    }
    void guardarEstado({
      prestamos,
      recientes: pilaRecientes.aArray(),
      listasEspera: serializarListas(listasEspera),
      avisos,
    });
  }, [hidratado, prestamos, pilaRecientes, listasEspera, avisos]);

  const recientes = useMemo(() => {
    const vistos = new Set<string>();
    const ultimos: Libro[] = [];
    const historial = pilaRecientes.aArray();
    for (let i = historial.length - 1; i >= 0 && ultimos.length < 3; i -= 1) {
      const libro = historial[i];
      if (!vistos.has(libro.isbn)) {
        vistos.add(libro.isbn);
        ultimos.push(libro);
      }
    }
    return ultimos;
  }, [pilaRecientes]);

  const obtenerEjemplaresDisponibles = useCallback(
    (libro: Libro): number => {
      const prestados = prestamos.filter((p) => p.isbn === libro.isbn).length;
      return Math.max(0, libro.ejemplares - prestados);
    },
    [prestamos],
  );

  const obtenerCantidadEnEspera = useCallback(
    (isbn: string): number => {
      const cola = listasEspera[isbn];
      return cola ? cola.tamanio : 0;
    },
    [listasEspera],
  );

  const obtenerFrenteEspera = useCallback(
    (isbn: string): string | undefined => {
      const cola = listasEspera[isbn];
      return cola ? cola.verFrente() : undefined;
    },
    [listasEspera],
  );

  const obtenerPosicionUsuario = useCallback(
    (isbn: string): number => {
      const cola = listasEspera[isbn];
      return cola ? cola.posicionDe(ALUMNO_ACTUAL) : -1;
    },
    [listasEspera],
  );

  const tieneLibroReservadoOPrestado = useCallback(
    (isbn: string): boolean => {
      const yaPrestado = prestamos.some((p) => p.isbn === isbn);
      if (yaPrestado) {
        return true;
      }
      const cola = listasEspera[isbn];
      return cola ? cola.posicionDe(ALUMNO_ACTUAL) !== -1 : false;
    },
    [prestamos, listasEspera],
  );

  const registrarVisto = useCallback((libro: Libro) => {
    setPilaRecientes((pilaActual) => {
      if (pilaActual.verTope()?.isbn === libro.isbn) {
        return pilaActual;
      }
      const nuevaPila = pilaActual.clonar();
      nuevaPila.push(libro);
      return nuevaPila;
    });
  }, []);

  const reservarLibro = useCallback(
    (isbn: string): ResultadoReserva => {
      const libro = buscarLibroPorIsbn(isbn);
      if (!libro) {
        return {
          tipo: 'no_encontrado',
          mensaje: 'No encontramos ese libro en el catálogo.',
        };
      }

      if (tieneLibroReservadoOPrestado(isbn)) {
        return {
          tipo: 'duplicado',
          mensaje: 'Ya tenés este libro en préstamo o en tu lista de espera.',
        };
      }

      const disponibles = obtenerEjemplaresDisponibles(libro);
      if (disponibles > 0) {
        const hoy = new Date();
        const devolucion = sumarDias(hoy, DIAS_PRESTAMO);
        const nuevoPrestamo: Prestamo = {
          isbn: libro.isbn,
          titulo: libro.titulo,
          autor: libro.autor,
          fechaPrestamo: hoy.toISOString(),
          fechaDevolucion: devolucion.toISOString(),
          recordatorioActivo: false,
          notificacionId: null,
        };
        setPrestamos((actuales) => [nuevoPrestamo, ...actuales]);
        return { tipo: 'prestamo', prestamo: nuevoPrestamo };
      }

      const colaActual = listasEspera[isbn] ?? new Cola<string>();
      const nuevaCola = colaActual.clonar();
      nuevaCola.encolar(ALUMNO_ACTUAL);
      const posicion = nuevaCola.tamanio;

      setListasEspera((actuales) => ({
        ...actuales,
        [isbn]: nuevaCola,
      }));

      return { tipo: 'espera', posicion };
    },
    [listasEspera, obtenerEjemplaresDisponibles, tieneLibroReservadoOPrestado],
  );

  const devolverLibro = useCallback(
    async (isbn: string): Promise<void> => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (prestamo?.notificacionId) {
        await cancelarNotificacion(prestamo.notificacionId);
      }
      setPrestamos((actuales) => actuales.filter((p) => p.isbn !== isbn));
    },
    [prestamos],
  );

  const activarRecordatorio = useCallback(
    async (isbn: string): Promise<boolean> => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (!prestamo) {
        return false;
      }
      if (prestamo.notificacionId) {
        await cancelarNotificacion(prestamo.notificacionId);
      }
      const idNotif = await programarRecordatorioDevolucion(prestamo.titulo);
      setPrestamos((actuales) =>
        actuales.map((p) =>
          p.isbn === isbn
            ? { ...p, recordatorioActivo: true, notificacionId: idNotif }
            : p,
        ),
      );
      return true;
    },
    [prestamos],
  );

  const desactivarRecordatorio = useCallback(
    async (isbn: string): Promise<void> => {
      const prestamo = prestamos.find((p) => p.isbn === isbn);
      if (prestamo?.notificacionId) {
        await cancelarNotificacion(prestamo.notificacionId);
      }
      setPrestamos((actuales) =>
        actuales.map((p) =>
          p.isbn === isbn
            ? { ...p, recordatorioActivo: false, notificacionId: null }
            : p,
        ),
      );
    },
    [prestamos],
  );

  const entregarAlSiguiente = useCallback(
    async (isbn: string): Promise<ResultadoEntrega> => {
      const colaActual = listasEspera[isbn];
      if (!colaActual || colaActual.estaVacia()) {
        return {
          entregadoA: null,
          esUsuarioActual: false,
          notificadoPorSistema: false,
        };
      }

      const nuevaCola = colaActual.clonar();
      const persona = nuevaCola.desencolar() ?? null;

      setListasEspera((actuales) => ({
        ...actuales,
        [isbn]: nuevaCola,
      }));

      if (!persona) {
        return {
          entregadoA: null,
          esUsuarioActual: false,
          notificadoPorSistema: false,
        };
      }

      const esUsuarioActual = persona === ALUMNO_ACTUAL;
      if (!esUsuarioActual) {
        return {
          entregadoA: persona,
          esUsuarioActual: false,
          notificadoPorSistema: false,
        };
      }

      const libro = buscarLibroPorIsbn(isbn);
      if (libro) {
        const hoy = new Date();
        const devolucion = sumarDias(hoy, DIAS_PRESTAMO);
        const nuevoPrestamo: Prestamo = {
          isbn: libro.isbn,
          titulo: libro.titulo,
          autor: libro.autor,
          fechaPrestamo: hoy.toISOString(),
          fechaDevolucion: devolucion.toISOString(),
          recordatorioActivo: false,
          notificacionId: null,
        };
        setPrestamos((actuales) => {
          if (actuales.some((p) => p.isbn === isbn)) {
            return actuales;
          }
          return [nuevoPrestamo, ...actuales];
        });

        const notificadoPorSistema = await enviarNotificacionEntrega(
          libro.titulo,
        );
        if (!notificadoPorSistema) {
          const nuevoAviso: AvisoInterno = {
            id: `${isbn}-${Date.now()}`,
            titulo: '¡Libro listo para retirar!',
            mensaje: `Se te asignó "${libro.titulo}" desde la lista de espera. Pasá por el mostrador a retirarlo.`,
            fecha: hoy.toISOString(),
          };
          setAvisos((actuales) => [nuevoAviso, ...actuales]);
        }

        return {
          entregadoA: persona,
          esUsuarioActual: true,
          notificadoPorSistema,
        };
      }

      return {
        entregadoA: persona,
        esUsuarioActual: true,
        notificadoPorSistema: false,
      };
    },
    [listasEspera],
  );

  const descartarAviso = useCallback((id: string) => {
    setAvisos((actuales) => actuales.filter((aviso) => aviso.id !== id));
  }, []);

  const iniciarSesion = useCallback((usuario: string, clave: string): boolean => {
    const esValido =
      usuario.trim() === CREDENCIALES_PERSONAL.usuario &&
      clave === CREDENCIALES_PERSONAL.clave;
    if (esValido) {
      setSesionActiva(true);
    }
    return esValido;
  }, []);

  const cerrarSesion = useCallback(() => {
    setSesionActiva(false);
  }, []);

  const valor = useMemo<ValorBibliotecaContext>(
    () => ({
      hidratado,
      prestamos,
      listasEspera,
      avisos,
      sesionActiva,
      recientes,
      obtenerEjemplaresDisponibles,
      obtenerCantidadEnEspera,
      obtenerFrenteEspera,
      obtenerPosicionUsuario,
      tieneLibroReservadoOPrestado,
      registrarVisto,
      reservarLibro,
      devolverLibro,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      descartarAviso,
      iniciarSesion,
      cerrarSesion,
    }),
    [
      hidratado,
      prestamos,
      listasEspera,
      avisos,
      sesionActiva,
      recientes,
      obtenerEjemplaresDisponibles,
      obtenerCantidadEnEspera,
      obtenerFrenteEspera,
      obtenerPosicionUsuario,
      tieneLibroReservadoOPrestado,
      registrarVisto,
      reservarLibro,
      devolverLibro,
      activarRecordatorio,
      desactivarRecordatorio,
      entregarAlSiguiente,
      descartarAviso,
      iniciarSesion,
      cerrarSesion,
    ],
  );

  return (
    <BibliotecaContext.Provider value={valor}>
      {children}
    </BibliotecaContext.Provider>
  );
}

export function useBiblioteca(): ValorBibliotecaContext {
  const contexto = useContext(BibliotecaContext);
  if (!contexto) {
    throw new Error('useBiblioteca debe usarse dentro de BibliotecaProvider.');
  }
  return contexto;
}
