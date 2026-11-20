export type PaletaColores = {
  fondo: string;
  superficie: string;
  superficieSecundaria: string;
  primario: string;
  primarioOscuro: string;
  primarioSuave: string;
  texto: string;
  textoSecundario: string;
  textoSobrePrimario: string;
  borde: string;
  exito: string;
  exitoFondo: string;
  advertencia: string;
  advertenciaFondo: string;
  error: string;
  errorFondo: string;
  superposicionOscura: string;
  textoSobreOscuro: string;
};

export const COLORES_CLARO: PaletaColores = {
  fondo: '#F5F7FA',
  superficie: '#FFFFFF',
  superficieSecundaria: '#EEF2F7',
  primario: '#1E3A5F',
  primarioOscuro: '#132742',
  primarioSuave: '#DCE8F7',
  texto: '#1A202C',
  textoSecundario: '#4A5568',
  textoSobrePrimario: '#FFFFFF',
  borde: '#D8E0EB',
  exito: '#1F7A4D',
  exitoFondo: '#E6F5EC',
  advertencia: '#9A6700',
  advertenciaFondo: '#FFF6DF',
  error: '#B91C1C',
  errorFondo: '#FDECEC',
  superposicionOscura: 'rgba(0, 0, 0, 0.55)',
  textoSobreOscuro: '#FFFFFF',
};

export const COLORES_OSCURO: PaletaColores = {
  fondo: '#0F172A',
  superficie: '#1E293B',
  superficieSecundaria: '#283548',
  primario: '#60A5FA',
  primarioOscuro: '#3B82F6',
  primarioSuave: '#1E3A5F',
  texto: '#F8FAFC',
  textoSecundario: '#CBD5E1',
  textoSobrePrimario: '#0F172A',
  borde: '#334155',
  exito: '#4ADE80',
  exitoFondo: '#143326',
  advertencia: '#FACC15',
  advertenciaFondo: '#3A2E0F',
  error: '#F87171',
  errorFondo: '#3F1D1D',
  superposicionOscura: 'rgba(0, 0, 0, 0.72)',
  textoSobreOscuro: '#FFFFFF',
};

export const ESPACIADO = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const TAMANIO_TEXTO = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
} as const;

export const RADIOS = {
  sm: 6,
  md: 10,
  lg: 14,
  completo: 999,
} as const;

export const ALTURA_TACTIL_MINIMA = 44;
