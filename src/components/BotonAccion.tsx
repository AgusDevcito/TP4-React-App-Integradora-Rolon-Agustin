import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  ALTURA_TACTIL_MINIMA,
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';

type VarianteBoton = 'primario' | 'secundario' | 'peligro';

type PropsBotonAccion = {
  etiqueta: string;
  onPress: () => void;
  variante?: VarianteBoton;
  icono?: keyof typeof Ionicons.glyphMap;
  deshabilitado?: boolean;
  accessibilityLabel?: string;
};

export function BotonAccion({
  etiqueta,
  onPress,
  variante = 'primario',
  icono,
  deshabilitado = false,
  accessibilityLabel,
}: PropsBotonAccion) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const estiloContenedor =
    variante === 'secundario'
      ? estilos.secundario
      : variante === 'peligro'
        ? estilos.peligro
        : estilos.primario;

  const colorTexto =
    variante === 'secundario' ? colores.primario : colores.textoSobrePrimario;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? etiqueta}
      accessibilityState={{ disabled: deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.base,
        estiloContenedor,
        deshabilitado && estilos.deshabilitado,
        pressed && !deshabilitado && estilos.presionado,
      ]}
    >
      {icono ? (
        <Ionicons name={icono} size={18} color={colorTexto} />
      ) : null}
      <Text
        style={[
          estilos.texto,
          variante === 'secundario' ? estilos.textoSecundario : estilos.textoClaro,
        ]}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    base: {
      minHeight: ALTURA_TACTIL_MINIMA,
      minWidth: ALTURA_TACTIL_MINIMA,
      paddingHorizontal: ESPACIADO.lg,
      paddingVertical: ESPACIADO.sm,
      borderRadius: RADIOS.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.sm,
    },
    primario: {
      backgroundColor: colores.primario,
    },
    secundario: {
      backgroundColor: colores.primarioSuave,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    peligro: {
      backgroundColor: colores.error,
    },
    deshabilitado: {
      opacity: 0.45,
    },
    presionado: {
      opacity: 0.8,
    },
    texto: {
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '600',
    },
    textoClaro: {
      color: colores.textoSobrePrimario,
    },
    textoSecundario: {
      color: colores.primario,
    },
  });
}
