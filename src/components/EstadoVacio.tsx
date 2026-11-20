import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ESPACIADO,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';

type PropsEstadoVacio = {
  titulo: string;
  descripcion?: string;
  icono?: keyof typeof Ionicons.glyphMap;
};

export function EstadoVacio({
  titulo,
  descripcion,
  icono = 'book-outline',
}: PropsEstadoVacio) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.contenedor}>
      <Ionicons name={icono} size={44} color={colores.textoSecundario} />
      <Text style={estilos.titulo}>{titulo}</Text>
      {descripcion ? (
        <Text style={estilos.descripcion}>{descripcion}</Text>
      ) : null}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: ESPACIADO.xl,
      gap: ESPACIADO.sm,
    },
    titulo: {
      fontSize: TAMANIO_TEXTO.md,
      fontWeight: '600',
      color: colores.texto,
      textAlign: 'center',
    },
    descripcion: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
      textAlign: 'center',
    },
  });
}
