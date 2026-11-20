import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BotonAccion } from '../components/BotonAccion';
import {
  ALTURA_TACTIL_MINIMA,
  ESPACIADO,
  RADIOS,
  TAMANIO_TEXTO,
  type PaletaColores,
} from '../constants/tema';
import { useBiblioteca } from '../context/BibliotecaContext';
import { useTema } from '../hooks/useTema';

export default function PantallaLogin() {
  const { iniciarSesion } = useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const [usuario, setUsuario] = useState<string>('');
  const [clave, setClave] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  function manejarIngreso() {
    if (usuario.trim().length === 0 || clave.length === 0) {
      setError('Completá usuario y clave para ingresar al mostrador.');
      return;
    }

    const ingresoCorrecto = iniciarSesion(usuario, clave);
    if (!ingresoCorrecto) {
      setError('Usuario o clave incorrectos. Revisá los datos e intentá de nuevo.');
      return;
    }

    setError(null);
  }

  return (
    <KeyboardAvoidingView
      style={estilos.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={estilos.tarjeta}>
        <View style={estilos.encabezado}>
          <Ionicons
            name="shield-outline"
            size={36}
            color={colores.primario}
          />
          <Text style={estilos.titulo}>Personal de biblioteca</Text>
          <Text style={estilos.subtitulo}>
            Ingresá con tu cuenta del Instituto para administrar las entregas en
            mostrador.
          </Text>
        </View>

        <View style={estilos.campo}>
          <Text style={estilos.etiqueta}>Usuario</Text>
          <TextInput
            style={estilos.entrada}
            value={usuario}
            onChangeText={(texto) => {
              setUsuario(texto);
              if (error) {
                setError(null);
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="bibliotecaria"
            placeholderTextColor={colores.textoSecundario}
            accessibilityLabel="Usuario del personal"
          />
        </View>

        <View style={estilos.campo}>
          <Text style={estilos.etiqueta}>Clave</Text>
          <TextInput
            style={estilos.entrada}
            value={clave}
            onChangeText={(texto) => {
              setClave(texto);
              if (error) {
                setError(null);
              }
            }}
            secureTextEntry
            placeholder="Ingresá tu clave"
            placeholderTextColor={colores.textoSecundario}
            returnKeyType="done"
            onSubmitEditing={manejarIngreso}
            accessibilityLabel="Clave del personal"
          />
        </View>

        {error ? (
          <View style={estilos.cajaError}>
            <Text style={estilos.textoError}>{error}</Text>
          </View>
        ) : null}

        <BotonAccion
          etiqueta="Ingresar"
          icono="log-in-outline"
          onPress={manejarIngreso}
        />

        <BotonAccion
          etiqueta="Cancelar"
          variante="secundario"
          onPress={() => router.back()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      justifyContent: 'center',
      padding: ESPACIADO.lg,
      backgroundColor: colores.fondo,
    },
    tarjeta: {
      backgroundColor: colores.superficie,
      borderRadius: RADIOS.lg,
      padding: ESPACIADO.xl,
      borderWidth: 1,
      borderColor: colores.borde,
      gap: ESPACIADO.md,
    },
    encabezado: {
      alignItems: 'center',
      gap: ESPACIADO.xs,
      marginBottom: ESPACIADO.sm,
    },
    titulo: {
      fontSize: TAMANIO_TEXTO.xl,
      fontWeight: '700',
      color: colores.texto,
      textAlign: 'center',
    },
    subtitulo: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.textoSecundario,
      textAlign: 'center',
    },
    campo: {
      gap: ESPACIADO.xs,
    },
    etiqueta: {
      fontSize: TAMANIO_TEXTO.sm,
      fontWeight: '600',
      color: colores.texto,
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
    cajaError: {
      backgroundColor: colores.errorFondo,
      padding: ESPACIADO.md,
      borderRadius: RADIOS.sm,
    },
    textoError: {
      fontSize: TAMANIO_TEXTO.sm,
      color: colores.error,
    },
  });
}
