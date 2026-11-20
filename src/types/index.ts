export type Libro = {
  isbn: string; // 13 dígitos, sin guiones
  titulo: string;
  autor: string;
  anio: number;
  ejemplares: number; // ejemplares en el estante al iniciar la app
};

export type Prestamo = {
  isbn: string;
  titulo: string;
  autor: string;
  fechaPrestamo: string;
  fechaDevolucion: string;
  recordatorioActivo: boolean;
  notificacionId: string | null;
};

export type AvisoInterno = {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
};

export type RecursoPermiso = 'camara' | 'notificaciones';

export type EstadoPermiso = 'cargando' | 'concedido' | 'preguntable' | 'bloqueado';

export type ResultadoReserva =
  | { tipo: 'prestamo'; prestamo: Prestamo }
  | { tipo: 'espera'; posicion: number }
  | { tipo: 'duplicado'; mensaje: string }
  | { tipo: 'no_encontrado'; mensaje: string };

export type ResultadoEntrega = {
  entregadoA: string | null;
  esUsuarioActual: boolean;
  notificadoPorSistema: boolean;
};

export type EstadoPersistido = {
  prestamos: Prestamo[];
  recientes: Libro[];
  listasEspera: Record<string, string[]>;
  avisos: AvisoInterno[];
};
