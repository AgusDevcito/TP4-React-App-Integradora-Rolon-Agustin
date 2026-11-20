import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useBiblioteca } from '../context/BibliotecaContext';
import { useTema } from '../hooks/useTema';
import { EstadoCarga } from './EstadoCarga';

export function NavegadorRaiz() {
  const { hidratado, sesionActiva } = useBiblioteca();
  const { colores, esOscuro } = useTema();

  if (!hidratado) {
    return <EstadoCarga mensaje="Recuperando tus préstamos y reservas…" />;
  }

  return (
    <ThemeProvider value={esOscuro ? DarkTheme : DefaultTheme}>
      <StatusBar style={esOscuro ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.superficie },
          headerTintColor: colores.texto,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="buscar" options={{ title: 'Buscar libros' }} />
        <Stack.Screen name="escanear" options={{ title: 'Escanear ISBN' }} />
        <Stack.Screen
          name="reservar/[isbn]"
          options={{
            presentation: 'modal',
            title: 'Confirmar reserva',
          }}
        />
        <Stack.Screen
          name="permisos/[recurso]"
          options={{
            presentation: 'modal',
            title: 'Permiso necesario',
          }}
        />
        <Stack.Protected guard={!sesionActiva}>
          <Stack.Screen
            name="login"
            options={{
              presentation: 'modal',
              title: 'Acceso del personal',
            }}
          />
        </Stack.Protected>
        <Stack.Protected guard={sesionActiva}>
          <Stack.Screen
            name="mostrador"
            options={{
              title: 'Mostrador de biblioteca',
            }}
          />
        </Stack.Protected>
        <Stack.Screen name="reserva" options={{ headerShown: false }} />
        <Stack.Screen
          name="+not-found"
          options={{ title: 'Página no encontrada' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
