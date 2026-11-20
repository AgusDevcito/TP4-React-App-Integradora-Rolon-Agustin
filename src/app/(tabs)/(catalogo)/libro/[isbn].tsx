import { Ionicons } from '@expo/vector-icons';
import { Link, router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BotonAccion } from '../../../../components/BotonAccion';
import {
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../../../../constants/tema';
import { useBiblioteca } from '../../../../context/BibliotecaContext';
import { useTema } from '../../../../hooks/useTema';
import { buscarLibroPorIsbn, esIsbnValido } from '../../../../lib/validacion';

export default function PantallaDetalleLibro() {
  const { isbn } = useLocalSearchParams<{ isbn?: string }>();
  const isbnNormalizado = typeof isbn === 'string' ? isbn.trim() : '';
  const isbnValido = esIsbnValido(isbnNormalizado);
  const libro = isbnValido ? buscarLibroPorIsbn(isbnNormalizado) : undefined;

  const {
    registrarVisto,
    obtenerEjemplaresDisponibles,
    obtenerCantidadEnEspera,
    obtenerPosicionUsuario,
    tieneLibroReservadoOPrestado,
  } = useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  useEffect(() => {
    if (libro) {
      registrarVisto(libro);
    }
  }, [libro, registrarVisto]);

  if (!isbnValido || !libro) {
    return (
      <View style={estilos.contenedorError}>
        <Stack.Screen options={{ title: 'Libro no encontrado' }} />
        <Ionicons name="book-outline" size={54} color={colores.error} />
        <Text style={estilos.tituloError}>No pudimos encontrar ese libro</Text>
        <Text style={estilos.mensajeError}>
          {!isbnValido
            ? `El código "${isbnNormalizado || 'vacío'}" no tiene un formato ISBN-13 válido de 13 dígitos.`
            : `No existe ningún ejemplar con el ISBN ${isbnNormalizado} en el catálogo de Biblioteca IPF.`}
        </Text>
        <Link href="/" asChild>
          <BotonAccion
            etiqueta="Volver al Catálogo"
            icono="arrow-back-outline"
            onPress={() => router.replace('/')}
          />
        </Link>
      </View>
    );
  }

  const ejemplaresDisponibles = obtenerEjemplaresDisponibles(libro);
  const cantidadEnEspera = obtenerCantidadEnEspera(libro.isbn);
  const posicionUsuario = obtenerPosicionUsuario(libro.isbn);
  const yaReservadoOPrestado = tieneLibroReservadoOPrestado(libro.isbn);

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
    >
      <Stack.Screen options={{ title: libro.titulo }} />

      <View style={estilos.tarjeta}>
        <Text style={estilos.titulo}>{libro.titulo}</Text>
        <Text style={estilos.autor}>{libro.autor}</Text>

        <View style={estilos.divisor} />

        <View style={estilos.filaDato}>
          <Text style={estilos.etiquetaDato}>Año de publicación</Text>
          <Text style={estilos.valorDato}>{libro.anio}</Text>
        </View>

        <View style={estilos.filaDato}>
          <Text style={estilos.etiquetaDato}>ISBN-13</Text>
          <Text style={estilos.valorDato}>{libro.isbn}</Text>
        </View>

        <View style={estilos.filaDato}>
          <Text style={estilos.etiquetaDato}>Ejemplares disponibles</Text>
          <Text
            style={[
              estilos.valorDato,
              ejemplaresDisponibles > 0
                ? estilos.textoExito
                : estilos.textoAdvertencia,
            ]}
          >
            {ejemplaresDisponibles}
          </Text>
        </View>

        <View style={estilos.filaDato}>
          <Text style={estilos.etiquetaDato}>Personas en lista de espera</Text>
          <Text style={estilos.valorDato}>{cantidadEnEspera}</Text>
        </View>
      </View>

      {yaReservadoOPrestado ? (
        <View style={estilos.cajaEstadoUsuario}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colores.primario}
          />
          <Text style={estilos.textoEstadoUsuario}>
            {posicionUsuario !== -1
              ? `Ya estás en la lista de espera en el puesto #${posicionUsuario}.`
              : 'Ya tenés este libro en préstamo activo. Podés verlo en Mis reservas.'}
          </Text>
        </View>
      ) : null}

      <BotonAccion
        etiqueta={
          yaReservadoOPrestado
            ? 'Ya reservado'
            : ejemplaresDisponibles > 0
              ? 'Reservar'
              : 'Anotarme en lista de espera'
        }
        icono="bookmark-outline"
        deshabilitado={yaReservadoOPrestado}
        onPress={() =>
          router.push({
            pathname: '/reservar/[isbn]',
            params: { isbn: libro.isbn },
          })
        }
      />
    </ScrollView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenido: {
      padding: ESPACIADO.lg,
      gap: ESPACIADO.lg,
    },
    contenedorError: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: ESPACIADO.xl,
      backgroundColor: colores.fondo,
      gap: ESPACIADO.md,
    },
    tituloError: {
      fontSize: TAMANIO_TEXTO.lg,
      fontWeight: '700',
      color: colores.texto,
      textAlign: 'center',
    },
    mensajeError: {
      fontSize: TAMANIO_TEXTO.md,
      color: colores.textoSecundario,
      textAlign: 'center',
      marginBottom: ESPACIADO.sm,
    },
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: RADIOS.md,
      padding: ESPACIADO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      gap: ESPACIADO.md,
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
      marginVertical: ESPACIADO.xs,
    },
    filaDato: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    etiquetaDato: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
    },
    valorDato: {
      fontSize: TAMANIO_TEXTO.md,
      fontWeight: '700',
      color: colores.texto,
    },
    textoExito: {
      color: colores.exito,
    },
    textoAdvertencia: {
      color: colores.advertencia,
    },
    cajaEstadoUsuario: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.sm,
      backgroundColor: colores.primarioSuave,
      padding: ESPACIADO.md,
      borderRadius: RADIOS.md,
    },
    textoEstadoUsuario: {
      flex: 1,
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.texto,
    },
  });
}
