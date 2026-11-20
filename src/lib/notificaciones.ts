import {
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type NotificationPermissionsStatus,
} from 'expo-notifications';
import { Platform } from 'react-native';

import {
  CANAL_NOTIFICACIONES_ID,
  SEGUNDOS_RECORDATORIO_DEMO,
} from '../constants/credenciales';

export function configurarManejadorNotificaciones(): void {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function asegurarCanalPrestamos(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await setNotificationChannelAsync(CANAL_NOTIFICACIONES_ID, {
    name: 'Recordatorios de préstamos',
    description: 'Avisos antes de la devolución y entrega de libros reservados.',
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function consultarPermisoNotificaciones(): Promise<NotificationPermissionsStatus> {
  return getPermissionsAsync();
}

export async function solicitarPermisoNotificaciones(): Promise<NotificationPermissionsStatus> {
  await asegurarCanalPrestamos();
  return requestPermissionsAsync();
}

export async function programarRecordatorioDevolucion(
  tituloLibro: string,
): Promise<string> {
  await asegurarCanalPrestamos();
  return scheduleNotificationAsync({
    content: {
      title: 'Recordatorio de devolución · Biblioteca IPF',
      body: `Recordá devolver "${tituloLibro}" antes del vencimiento del préstamo.`,
      sound: true,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: SEGUNDOS_RECORDATORIO_DEMO,
      repeats: false,
      channelId: CANAL_NOTIFICACIONES_ID,
    },
  });
}

export async function cancelarNotificacion(notificacionId: string): Promise<void> {
  try {
    await cancelScheduledNotificationAsync(notificacionId);
  } catch {
    // Si la notificación ya se disparó o fue descartada, ignoramos el error.
  }
}

export async function enviarNotificacionEntrega(
  tituloLibro: string,
): Promise<boolean> {
  const estadoPermiso = await getPermissionsAsync();
  if (!estadoPermiso.granted) {
    return false;
  }
  await asegurarCanalPrestamos();
  await scheduleNotificationAsync({
    content: {
      title: 'Tu libro ya está disponible · Biblioteca IPF',
      body: `"${tituloLibro}" pasó a estar en préstamo a tu nombre. Podés retirarlo en mostrador.`,
      sound: true,
    },
    trigger: null,
  });
  return true;
}
