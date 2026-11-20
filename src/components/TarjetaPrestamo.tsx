import { useMemo } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import {
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';
import { formatearFechaCorta } from '../lib/validacion';
import type { Prestamo } from '../types';
import { BotonAccion } from './BotonAccion';

type PropsTarjetaPrestamo = {
  prestamo: Prestamo;
  onAlternarRecordatorio: (prestamo: Prestamo, activar: boolean) => void;
  onDevolver: (isbn: string) => void;
};

export function TarjetaPrestamo({
  prestamo,
  onAlternarRecordatorio,
  onDevolver,
}: PropsTarjetaPrestamo) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.tarjeta}>
      <Text style={estilos.titulo}>{prestamo.titulo}</Text>
      <Text style={estilos.autor}>{prestamo.autor}</Text>
      <Text style={estilos.fecha}>
        Devolución hasta: {formatearFechaCorta(prestamo.fechaDevolucion)}
      </Text>

      <View style={estilos.filaRecordatorio}>
        <View style={estilos.bloqueTextoRecordatorio}>
          <Text style={estilos.etiquetaRecordatorio}>Recordarme</Text>
          <Text style={estilos.subtextoRecordatorio}>
            {prestamo.recordatorioActivo
              ? 'Aviso programado en 15 segundos (modo demo)'
              : 'Activá un aviso antes de devolverlo'}
          </Text>
        </View>
        <Switch
          accessibilityLabel={`Recordarme devolver ${prestamo.titulo}`}
          value={prestamo.recordatorioActivo}
          onValueChange={(valor) => onAlternarRecordatorio(prestamo, valor)}
          trackColor={{ false: colores.borde, true: colores.primario }}
          thumbColor={colores.superficie}
        />
      </View>

      <BotonAccion
        etiqueta="Devolver"
        variante="secundario"
        icono="return-down-back-outline"
        onPress={() => onDevolver(prestamo.isbn)}
      />
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
      gap: ESPACIADO.sm,
    },
    titulo: {
      fontSize: TAMANIO_TEXTO.md,
      fontWeight: '700',
      color: colores.texto,
    },
    autor: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
    },
    fecha: {
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '600',
      color: colores.primario,
    },
    filaRecordatorio: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: ESPACIADO.xs,
      gap: ESPACIADO.md,
    },
    bloqueTextoRecordatorio: {
      flex: 1,
    },
    etiquetaRecordatorio: {
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '600',
      color: colores.texto,
    },
    subtextoRecordatorio: {
      fontSize: TAMANIO_TEXTO.xs,
      color: colores.textoSecundario,
      marginTop: ESPACIADO.xs,
    },
  });
}
