# Biblioteca IPF — Trabajo Práctico N° 4

Aplicación móvil integradora desarrollada con **React Native**, **Expo SDK 58** (`expo ~58.0.26`), **Expo Router** (`~58.0.32`) y **TypeScript** (`~6.0.3`) para el Taller Complementario – React Native II (Tecnicatura Superior en Desarrollo de Software Multiplataforma · Instituto Politécnico Formosa).

---

## Stack y versión del SDK

- **Expo SDK:** `58` (`expo ~58.0.26`)
- **Expo Router:** `~58.0.32` (rutas tipadas activas, `Tabs` desde `expo-router/js-tabs`, `Stack.Protected`)
- **React / React Native:** `19.3.0` / `0.88.1`
- **TypeScript:** `~6.0.3` (modo `strict: true`, sin `any`)
- **Módulos nativos instalados (solo los necesarios):** `expo-camera`, `expo-notifications`, `@expo/vector-icons`, `@react-native-async-storage/async-storage`

---

## Cómo ejecutar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo de Expo
npx expo start

# 3. Verificaciones de calidad
npx tsc --noEmit
npx expo lint
npm test
```

Para probar en un teléfono real, abrí **Expo Go** y escaneá el código QR generado por `npx expo start`.

### Datos útiles para pruebas

- **Personal de biblioteca (`/login`):**
  - Usuario: `bibliotecaria`
  - Clave: `ipf2026`
- **ISBN-13 reales incluidos en el catálogo (`src/data/libros.ts`):**
  - `9780132350884` — *Clean Code: Manual de estilo para el desarrollo ágil de software* (Robert C. Martin)
  - `9789500426992` — *El Aleph* (Jorge Luis Borges)
- **Libros con `ejemplares: 0` y lista de espera inicial:**
  - `9789500426985` — *Ficciones* (Jorge Luis Borges) — 2 personas esperando
  - `9780135957059` — *The Pragmatic Programmer* — 1 persona esperando
  - `9780262046305` — *Introduction to Algorithms* — 2 personas esperando

---

## Árbol de carpetas de `src/app/` y navegadores

```text
src/app/
├── _layout.tsx                      # Stack raíz (BibliotecaProvider + NavegadorRaiz con anchor: "(tabs)", modals y Stack.Protected)
├── (tabs)/
│   ├── _layout.tsx                  # Tabs (expo-router/js-tabs): pestañas "Catálogo" y "Mis reservas"
│   ├── (catalogo)/
│   │   ├── _layout.tsx              # Stack propio de la tab "Catálogo" (anchor: "index")
│   │   ├── index.tsx                # URL: /                     (Catálogo, recientes, Buscar, Escanear, link Personal)
│   │   └── libro/
│   │       └── [isbn].tsx           # URL: /libro/[isbn]         (Detalle validado del libro dentro de la tab Catálogo)
│   └── reservas.tsx                 # URL: /reservas             (Tab "Mis reservas": préstamos, recordatorios, espera y avisos)
├── buscar.tsx                       # URL: /buscar?q=            (Stack raíz: buscador sincronizado con URL y debounce)
├── escanear.tsx                     # URL: /escanear             (Stack raíz: escáner EAN-13 con 4 estados + ingreso manual)
├── reservar/
│   └── [isbn].tsx                   # URL: /reservar/[isbn]      (Stack raíz, presentation: "modal")
├── permisos/
│   └── [recurso].tsx                # URL: /permisos/[recurso]   (Stack raíz, presentation: "modal", camara | notificaciones)
├── login.tsx                        # URL: /login                (Stack raíz, modal, Stack.Protected guard={!sesionActiva})
├── mostrador.tsx                    # URL: /mostrador            (Stack raíz, Stack.Protected guard={sesionActiva})
├── reserva.tsx                      # URL: /reserva              (<Redirect href="/reservas" />)
└── +not-found.tsx                   # Cualquier otra URL         (Pantalla 404 mostrando la URL inexistente)
```

---

## Bloque `plugins` de `app.json` comentado

```jsonc
"plugins": [
  // Habilita el enrutamiento basado en archivos, deep links con scheme "bibliotecaipf" y rutas tipadas.
  "expo-router",
  [
    // Configura la pantalla de carga inicial (splash) con el color institucional de Biblioteca IPF.
    "expo-splash-screen",
    {
      "backgroundColor": "#1E3A5F",
      "image": "./assets/images/splash-icon.png",
      "imageWidth": 76
    }
  ],
  [
    // Configura acceso a cámara bajo principio de mínimo privilegio:
    // solo cámara para leer códigos de barras, sin micrófono en iOS ni RECORD_AUDIO en Android.
    "expo-camera",
    {
      "cameraPermission": "Usamos tu cámara para escanear el código de barras de los libros y abrir su ficha al instante.",
      "microphonePermission": false,
      "recordAudioAndroid": false
    }
  ],
  [
    // Configura las notificaciones locales y define el canal por defecto "prestamos" para Android.
    "expo-notifications",
    {
      "defaultChannel": "prestamos"
    }
  ]
]
```

---

## Tabla de permisos

| Recurso | Módulo | Cuándo se pide | Alternativa si se deniega o bloquea |
| :--- | :--- | :--- | :--- |
| Cámara | `expo-camera` (`useCameraPermissions`) | Al entrar a `/escanear`, mostrando antes la pantalla previa `/permisos/camara`. | Ingreso manual del ISBN-13 disponible siempre en `/escanear`. |
| Notificaciones locales | `expo-notifications` | Únicamente cuando la persona activa el interruptor **"Recordarme"** en un préstamo en `/reservas` (previa pantalla `/permisos/notificaciones` y creación del canal `"prestamos"` en Android). | Avisos visibles dentro de la app en la pestaña `/reservas` (sin bloquear ninguna función). |

---

## Justificación de `blockedPermissions` (Android)

En `app.json` bajo `expo.android.blockedPermissions` se bloquean explícitamente los permisos que la aplicación **no necesita**, evitando que dependencias transitivas los incorporen al `AndroidManifest.xml` final:

- `android.permission.RECORD_AUDIO`: la cámara se usa únicamente para escanear códigos de barras EAN-13, nunca para grabar video con audio.
- `android.permission.ACCESS_FINE_LOCATION` y `android.permission.ACCESS_COARSE_LOCATION`: la app no utiliza geolocalización ni instala `expo-location`.
- `android.permission.READ_EXTERNAL_STORAGE` y `android.permission.WRITE_EXTERNAL_STORAGE`: la app no accede a archivos ni a la galería del dispositivo ni instala `expo-image-picker`.

---

## Deep links de prueba

Reemplazá `IP` por la IP local que muestra Expo al ejecutar `npx expo start`:

| Escenario | Scheme (`bibliotecaipf://`) | Expo Go (`exp://`) |
| :--- | :--- | :--- |
| Detalle de libro existente | `bibliotecaipf://libro/9780132350884` | `exp://IP:8081/--/libro/9780132350884` |
| Detalle con ISBN inválido | `bibliotecaipf://libro/123` | `exp://IP:8081/--/libro/123` |
| Buscador con consulta | `bibliotecaipf://buscar?q=borges` | `exp://IP:8081/--/buscar?q=borges` |
| Mostrador protegido (sin sesión) | `bibliotecaipf://mostrador` | `exp://IP:8081/--/mostrador` |
| Redirección de ruta vieja | `bibliotecaipf://reserva` | `exp://IP:8081/--/reserva` |
| Escáner de códigos | `bibliotecaipf://escanear` | `exp://IP:8081/--/escanear` |
| Ruta inexistente (404) | `bibliotecaipf://cualquier-ruta` | `exp://IP:8081/--/cualquier-ruta` |

