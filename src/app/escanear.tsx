import { Ionicons } from '@expo/vector-icons';
import { CameraView, type BarcodeScanningResult } from 'expo-camera';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { BotonAccion } from '../components/BotonAccion';
import { EstadoCarga } from '../components/EstadoCarga';
import { IngresoManualIsbn } from '../components/IngresoManualIsbn';
import {
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { usePermiso } from '../hooks/usePermiso';
import { useTema } from '../hooks/useTema';
import {
  buscarLibroPorIsbn,
  esIsbnValido,
  limpiarIsbn,
} from '../lib/validacion';

export default function PantallaEscanear() {
  const { estado, recargar } = usePermiso('camara');
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const navegandoRef = useRef<boolean>(false);
  const ultimoIsbnNoEncontradoRef = useRef<string | null>(null);
  const modalMostradoRef = useRef<boolean>(false);

  const [avisoNoEncontrado, setAvisoNoEncontrado] = useState<string | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      void recargar();
    }, [recargar]),
  );

  useEffect(() => {
    if (
      !modalMostradoRef.current &&
      (estado === 'preguntable' || estado === 'bloqueado')
    ) {
      modalMostradoRef.current = true;
      router.push({
        pathname: '/permisos/[recurso]',
        params: { recurso: 'camara' },
      });
    }
  }, [estado]);

  const abrirLibroPorIsbn = useCallback((isbn: string) => {
    const limpio = limpiarIsbn(isbn);
    if (!esIsbnValido(limpio)) {
      setAvisoNoEncontrado(
        `El código "${limpio}" no corresponde a un ISBN-13 válido.`,
      );
      return;
    }

    const libro = buscarLibroPorIsbn(limpio);
    if (!libro) {
      if (ultimoIsbnNoEncontradoRef.current !== limpio) {
        ultimoIsbnNoEncontradoRef.current = limpio;
        setAvisoNoEncontrado(
          `El ISBN ${limpio} no está en el catálogo de Biblioteca IPF. Podés escanear otro libro o escribir el ISBN a mano.`,
        );
      }
      return;
    }

    navegandoRef.current = true;
    router.replace({ pathname: '/libro/[isbn]', params: { isbn: libro.isbn } });
  }, []);

  const manejarCodigoEscaneado = useCallback(
    (resultado: BarcodeScanningResult) => {
      if (navegandoRef.current) {
        return;
      }
      abrirLibroPorIsbn(resultado.data);
    },
    [abrirLibroPorIsbn],
  );

  const abrirModalPermiso = useCallback(() => {
    router.push({
      pathname: '/permisos/[recurso]',
      params: { recurso: 'camara' },
    });
  }, []);

  if (estado === 'cargando') {
    return <EstadoCarga mensaje="Verificando acceso a la cámara…" />;
  }

  return (
    <ScrollView
      style={estilos.contenedor}
      contentContainerStyle={estilos.contenido}
    >
      {estado === 'concedido' ? (
        <View style={estilos.contenedorCamara}>
          <CameraView
            style={estilos.camara}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['ean13'] }}
            onBarcodeScanned={manejarCodigoEscaneado}
          />
          <View style={estilos.indicadorMarco}>
            <Text style={estilos.textoGuia}>
              Apuntá al código de barras EAN-13 de la contratapa
            </Text>
          </View>
        </View>
      ) : estado === 'preguntable' ? (
        <View style={estilos.tarjetaPermiso}>
          <Ionicons name="camera-outline" size={40} color={colores.primario} />
          <Text style={estilos.tituloPermiso}>Necesitamos permiso de cámara</Text>
          <Text style={estilos.textoPermiso}>
            Para leer el código de barras de los libros podés otorgar el permiso
            de cámara o escribir el ISBN manualmente abajo.
          </Text>
          <BotonAccion
            etiqueta="Permitir cámara"
            icono="camera-outline"
            onPress={abrirModalPermiso}
          />
        </View>
      ) : (
        <View style={estilos.tarjetaPermiso}>
          <Ionicons
            name="lock-closed-outline"
            size={40}
            color={colores.advertencia}
          />
          <Text style={estilos.tituloPermiso}>Cámara bloqueada</Text>
          <Text style={estilos.textoPermiso}>
            El acceso a la cámara está deshabilitado en los ajustes del sistema.
            Podés habilitarlo o buscar el libro escribiendo el ISBN a mano.
          </Text>
          <BotonAccion
            etiqueta="Abrir Ajustes"
            icono="settings-outline"
            onPress={abrirModalPermiso}
          />
        </View>
      )}

      {avisoNoEncontrado ? (
        <View style={estilos.cajaAviso}>
          <Ionicons
            name="alert-circle-outline"
            size={20}
            color={colores.advertencia}
          />
          <Text style={estilos.textoAviso}>{avisoNoEncontrado}</Text>
        </View>
      ) : null}

      <IngresoManualIsbn onConfirmarIsbn={abrirLibroPorIsbn} />
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
    contenedorCamara: {
      height: 280,
      borderRadius: RADIOS.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colores.borde,
      backgroundColor: colores.superficieSecundaria,
    },
    camara: {
      flex: 1,
    },
    indicadorMarco: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colores.superposicionOscura,
      padding: ESPACIADO.sm,
      alignItems: 'center',
    },
    textoGuia: {
      fontSize: TAMANIO_TEXTO.xs,
      fontWeight: '600',
      color: colores.textoSobreOscuro,
      textAlign: 'center',
    },
    tarjetaPermiso: {
      backgroundColor: colores.superficie,
      borderRadius: RADIOS.md,
      padding: ESPACIADO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      alignItems: 'center',
      gap: ESPACIADO.sm,
    },
    tituloPermiso: {
      fontSize: TAMANIO_TEXTO.lg,
      fontWeight: '700',
      color: colores.texto,
      textAlign: 'center',
    },
    textoPermiso: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
      textAlign: 'center',
      marginBottom: ESPACIADO.xs,
    },
    cajaAviso: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ESPACIADO.sm,
      backgroundColor: colores.advertenciaFondo,
      padding: ESPACIADO.md,
      borderRadius: RADIOS.md,
    },
    textoAviso: {
      flex: 1,
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.advertencia,
    },
  });
}
