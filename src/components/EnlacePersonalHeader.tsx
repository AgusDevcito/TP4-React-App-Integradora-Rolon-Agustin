import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  ALTURA_TACTIL_MINIMA,
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useBiblioteca } from '../context/BibliotecaContext';
import { useTema } from '../hooks/useTema';

export function EnlacePersonalHeader() {
  const { sesionActiva } = useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <Link href={sesionActiva ? '/mostrador' : '/login'} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          sesionActiva
            ? 'Abrir mostrador del personal'
            : 'Ingresar como personal de biblioteca'
        }
        style={({ pressed }) => [estilos.boton, pressed && estilos.presionado]}
      >
        <Ionicons
          name={sesionActiva ? 'shield-checkmark-outline' : 'person-outline'}
          size={18}
          color={colores.primario}
        />
        <Text style={estilos.texto}>Personal</Text>
      </Pressable>
    </Link>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    boton: {
      minHeight: ALTURA_TACTIL_MINIMA,
      minWidth: ALTURA_TACTIL_MINIMA,
      paddingHorizontal: ESPACIADO.sm,
      borderRadius: RADIOS.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: ESPACIADO.xs,
    },
    presionado: {
      opacity: 0.7,
    },
    texto: {
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '600',
      color: colores.primario,
    },
  });
}
