import { router, Stack } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { BotonAccion } from '../../../components/BotonAccion';
import { EnlacePersonalHeader } from '../../../components/EnlacePersonalHeader';
import { EstadoCarga } from '../../../components/EstadoCarga';
import { EstadoError } from '../../../components/EstadoError';
import { EstadoVacio } from '../../../components/EstadoVacio';
import { SeccionRecientes } from '../../../components/SeccionRecientes';
import { TarjetaLibro } from '../../../components/TarjetaLibro';
import {
  ESPACIADO,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../../../constants/tema';
import { useBiblioteca } from '../../../context/BibliotecaContext';
import { useLibros } from '../../../hooks/useLibros';
import { useTema } from '../../../hooks/useTema';
import type { Libro } from '../../../types';

export default function PantallaCatalogo() {
  const { libros, cargando, error, reintentar } = useLibros();
  const {
    recientes,
    obtenerEjemplaresDisponibles,
    obtenerCantidadEnEspera,
  } = useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const abrirDetalle = useCallback((isbn: string) => {
    router.push({ pathname: '/libro/[isbn]', params: { isbn } });
  }, []);

  const renderizarLibro = useCallback(
    ({ item }: { item: Libro }) => (
      <TarjetaLibro
        libro={item}
        ejemplaresDisponibles={obtenerEjemplaresDisponibles(item)}
        cantidadEnEspera={obtenerCantidadEnEspera(item.isbn)}
        onPress={abrirDetalle}
      />
    ),
    [abrirDetalle, obtenerCantidadEnEspera, obtenerEjemplaresDisponibles],
  );

  const encabezadoLista = useMemo(
    () => (
      <View style={estilos.encabezado}>
        <View style={estilos.filaAccesos}>
          <View style={estilos.celdaAcceso}>
            <BotonAccion
              etiqueta="Buscar"
              icono="search-outline"
              variante="secundario"
              onPress={() => router.push('/buscar')}
            />
          </View>
          <View style={estilos.celdaAcceso}>
            <BotonAccion
              etiqueta="Escanear"
              icono="barcode-outline"
              onPress={() => router.push('/escanear')}
            />
          </View>
        </View>

        <SeccionRecientes recientes={recientes} onAbrirLibro={abrirDetalle} />

        <Text style={estilos.tituloLista}>Catálogo completo</Text>
      </View>
    ),
    [abrirDetalle, estilos, recientes],
  );

  return (
    <View style={estilos.contenedor}>
      <Stack.Screen
        options={{
          title: 'Biblioteca IPF',
          headerRight: () => <EnlacePersonalHeader />,
        }}
      />

      {cargando ? (
        <EstadoCarga mensaje="Cargando catálogo de Biblioteca IPF…" />
      ) : error ? (
        <EstadoError mensaje={error} onAccion={reintentar} />
      ) : (
        <FlatList
          data={libros}
          keyExtractor={(item) => item.isbn}
          renderItem={renderizarLibro}
          ListHeaderComponent={encabezadoLista}
          ListEmptyComponent={
            <EstadoVacio
              titulo="El catálogo está vacío"
              descripcion="Por el momento no hay libros cargados en la biblioteca."
            />
          }
          contentContainerStyle={estilos.contenidoLista}
        />
      )}
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    contenidoLista: {
      paddingBottom: ESPACIADO.xxl,
    },
    encabezado: {
      paddingTop: ESPACIADO.md,
    },
    filaAccesos: {
      flexDirection: 'row',
      paddingHorizontal: ESPACIADO.lg,
      gap: ESPACIADO.md,
      marginBottom: ESPACIADO.lg,
    },
    celdaAcceso: {
      flex: 1,
    },
    tituloLista: {
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '700',
      color: colores.textoSecundario,
      marginHorizontal: ESPACIADO.lg,
      marginBottom: ESPACIADO.sm,
      textTransform: 'uppercase',
    },
  });
}
