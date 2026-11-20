import AsyncStorage from '@react-native-async-storage/async-storage';

import { CLAVE_ALMACENAMIENTO } from '../constants/credenciales';
import type { EstadoPersistido } from '../types';

export async function cargarEstadoGuardado(): Promise<EstadoPersistido | null> {
  try {
    const texto = await AsyncStorage.getItem(CLAVE_ALMACENAMIENTO);
    if (!texto) {
      return null;
    }
    const parsed: unknown = JSON.parse(texto);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'prestamos' in parsed &&
      'recientes' in parsed &&
      'listasEspera' in parsed &&
      'avisos' in parsed
    ) {
      return parsed as EstadoPersistido;
    }
    return null;
  } catch {
    return null;
  }
}

export async function guardarEstado(estado: EstadoPersistido): Promise<void> {
  try {
    await AsyncStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(estado));
  } catch {
    // Si falla el almacenamiento local, la app sigue operando en memoria.
  }
}
