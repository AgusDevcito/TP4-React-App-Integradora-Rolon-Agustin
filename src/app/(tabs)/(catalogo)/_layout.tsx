import { Stack } from 'expo-router';

import { useTema } from '../../../hooks/useTema';

export const unstable_settings = {
  anchor: 'index',
};

export default function LayoutCatalogo() {
  const { colores } = useTema();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colores.superficie },
        headerTintColor: colores.texto,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colores.fondo },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Biblioteca IPF',
        }}
      />
      <Stack.Screen
        name="libro/[isbn]"
        options={{
          title: 'Detalle del libro',
        }}
      />
    </Stack>
  );
}
