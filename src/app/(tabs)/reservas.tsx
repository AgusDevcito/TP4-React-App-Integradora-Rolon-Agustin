import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EstadoVacio } from '../../components/EstadoVacio';
import { TarjetaEspera } from '../../components/TarjetaEspera';
import { TarjetaPrestamo } from '../../components/TarjetaPrestamo';
import {
  ALTURA_TACTIL_MINIMA,
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../../constants/tema';
import { useBiblioteca } from '../../context/BibliotecaContext';
import { usePermiso } from '../../hooks/usePermiso';
import { useTema } from '../../hooks/useTema';
import { obtenerCatalogoBase } from '../../lib/validacion';
import type { Prestamo } from '../../types';

export default function PantallaMisReservas() {
  const {
    prestamos,
    avisos,
    obtenerPosicionUsuario,
    activarRecordatorio,
    desactivarRecordatorio,
    devolverLibro,
    descartarAviso,
  } = useBiblioteca();
  const { estado: estadoNotificaciones, recargar } =
    usePermiso('notificaciones');
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const isbnPendienteRef = useRef<string | null>(null);
  const [mensajeLocal, setMensajeLocal] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  useEffect(() => {
    const isbnPendiente = isbnPendienteRef.current;
    if (isbnPendiente && estadoNotificaciones === 'concedido') {
      isbnPendienteRef.current = null;
      setMensajeLocal(null);
      void activarRecordatorio(isbnPendiente);
    }
  }, [estadoNotificaciones, activarRecordatorio]);

  const reservasEnEspera = useMemo(() => {
    return obtenerCatalogoBase()
      .map((libro) => ({
        libro,
        posicion: obtenerPosicionUsuario(libro.isbn),
      }))
      .filter((item) => item.posicion !== -1);
  }, [obtenerPosicionUsuario]);

  const manejarRecordatorio = useCallback(
    async (prestamo: Prestamo, activar: boolean) => {
      setMensajeLocal(null);
      if (!activar) {
        await desactivarRecordatorio(prestamo.isbn);
        return;
      }

      if (estadoNotificaciones === 'concedido') {
        await activarRecordatorio(prestamo.isbn);
        return;
      }

      isbnPendienteRef.current = prestamo.isbn;
      if (estadoNotificaciones === 'bloqueado') {
        setMensajeLocal(
          'Las notificaciones están desactivadas en el dispositivo. Podés habilitarlas en Ajustes o consultar tus avisos aquí mismo.',
        );
      }
      router.push({
        pathname: '/permisos/[recurso]',
        params: { recurso: 'notificaciones' },
      });
    },
    [activarRecordatorio, desactivarRecordatorio, estadoNotificaciones],
  );

  const textoEstadoPermiso =
    estadoNotificaciones === 'concedido'
      ? 'Notificaciones permitidas'
      : estadoNotificaciones === 'bloqueado'
        ? 'Notificaciones bloqueadas (los avisos se muestran aquí)'
        : estadoNotificaciones === 'cargando'
          ? 'Consultando estado de notificaciones…'
          : 'Notificaciones aún no activadas';

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
    >
      <View style={estilos.barraEstadoPermiso}>
        <Ionicons
          name={
            estadoNotificaciones === 'concedido'
              ? 'notifications-outline'
              : 'notifications-off-outline'
          }
          size={18}
          color={
            estadoNotificaciones === 'concedido'
              ? colores.exito
              : colores.textoSecundario
          }
        />
        <Text style={estilos.textoEstadoPermiso}>{textoEstadoPermiso}</Text>
      </View>

      {mensajeLocal ? (
        <View style={estilos.cajaMensajeLocal}>
          <Text style={estilos.textoMensajeLocal}>{mensajeLocal}</Text>
        </View>
      ) : null}

      {avisos.length > 0 ? (
        <View style={estilos.seccion}>
          <Text style={estilos.tituloSeccion}>Avisos de la biblioteca</Text>
          {avisos.map((aviso) => (
            <View key={aviso.id} style={estilos.tarjetaAviso}>
              <View style={estilos.encabezadoAviso}>
                <Text style={estilos.tituloAviso}>{aviso.titulo}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Descartar aviso ${aviso.titulo}`}
                  onPress={() => descartarAviso(aviso.id)}
                  style={estilos.botonCerrarAviso}
                >
                  <Ionicons
                    name="close"
                    size={18}
                    color={colores.textoSecundario}
                  />
                </Pressable>
              </View>
              <Text style={estilos.cuerpoAviso}>{aviso.mensaje}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={estilos.seccion}>
        <Text style={estilos.tituloSeccion}>Mis préstamos</Text>
        {prestamos.length === 0 ? (
          <EstadoVacio
            icono="book-outline"
            titulo="No tenés préstamos activos"
            descripcion="Cuando reserves un libro con ejemplares disponibles aparecerá aquí."
          />
        ) : (
          prestamos.map((prestamo) => (
            <TarjetaPrestamo
              key={prestamo.isbn}
              prestamo={prestamo}
              onAlternarRecordatorio={(item, activar) => {
                void manejarRecordatorio(item, activar);
              }}
              onDevolver={(isbn) => {
                void devolverLibro(isbn);
              }}
            />
          ))
        )}
      </View>

      <View style={estilos.seccion}>
        <Text style={estilos.tituloSeccion}>Reservas en lista de espera</Text>
        {reservasEnEspera.length === 0 ? (
          <EstadoVacio
            icono="time-outline"
            titulo="Sin reservas en espera"
            descripcion="Si reservás un libro sin ejemplares disponibles, verás tu lugar en la cola."
          />
        ) : (
          reservasEnEspera.map(({ libro, posicion }) => (
            <TarjetaEspera
              key={libro.isbn}
              titulo={libro.titulo}
              autor={libro.autor}
              posicion={posicion}
            />
          ))
        )}
      </View>
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
      paddingBottom: ESPACIADO.xxl,
    },
    barraEstadoPermiso: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.sm,
      backgroundColor: colores.superficie,
      paddingHorizontal: ESPACIADO.md,
      paddingVertical: ESPACIADO.sm,
      borderRadius: RADIOS.md,
      borderWidth: 1,
      borderColor: colores.borde,
    },
    textoEstadoPermiso: {
      flex: 1,
      fontSize: TAMANIO_TEXTO.xs,
      color: colores.textoSecundario,
      fontWeight: '600',
    },
    cajaMensajeLocal: {
      backgroundColor: colores.advertenciaFondo,
      padding: ESPACIADO.md,
      borderRadius: RADIOS.md,
    },
    textoMensajeLocal: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.advertencia,
    },
    seccion: {
      gap: ESPACIADO.md,
    },
    tituloSeccion: {
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '700',
      color: colores.textoSecundario,
      textTransform: 'uppercase',
    },
    tarjetaAviso: {
      backgroundColor: colores.exitoFondo,
      borderRadius: RADIOS.md,
      padding: ESPACIADO.md,
      borderWidth: 1,
      borderColor: colores.exito,
      gap: ESPACIADO.xs,
    },
    encabezadoAviso: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    tituloAviso: {
      flex: 1,
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '700',
      color: colores.exito,
    },
    botonCerrarAviso: {
      minWidth: ALTURA_TACTIL_MINIMA,
      minHeight: ALTURA_TACTIL_MINIMA,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cuerpoAviso: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.texto,
    },
  });
}
