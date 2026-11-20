import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';

type PropsTarjetaEspera = {
  titulo: string;
  autor: string;
  posicion: number;
};

export function TarjetaEspera({ titulo, autor, posicion }: PropsTarjetaEspera) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.tarjeta}>
      <View style={estilos.encabezado}>
        <Text style={estilos.titulo} numberOfLines={2}>
          {titulo}
        </Text>
        <View style={estilos.insignia}>
          <Text style={estilos.textoInsignia}>Puesto #{posicion}</Text>
        </View>
      </View>
      <Text style={estilos.autor}>{autor}</Text>
      <Text style={estilos.nota}>
        Te avisaremos cuando se libere un ejemplar en mostrador.
      </Text>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: RADIOS.md,
      padding: ESPACIADO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      gap: ESPACIADO.xs,
    },
    encabezado: {
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
    insignia: {
      backgroundColor: colores.advertenciaFondo,
      paddingHorizontal: ESPACIADO.sm,
      paddingVertical: ESPACIADO.xs,
      borderRadius: RADIOS.sm,
    },
    textoInsignia: {
      fontSize: TAMANIO_TEXTO.xs,
      fontWeight: '700',
      color: colores.advertencia,
    },
    autor: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
    },
    nota: {
      fontSize: TAMANIO_TEXTO.xs,
      color: colores.textoSecundario,
      marginTop: ESPACIADO.xs,
    },
  });
}
