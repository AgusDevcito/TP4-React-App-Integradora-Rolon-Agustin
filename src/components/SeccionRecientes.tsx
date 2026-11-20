import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  ALTURA_TACTIL_MINIMA,
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';
import type { Libro } from '../types';

type PropsSeccionRecientes = {
  recientes: Libro[];
  onAbrirLibro: (isbn: string) => void;
};

export function SeccionRecientes({
  recientes,
  onAbrirLibro,
}: PropsSeccionRecientes) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  if (recientes.length === 0) {
    return null;
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.tituloSeccion}>Vistos recientemente</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={estilos.listaHorizontal}
      >
        {recientes.map((libro) => (
          <Pressable
            key={libro.isbn}
            accessibilityRole="button"
            accessibilityLabel={`Abrir libro visto recientemente: ${libro.titulo}`}
            onPress={() => onAbrirLibro(libro.isbn)}
            style={({ pressed }) => [estilos.chip, pressed && estilos.presionado]}
          >
            <Text style={estilos.tituloLibro} numberOfLines={1}>
              {libro.titulo}
            </Text>
            <Text style={estilos.autorLibro} numberOfLines={1}>
              {libro.autor}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      marginBottom: ESPACIADO.md,
    },
    tituloSeccion: {
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '700',
      color: colores.textoSecundario,
      marginHorizontal: ESPACIADO.lg,
      marginBottom: ESPACIADO.sm,
      textTransform: 'uppercase',
    },
    listaHorizontal: {
      paddingHorizontal: ESPACIADO.lg,
      gap: ESPACIADO.sm,
    },
    chip: {
      minHeight: ALTURA_TACTIL_MINIMA,
      width: 190,
      backgroundColor: colores.primarioSuave,
      borderRadius: RADIOS.md,
      padding: ESPACIADO.md,
      borderWidth: 1,
      borderColor: colores.borde,
      justifyContent: 'center',
    },
    presionado: {
      opacity: 0.78,
    },
    tituloLibro: {
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '700',
      color: colores.texto,
    },
    autorLibro: {
      fontSize: TAMANIO_TEXTO.xs,
      color: colores.textoSecundario,
      marginTop: ESPACIADO.xs,
    },
  });
}