---

## Desafíos opcionales implementados

- **Persistencia local:** préstamos, historial de vistos recientemente, listas de espera, avisos internos e identificadores de notificaciones se persisten con `@react-native-async-storage/async-storage`. Mientras se hidrata el estado al iniciar, se muestra un indicador de carga para evitar parpadeos de pantalla vacía.
- **Pruebas unitarias:** 10 casos de prueba para `Pila` y `Cola` (incluyendo desencolar una cola vacía) ejecutados con `jest-expo`.
- **Debounce en el buscador:** espera de `300 ms` sin escribir antes de invocar `buscarLibros(q)`, con limpieza del temporizador y descarte de respuestas viejas.
- **Modo oscuro:** soporte automático claro/oscuro mediante `useColorScheme` (`src/hooks/useTema.ts`) y paletas centralizadas en `src/constants/tema.ts`.

---

## Salida de verificaciones

### `npx tsc --noEmit`

```text
$ npx tsc --noEmit
(sin errores — código de salida 0)
```

### `npx expo lint`

```text
$ npx expo lint
npx eslint C:\Users\agust\OneDrive\Desktop\React-TP4\src --fix=false --cache=true --cache-location=C:\Users\agust\OneDrive\Desktop\React-TP4\.expo\cache\eslint\
(sin errores ni advertencias — código de salida 0)
```

### `npm test`

```text
PASS src/estructuras/__tests__/estructuras.test.ts
  Pila
    √ inicia vacía con tamaño 0
    √ respeta el orden LIFO al apilar y desapilar
    √ devuelve undefined al hacer pop en una pila vacía
    √ aArray devuelve una copia defensiva que no muta la pila interna
    √ clonar crea una instancia independiente con los mismos elementos
  Cola
    √ inicia vacía con tamaño 0
    √ respeta el orden FIFO al encolar y desencolar
    √ devuelve undefined al desencolar una cola vacía
    √ calcula correctamente la posición de cada persona en la cola
    √ clonar crea una instancia independiente y resetea índices al vaciarse

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```
