import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BotonAccion } from '../components/BotonAccion';
import {
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';

export default function PantallaNoEncontrada() {
  const rutaInexistente = usePathname();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.contenedor}>
      <Ionicons name="compass-outline" size={56} color={colores.primario} />
      <Text style={estilos.codigo}>404</Text>
      <Text style={estilos.titulo}>No encontramos esta pantalla</Text>
      <Text style={estilos.descripcion}>
        La dirección solicitada no existe en Biblioteca IPF:
      </Text>
      <View style={estilos.cajaUrl}>
        <Text style={estilos.textoUrl}>{rutaInexistente}</Text>
      </View>
      <BotonAccion
        etiqueta="Volver al Catálogo"
        icono="home-outline"
        onPress={() => router.replace('/')}
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
      backgroundColor: colores.fondo,
      gap: ESPACIADO.md,
    },
    codigo: {
      fontSize: TAMANIO_TEXTO.xxl,
      fontWeight: '800',
      color: colores.primario,
    },
    titulo: {
      fontSize: TAMANIO_TEXTO.lg,
      fontWeight: '700',
      color: colores.texto,
      textAlign: 'center',
    },
    descripcion: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
      textAlign: 'center',
    },
    cajaUrl: {
      backgroundColor: colores.superficieSecundaria,
      paddingHorizontal: ESPACIADO.md,
      paddingVertical: ESPACIADO.sm,
      borderRadius: RADIOS.sm,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    textoUrl: {
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '600',
      color: colores.error,
    },
  });
}
