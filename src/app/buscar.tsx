import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { EstadoCarga } from '../components/EstadoCarga';
import { EstadoError } from '../components/EstadoError';
import { EstadoVacio } from '../components/EstadoVacio';
import { TarjetaLibro } from '../components/TarjetaLibro';
import {
  ALTURA_TACTIL_MINIMA,
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useBiblioteca } from '../context/BibliotecaContext';
import { useTema } from '../hooks/useTema';
import { buscarLibros } from '../lib/api';
import type { Libro } from '../types';

const DEMORA_DEBOUNCE_MS = 300;

export default function PantallaBuscar() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const consulta = typeof q === 'string' ? q : '';

  const [resultados, setResultados] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState<number>(0);

  const { obtenerEjemplaresDisponibles, obtenerCantidadEnEspera } =
    useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    const temporizador = setTimeout(() => {
      async function ejecutarBusqueda() {
        try {
          const datos = await buscarLibros(consulta);
          if (!cancelado) {
            setResultados(datos);
            setCargando(false);
          }
        } catch {
          if (!cancelado) {
            setError('No pudimos completar la búsqueda. Intentá de nuevo.');
            setCargando(false);
          }
        }
      }

      void ejecutarBusqueda();
    }, DEMORA_DEBOUNCE_MS);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
  }, [consulta, intento]);

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

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.barraBusqueda}>
        <Ionicons
          name="search-outline"
          size={20}
          color={colores.textoSecundario}
        />
        <TextInput
          style={estilos.entrada}
          value={consulta}
          onChangeText={(texto) => router.setParams({ q: texto })}
          placeholder="Buscar por título o autor…"
          placeholderTextColor={colores.textoSecundario}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Buscar libros por título o autor"
        />
        {consulta.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            onPress={() => router.setParams({ q: '' })}
            style={estilos.botonLimpiar}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colores.textoSecundario}
            />
          </Pressable>
        ) : null}
      </View>

      {cargando ? (
        <EstadoCarga mensaje="Buscando en el catálogo…" />
      ) : error ? (
        <EstadoError
          mensaje={error}
          onAccion={() => setIntento((actual) => actual + 1)}
        />
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(item) => item.isbn}
          renderItem={renderizarLibro}
          contentContainerStyle={estilos.lista}
          ListEmptyComponent={
            <EstadoVacio
              icono="search-outline"
              titulo="Sin resultados"
              descripcion={
                consulta.trim().length > 0
                  ? `No encontramos libros que coincidan con "${consulta.trim()}".`
                  : 'Escribí un título o autor para buscar en el catálogo.'
              }
            />
          }
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
    barraBusqueda: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colores.superficie,
      margin: ESPACIADO.lg,
      paddingHorizontal: ESPACIADO.md,
      borderRadius: RADIOS.md,
      borderWidth: 1,
      borderColor: colores.borde,
      minHeight: ALTURA_TACTIL_MINIMA,
      gap: ESPACIADO.sm,
    },
    entrada: {
      flex: 1,
      minHeight: ALTURA_TACTIL_MINIMA,
      fontSize: TAMANIO_TEXTO.md,
      color: colores.texto,
    },
    botonLimpiar: {
      minWidth: ALTURA_TACTIL_MINIMA,
      minHeight: ALTURA_TACTIL_MINIMA,
      alignItems: 'center',
      justifyContent: 'center',
    },
    lista: {
      paddingBottom: ESPACIADO.xxl,
    },
  });
}
