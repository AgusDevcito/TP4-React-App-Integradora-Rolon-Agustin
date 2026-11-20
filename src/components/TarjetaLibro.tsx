import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ALTURA_TACTIL_MINIMA,
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';
import type { Libro } from '../types';

type PropsTarjetaLibro = {
  libro: Libro;
  ejemplaresDisponibles: number;
  cantidadEnEspera: number;
  onPress: (isbn: string) => void;
};

export function TarjetaLibro({
  libro,
  ejemplaresDisponibles,
  cantidadEnEspera,
  onPress,
}: PropsTarjetaLibro) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);
  const hayDisponibles = ejemplaresDisponibles > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir detalle de ${libro.titulo}, de ${libro.autor}`}
      onPress={() => onPress(libro.isbn)}
      style={({ pressed }) => [estilos.tarjeta, pressed && estilos.presionada]}
    >
      <View style={estilos.cabecera}>
        <Text style={estilos.titulo} numberOfLines={2}>
          {libro.titulo}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colores.textoSecundario}
        />
      </View>

      <Text style={estilos.autor}>
        {libro.autor} · {libro.anio}
      </Text>

      <View style={estilos.filaEstado}>
        <View
          style={[
            estilos.insignia,
            hayDisponibles ? estilos.insigniaDisponible : estilos.insigniaEspera,
          ]}
        >
          <Text
            style={[
              estilos.textoInsignia,
              hayDisponibles
                ? estilos.textoDisponible
                : estilos.textoEspera,
            ]}
          >
            {hayDisponibles
              ? `${ejemplaresDisponibles} disponible${ejemplaresDisponibles === 1 ? '' : 's'}`
              : 'Sin ejemplares'}
          </Text>
        </View>

        {cantidadEnEspera > 0 ? (
          <Text style={estilos.textoCola}>
            {cantidadEnEspera} en espera
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: {
      minHeight: ALTURA_TACTIL_MINIMA,
      backgroundColor: colores.superficie,
      borderRadius: RADIOS.md,
      padding: ESPACIADO.lg,
      marginHorizontal: ESPACIADO.lg,
      marginBottom: ESPACIADO.md,
      borderWidth: 1,
      borderColor: colores.borde,
      gap: ESPACIADO.xs,
    },
    presionada: {
      opacity: 0.82,
    },
    cabecera: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: ESPACIADO.sm,
    },
    titulo: {
      flex: 1,
      fontSize: TAMANIO_TEXTO.md,
      fontWeight: '700',
      color: colores.texto,
    },
    autor: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
    },
    filaEstado: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: ESPACIADO.xs,
    },
    insignia: {
      paddingHorizontal: ESPACIADO.sm,
      paddingVertical: ESPACIADO.xs,
      borderRadius: RADIOS.sm,
    },
    insigniaDisponible: {
      backgroundColor: colores.exitoFondo,
    },
    insigniaEspera: {
      backgroundColor: colores.advertenciaFondo,
    },
    textoInsignia: {
      fontSize: TAMANIO_TEXTO.xs,
      fontWeight: '600',
    },
    textoDisponible: {
      color: colores.exito,
    },
    textoEspera: {
      color: colores.advertencia,
    },
    textoCola: {
      fontSize: TAMANIO_TEXTO.xs,
      color: colores.textoSecundario,
    },
  });
}
