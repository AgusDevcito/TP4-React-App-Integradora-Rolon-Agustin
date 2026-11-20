import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ESPACIADO,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';
import { BotonAccion } from './BotonAccion';

type PropsEstadoError = {
  mensaje: string;
  etiquetaAccion?: string;
  onAccion: () => void;
};

export function EstadoError({
  mensaje,
  etiquetaAccion = 'Reintentar',
  onAccion,
}: PropsEstadoError) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.contenedor}>
      <Ionicons name="alert-circle-outline" size={48} color={colores.error} />
      <Text style={estilos.titulo}>Ocurrió un problema</Text>
      <Text style={estilos.mensaje}>{mensaje}</Text>
      <BotonAccion
        etiqueta={etiquetaAccion}
        onPress={onAccion}
        icono="refresh-outline"
      />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ESPACIADO.xl,
      gap: ESPACIADO.md,
      backgroundColor: colores.fondo,
    },
    titulo: {
      fontSize: TAMANIO_TEXTO.lg,
      fontWeight: '700',
      color: colores.texto,
      textAlign: 'center',
    },
    mensaje: {
      fontSize: TAMANIO_TEXTO.md,
      color: colores.textoSecundario,
      textAlign: 'center',
      marginBottom: ESPACIADO.sm,
    },
  });
}
