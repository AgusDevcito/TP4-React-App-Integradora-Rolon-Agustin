import { useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

import {
  consultarPermisoNotificaciones,
  solicitarPermisoNotificaciones,
} from '../lib/notificaciones';
import type { EstadoPermiso, RecursoPermiso } from '../types';

type RespuestaBasicaPermiso = {
  granted: boolean;
  canAskAgain: boolean;
};

type ResultadoUsePermiso = {
  estado: EstadoPermiso;
  puedePreguntar: boolean;
  solicitar: () => Promise<boolean>;
  abrirAjustes: () => Promise<void>;
  recargar: () => Promise<void>;
};

function calcularEstado(
  respuesta: RespuestaBasicaPermiso | null,
): EstadoPermiso {
  if (!respuesta) {
    return 'cargando';
  }
  if (respuesta.granted) {
    return 'concedido';
  }
  if (respuesta.canAskAgain) {
    return 'preguntable';
  }
  return 'bloqueado';
}

export function usePermiso(recurso: RecursoPermiso): ResultadoUsePermiso {
  const [permisoCamara, pedirCamara, obtenerCamara] = useCameraPermissions();
  const [permisoNotif, setPermisoNotif] =
    useState<RespuestaBasicaPermiso | null>(null);

  const recargar = useCallback(async () => {
    if (recurso === 'camara') {
      await obtenerCamara();
      return;
    }
    const respuesta = await consultarPermisoNotificaciones();
    setPermisoNotif({
      granted: respuesta.granted,
      canAskAgain: respuesta.canAskAgain,
    });
  }, [recurso, obtenerCamara]);

  useEffect(() => {
    let cancelado = false;

    async function inicializar() {
      if (recurso === 'camara') {
        await obtenerCamara();
        return;
      }
      const respuesta = await consultarPermisoNotificaciones();
      if (!cancelado) {
        setPermisoNotif({
          granted: respuesta.granted,
          canAskAgain: respuesta.canAskAgain,
        });
      }
    }

    inicializar();

    return () => {
      cancelado = true;
    };
  }, [recurso, obtenerCamara]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (siguienteEstado) => {
      if (siguienteEstado === 'active') {
        void recargar();
      }
    });

    return () => {
      suscripcion.remove();
    };
  }, [recargar]);

  const solicitar = useCallback(async (): Promise<boolean> => {
    if (recurso === 'camara') {
      const resultado = await pedirCamara();
      return resultado.granted;
    }
    const resultado = await solicitarPermisoNotificaciones();
    setPermisoNotif({
      granted: resultado.granted,
      canAskAgain: resultado.canAskAgain,
    });
    return resultado.granted;
  }, [recurso, pedirCamara]);

  const abrirAjustes = useCallback(async (): Promise<void> => {
    await Linking.openSettings();
  }, []);

  const respuestaActual: RespuestaBasicaPermiso | null =
    recurso === 'camara'
      ? permisoCamara
        ? {
            granted: permisoCamara.granted,
            canAskAgain: permisoCamara.canAskAgain,
          }
        : null
      : permisoNotif;

  const estado = calcularEstado(respuestaActual);
  const puedePreguntar = respuestaActual ? respuestaActual.canAskAgain : true;

  return {
    estado,
    puedePreguntar,
    solicitar,
    abrirAjustes,
    recargar,
  };
}
