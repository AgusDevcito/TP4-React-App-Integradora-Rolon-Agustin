import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import {
  ALTURA_TACTIL_MINIMA,
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useTema } from '../hooks/useTema';
import { esIsbnValido, limpiarIsbn } from '../lib/validacion';
import { BotonAccion } from './BotonAccion';

type PropsIngresoManualIsbn = {
  onConfirmarIsbn: (isbn: string) => void;
};

export function IngresoManualIsbn({ onConfirmarIsbn }: PropsIngresoManualIsbn) {
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);
  const [valor, setValor] = useState<string>('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  function manejarEnvio() {
    const limpio = limpiarIsbn(valor);
    if (!esIsbnValido(limpio)) {
      setErrorLocal('Ingresá un ISBN de 13 dígitos numéricos (sin guiones).');
      return;
    }
    setErrorLocal(null);
    onConfirmarIsbn(limpio);
  }

  return (
    <View style={estilos.contenedor}>
      <Text style={estilos.titulo}>Ingresar ISBN manualmente</Text>
      <Text style={estilos.descripcion}>
        Si no podés usar la cámara, escribí los 13 dígitos del código de barras.
      </Text>
      <TextInput
        style={estilos.entrada}
        value={valor}
        onChangeText={(texto) => {
          setValor(texto);
          if (errorLocal) {
            setErrorLocal(null);
          }
        }}
        placeholder="Ej: 9780132350884"
        placeholderTextColor={colores.textoSecundario}
        keyboardType="number-pad"
        maxLength={17}
        returnKeyType="search"
        onSubmitEditing={manejarEnvio}
        accessibilityLabel="Número ISBN de 13 dígitos"
      />
      {errorLocal ? <Text style={estilos.error}>{errorLocal}</Text> : null}
      <BotonAccion
        etiqueta="Buscar por ISBN"
        icono="search-outline"
        onPress={manejarEnvio}
      />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      backgroundColor: colores.superficie,
      borderRadius: RADIOS.md,
      padding: ESPACIADO.lg,
      borderWidth: 1,
      borderColor: colores.borde,
      gap: ESPACIADO.sm,
    },
    titulo: {
      fontSize: TAMANIO_TEXTO.md,
      fontWeight: '700',
      color: colores.texto,
    },
    descripcion: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
    },
    entrada: {
      minHeight: ALTURA_TACTIL_MINIMA,
      backgroundColor: colores.superficieSecundaria,
      borderRadius: RADIOS.sm,
      borderWidth: 1,
      borderColor: colores.borde,
      paddingHorizontal: ESPACIADO.md,
      fontSize: TAMANIO_TEXTO.md,
      color: colores.texto,
    },
    error: {
      fontSize: TAMANIO_TEXTO.xs,
      color: colores.error,
    },
  });
}
