import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { BotonAccion } from '../components/BotonAccion';
import { EstadoVacio } from '../components/EstadoVacio';
import {
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useBiblioteca } from '../context/BibliotecaContext';
import { useTema } from '../hooks/useTema';
import { obtenerCatalogoBase } from '../lib/validacion';
import type { Libro } from '../types';

type ItemMostrador = {
  libro: Libro;
  frente: string | undefined;
  cantidad: number;
};

export default function PantallaMostrador() {
  const {
    obtenerFrenteEspera,
    obtenerCantidadEnEspera,
    entregarAlSiguiente,
    cerrarSesion,
  } = useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);
  const [mensajeEntrega, setMensajeEntrega] = useState<string | null>(null);

  const librosConEspera = useMemo<ItemMostrador[]>(() => {
    return obtenerCatalogoBase()
      .map((libro) => ({
        libro,
        frente: obtenerFrenteEspera(libro.isbn),
        cantidad: obtenerCantidadEnEspera(libro.isbn),
      }))
      .filter((item) => item.cantidad > 0);
  }, [obtenerCantidadEnEspera, obtenerFrenteEspera]);

  const manejarEntrega = useCallback(
    async (isbn: string, titulo: string) => {
      const resultado = await entregarAlSiguiente(isbn);
      if (!resultado.entregadoA) {
        setMensajeEntrega(`No hay personas esperando por "${titulo}".`);
        return;
      }

      if (resultado.esUsuarioActual) {
        setMensajeEntrega(
          resultado.notificadoPorSistema
            ? `Entregaste "${titulo}" a ${resultado.entregadoA}. Se envió una notificación.`
            : `Entregaste "${titulo}" a ${resultado.entregadoA}. Se dejó un aviso en Mis reservas.`,
        );
        return;
      }

      setMensajeEntrega(
        `Se entregó "${titulo}" a ${resultado.entregadoA}.`,
      );
    },
    [entregarAlSiguiente],
  );

  const renderizarItem = useCallback(
    ({ item }: { item: ItemMostrador }) => (
      <View style={estilos.tarjeta}>
        <Text style={estilos.tituloLibro}>{item.libro.titulo}</Text>
        <Text style={estilos.autorLibro}>{item.libro.autor}</Text>

        <View style={estilos.filaResumen}>
          <Text style={estilos.etiquetaDato}>Al frente de la cola:</Text>
          <Text style={estilos.valorDato}>{item.frente ?? 'Nadie'}</Text>
        </View>

        <View style={estilos.filaResumen}>
          <Text style={estilos.etiquetaDato}>Personas esperando:</Text>
          <Text style={estilos.valorDato}>{item.cantidad}</Text>
        </View>

        <BotonAccion
          etiqueta="Entregar al siguiente"
          icono="checkmark-done-outline"
          deshabilitado={item.cantidad === 0}
          onPress={() => {
            void manejarEntrega(item.libro.isbn, item.libro.titulo);
          }}
        />
      </View>
    ),
    [estilos, manejarEntrega],
  );

  return (
    <View style={estilos.contenedor}>
      {mensajeEntrega ? (
        <View style={estilos.banner}>
          <Text style={estilos.textoBanner}>{mensajeEntrega}</Text>
        </View>
      ) : null}

      <FlatList
        data={librosConEspera}
        keyExtractor={(item) => item.libro.isbn}
        renderItem={renderizarItem}
        contentContainerStyle={estilos.lista}
        ListEmptyComponent={
          <EstadoVacio
            icono="checkmark-circle-outline"
            titulo="No hay listas de espera pendientes"
            descripcion="Todas las reservas en espera fueron atendidas."
          />
        }
      />

      <View style={estilos.pie}>
        <BotonAccion
          etiqueta="Cerrar sesión"
          variante="peligro"
          icono="log-out-outline"
          onPress={cerrarSesion}
        />
      </View>
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    banner: {
      backgroundColor: colores.exitoFondo,
      marginHorizontal: ESPACIADO.lg,
      marginTop: ESPACIADO.md,
      padding: ESPACIADO.md,
      borderRadius: RADIOS.md,
      borderWidth: 1,
      borderColor: colores.exito,
    },
    textoBanner: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.exito,
      fontWeight: '600',
    },
    lista: {
      padding: ESPACIADO.lg,
      gap: ESPACIADO.md,
    },
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: RADIOS.md,
      padding: ESPACIADO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      gap: ESPACIADO.sm,
    },
    tituloLibro: {
      fontSize: TAMANIO_TEXTO.md,
      fontWeight: '700',
      color: colores.texto,
    },
    autorLibro: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
    },
    filaResumen: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    etiquetaDato: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
    },
    valorDato: {
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '700',
      color: colores.texto,
    },
    pie: {
      padding: ESPACIADO.lg,
      borderTopWidth: 1,
      borderTopColor: colores.borde,
      backgroundColor: colores.superficie,
    },
  });
}
