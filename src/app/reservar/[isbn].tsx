import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BotonAccion } from '../../components/BotonAccion';
import { DIAS_PRESTAMO } from '../../constants/credenciales';
import {
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../../constants/tema';
import { useBiblioteca } from '../../context/BibliotecaContext';
import { useTema } from '../../hooks/useTema';
import {
  buscarLibroPorIsbn,
  esIsbnValido,
  formatearFechaCorta,
  sumarDias,
} from '../../lib/validacion';

export default function PantallaConfirmarReserva() {
  const { isbn } = useLocalSearchParams<{ isbn?: string }>();
  const isbnNormalizado = typeof isbn === 'string' ? isbn.trim() : '';
  const libro = esIsbnValido(isbnNormalizado)
    ? buscarLibroPorIsbn(isbnNormalizado)
    : undefined;

  const {
    obtenerEjemplaresDisponibles,
    obtenerCantidadEnEspera,
    tieneLibroReservadoOPrestado,
    reservarLibro,
  } = useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  if (!libro) {
    return (
      <View style={estilos.contenedor}>
        <Ionicons name="alert-circle-outline" size={48} color={colores.error} />
        <Text style={estilos.titulo}>Libro no encontrado</Text>
        <Text style={estilos.descripcion}>
          No pudimos encontrar el libro seleccionado para realizar la reserva.
        </Text>
        <BotonAccion etiqueta="Cerrar" onPress={() => router.back()} />
      </View>
    );
  }

  const disponibles = obtenerEjemplaresDisponibles(libro);
  const cantidadEnEspera = obtenerCantidadEnEspera(libro.isbn);
  const yaReservado = tieneLibroReservadoOPrestado(libro.isbn);
  const fechaDevolucionEstimada = formatearFechaCorta(
    sumarDias(new Date(), DIAS_PRESTAMO).toISOString(),
  );

  function manejarConfirmacion() {
    if (!libro) {
      return;
    }
    const resultado = reservarLibro(libro.isbn);
    if (resultado.tipo === 'duplicado' || resultado.tipo === 'no_encontrado') {
      setMensajeError(resultado.mensaje);
      return;
    }
    router.dismissTo('/reservas');
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.tarjeta}>
        <Text style={estilos.etiqueta}>Libro seleccionado</Text>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>{libro.autor}</Text>

        <View style={estilos.divisor} />

        {yaReservado ? (
          <View style={estilos.cajaAdvertencia}>
            <Text style={estilos.textoAdvertencia}>
              Ya tenés este libro en préstamo o anotado en la lista de espera. No
              podés reservarlo dos veces.
            </Text>
          </View>
        ) : disponibles > 0 ? (
          <View style={estilos.bloqueDetalle}>
            <Text style={estilos.tipoOperacion}>Préstamo inmediato</Text>
            <Text style={estilos.descripcion}>
              Hay {disponibles} ejemplar{disponibles === 1 ? '' : 'es'}{' '}
              disponible{disponibles === 1 ? '' : 's'}. Al confirmar se
              registrará un préstamo por {DIAS_PRESTAMO} días (devolución hasta
              el {fechaDevolucionEstimada}).
            </Text>
          </View>
        ) : (
          <View style={estilos.bloqueDetalle}>
            <Text style={estilos.tipoOperacion}>Ingreso a lista de espera</Text>
            <Text style={estilos.descripcion}>
              No hay ejemplares en estante en este momento. Ingresarás en el
              puesto #{cantidadEnEspera + 1} de la lista de espera.
            </Text>
          </View>
        )}

        {mensajeError ? (
          <Text style={estilos.textoError}>{mensajeError}</Text>
        ) : null}
      </View>

      <View style={estilos.acciones}>
        {!yaReservado ? (
          <BotonAccion
            etiqueta="Confirmar"
            icono="checkmark-outline"
            onPress={manejarConfirmacion}
          />
        ) : null}
        <BotonAccion
          etiqueta="Cancelar"
          variante="secundario"
          onPress={() => router.back()}
        />
      </View>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      padding: ESPACIADO.lg,
      backgroundColor: colores.fondo,
      justifyContent: 'space-between',
    },
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: RADIOS.md,
      padding: ESPACIADO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      gap: ESPACIADO.sm,
    },
    etiqueta: {
      fontSize: TAMANIO_TEXTO.xs,
      fontWeight: '700',
      color: colores.primario,
      textTransform: 'uppercase',
    },
    titulo: {
      fontSize: TAMANIO_TEXTO.xl,
      fontWeight: '700',
      color: colores.texto,
    },
    autor: {
      fontSize: TAMANIO_TEXTO.md,
      color: colores.textoSecundario,
    },
    divisor: {
      height: 1,
      backgroundColor: colores.borde,
      marginVertical: ESPACIADO.sm,
    },
    bloqueDetalle: {
      gap: ESPACIADO.xs,
    },
    tipoOperacion: {
      fontSize: TAMANIO_TEXTO.md,
      fontWeight: '700',
      color: colores.texto,
    },
    descripcion: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
      lineHeight: 21,
    },
    cajaAdvertencia: {
      backgroundColor: colores.advertenciaFondo,
      padding: ESPACIADO.md,
      borderRadius: RADIOS.sm,
    },
    textoAdvertencia: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.advertencia,
    },
    textoError: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.error,
    },
    acciones: {
      gap: ESPACIADO.sm,
      paddingBottom: ESPACIADO.md,
    },
  });
}
