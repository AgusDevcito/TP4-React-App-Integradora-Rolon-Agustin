import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BotonAccion } from '../../components/BotonAccion';
import { EstadoCarga } from '../../components/EstadoCarga';
import {
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../../constants/tema';
import { usePermiso } from '../../hooks/usePermiso';
import { useTema } from '../../hooks/useTema';
import type { RecursoPermiso } from '../../types';

type ConfiguracionRecurso = {
  titulo: string;
  beneficio: string;
  notaBloqueado: string;
  icono: keyof typeof Ionicons.glyphMap;
};

const CONFIG_RECURSOS: Record<RecursoPermiso, ConfiguracionRecurso> = {
  camara: {
    titulo: 'Permiso de cámara',
    beneficio:
      'Usamos tu cámara para escanear el código de barras de los libros y abrir su ficha al instante.',
    notaBloqueado:
      'El permiso de cámara fue bloqueado en este dispositivo. Podés habilitarlo desde Ajustes o escribir el ISBN a mano.',
    icono: 'camera-outline',
  },
  notificaciones: {
    titulo: 'Permiso de notificaciones',
    beneficio:
      'Usamos tus notificaciones para avisarte antes de devolver un libro o cuando se libera tu reserva.',
    notaBloqueado:
      'Las notificaciones están bloqueadas en este dispositivo. Podés habilitarlas en Ajustes o ver los avisos dentro de la app.',
    icono: 'notifications-outline',
  },
};

function esRecursoValido(valor: string): valor is RecursoPermiso {
  return valor === 'camara' || valor === 'notificaciones';
}

export default function PantallaPreviaPermiso() {
  const { recurso } = useLocalSearchParams<{ recurso?: string }>();
  const recursoTexto = typeof recurso === 'string' ? recurso : '';
  const valido = esRecursoValido(recursoTexto);
  const recursoSeguro: RecursoPermiso = valido ? recursoTexto : 'camara';

  const { estado, puedePreguntar, solicitar, abrirAjustes } =
    usePermiso(recursoSeguro);
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  useEffect(() => {
    if (valido && estado === 'concedido') {
      router.back();
    }
  }, [valido, estado]);

  if (!valido) {
    return (
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>Recurso de permiso no reconocido</Text>
        <Text style={estilos.beneficio}>
          El permiso solicitado no forma parte de Biblioteca IPF.
        </Text>
        <BotonAccion etiqueta="Volver" onPress={() => router.back()} />
      </View>
    );
  }

  if (estado === 'cargando') {
    return <EstadoCarga mensaje="Consultando estado del permiso…" />;
  }

  const config = CONFIG_RECURSOS[recursoSeguro];
  const estaBloqueado = estado === 'bloqueado' || !puedePreguntar;

  async function manejarAccionPrincipal() {
    if (estaBloqueado) {
      await abrirAjustes();
      return;
    }
    await solicitar();
    router.back();
  }

  return (
    <View style={estilos.contenedor}>
      <View style={estilos.circuloIcono}>
        <Ionicons name={config.icono} size={44} color={colores.primario} />
      </View>

      <Text style={estilos.titulo}>{config.titulo}</Text>
      <Text style={estilos.beneficio}>{config.beneficio}</Text>

      {estaBloqueado ? (
        <Text style={estilos.notaBloqueado}>{config.notaBloqueado}</Text>
      ) : null}

      <View style={estilos.contenedorBoton}>
        <BotonAccion
          etiqueta={estaBloqueado ? 'Abrir Ajustes' : 'Continuar'}
          icono={estaBloqueado ? 'settings-outline' : 'checkmark-circle-outline'}
          onPress={() => {
            void manejarAccionPrincipal();
          }}
        />
      </View>
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
    circuloIcono: {
      width: 84,
      height: 84,
      borderRadius: RADIOS.completo,
      backgroundColor: colores.primarioSuave,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: ESPACIADO.sm,
    },
    titulo: {
      fontSize: TAMANIO_TEXTO.xl,
      fontWeight: '700',
      color: colores.texto,
      textAlign: 'center',
    },
    beneficio: {
      fontSize: TAMANIO_TEXTO.md,
      color: colores.textoSecundario,
      textAlign: 'center',
      lineHeight: 24,
    },
    notaBloqueado: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.advertencia,
      backgroundColor: colores.advertenciaFondo,
      padding: ESPACIADO.md,
      borderRadius: RADIOS.md,
      textAlign: 'center',
    },
    contenedorBoton: {
      width: '100%',
      marginTop: ESPACIADO.md,
    },
  });
}
