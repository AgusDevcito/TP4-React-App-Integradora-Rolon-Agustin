# Respuestas de análisis técnico — Trabajo Práctico N° 4 (“Biblioteca IPF”)

Todas las respuestas de este documento se apoyan directamente en el código del proyecto, citando archivos y líneas reales.

---

## Parte B · Estado, efectos y renderizado

### B1. El ciclo de vida de `useLibros`

Archivo de referencia: `src/hooks/useLibros.ts` (líneas 13–52).

#### a) Análisis render por render

**Caso 1: `obtenerLibros()` tiene éxito**

1. **Render 1 (montaje inicial de `PantallaCatalogo`):**
   - `libros = []`, `cargando = true`, `error = null`, `intento = 0`.
   - **Qué lo provoca:** el montaje inicial del componente. En pantalla se ve `<EstadoCarga />` (`src/app/(tabs)/(catalogo)/index.tsx`, líneas 79–80).
   - Después de pintar el Render 1, React ejecuta el `useEffect` (líneas 19–45), que llama a `cargarCatalogo()`.
   - Dentro de `cargarCatalogo()`, `setCargando(true)` y `setError(null)` mantienen exactamente los mismos valores (`Object.is(true, true)` y `Object.is(null, null)`), por lo que React **no dispara un render extra** antes de la espera de 800 ms.
2. **Render 2 (800 ms después, se resuelve `obtenerLibros()`):**
   - `libros = [16 objetos Libro]`, `cargando = false`, `error = null`, `intento = 0`.
   - **Qué lo provoca:** las llamadas `setLibros(datos)` y `setCargando(false)` (líneas 27–28), que React agrupa en un único batch automático (React 18+/19) generando un solo render. En pantalla se reemplaza `<EstadoCarga />` por el `<FlatList>` con los 16 libros.

**Total en caso exitoso:** 2 renders.

**Caso 2: `obtenerLibros()` falla y la persona toca “Reintentar”**

1. **Render 1 (montaje inicial):** `libros = []`, `cargando = true`, `error = null`, `intento = 0`. Muestra `<EstadoCarga />`.
2. **Render 2 (a los 800 ms, `obtenerLibros()` rechaza la promesa):**
   - `libros = []`, `cargando = false`, `error = "No pudimos conectarnos con el catálogo de la biblioteca. Intentá nuevamente."`, `intento = 0`.
   - **Qué lo provoca:** el bloque `catch` ejecuta `setError(...)` y `setCargando(false)` (líneas 32–35) en un solo batch. En pantalla aparece `<EstadoError />` con el botón “Reintentar”.
3. **Render 3 (la persona toca “Reintentar”):**
   - `libros = []`, `cargando = false`, `error = "No pudimos..."`, `intento = 1`.
   - **Qué lo provoca:** `reintentar()` ejecuta `setIntento((actual) => actual + 1)` (línea 48). Al cambiar `intento`, después del render se ejecuta primero la limpieza del efecto anterior (`cancelado = true`) y luego el nuevo efecto (`cargarCatalogo()`).
4. **Render 4 (inicio del nuevo efecto):**
   - `libros = []`, `cargando = true`, `error = null`, `intento = 1`.
   - **Qué lo provoca:** `setCargando(true)` y `setError(null)` (líneas 23–24) porque ahora sí cambian respecto a `false` y el string de error. Vuelve a verse `<EstadoCarga />`.
5. **Render 5 (800 ms después, el segundo pedido se resuelve):**
   - `libros = [16 objetos Libro]`, `cargando = false`, `error = null`, `intento = 1`.
   - **Qué lo provoca:** `setLibros(datos)` y `setCargando(false)` (líneas 27–28). Aparece la lista.

#### b) Desmontaje del Catálogo y ejecución de la limpieza

- **Al cambiar a la pestaña “Mis reservas”:** el Catálogo **no se desmonta**. `Tabs` (de `expo-router/js-tabs`) mantiene montadas las pantallas de cada pestaña para preservar su estado y su pila interna.
- **Al abrir un detalle `/libro/[isbn]`:** el Catálogo **tampoco se desmonta**. El Stack propio de la tab `(catalogo)` apila `/libro/[isbn]` encima de `index`, manteniendo `index` montado debajo en la pila.
- **¿En qué situaciones reales se ejecuta la limpieza (`cancelado = true`, líneas 42–44)?**
  1. Cada vez que cambia `intento` (por ejemplo, cuando la persona toca “Reintentar”), antes de correr el efecto nuevo.
  2. Si el Catálogo efectivamente se desmonta mientras el pedido de 800 ms todavía está en vuelo (por ejemplo, si un cambio de árbol raíz desmonta `(tabs)`, durante Fast Refresh en desarrollo, o si se navega reemplazando el grupo raíz). Sin esta limpieza, un pedido en vuelo que termine tras desmontar o tras un reintento podría pisar el estado con una respuesta obsoleta.

#### c) ¿Por qué no se puede pasar una función `async` directamente a `useEffect`?

Una función `async` siempre devuelve una `Promise`. Sin embargo, `useEffect` espera que su callback devuelva **o bien `undefined`, o bien una función síncrona de limpieza (`() => void`)**. Si se pasara `useEffect(async () => { ... }, [])`, React recibiría una `Promise` en lugar de una función de cleanup (TypeScript además lo marca como error de tipo) y nunca podría ejecutar la limpieza.

**Cómo se resolvió en `src/hooks/useLibros.ts` (líneas 19–45):** se define una función interna `async function cargarCatalogo()`, se la invoca dentro del efecto síncrono, y el efecto devuelve la función síncrona `() => { cancelado = true; }`:

```ts
useEffect(() => {
  let cancelado = false;

  async function cargarCatalogo() {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerLibros();
      if (!cancelado) {
        setLibros(datos);
        setCargando(false);
      }
    } catch {
      if (!cancelado) {
        setError(
          'No pudimos conectarnos con el catálogo de la biblioteca. Intentá nuevamente.',
        );
        setCargando(false);
      }
    }
  }

  cargarCatalogo();

  return () => {
    cancelado = true;
  };
}, [intento]);
```

#### d) Implementación de `reintentar` y dependencia elegida

En `src/hooks/useLibros.ts` (líneas 17, 45 y 47–49):

```ts
const [intento, setIntento] = useState<number>(0);
// ...
}, [intento]);

const reintentar = useCallback(() => {
  setIntento((actual) => actual + 1);
}, []);
```

Al incrementar `intento`, su valor cambia de `0` a `1`, `2`, etc. Como `intento` está en el array de dependencias del `useEffect`, React vuelve a ejecutar el efecto (ejecutando antes la limpieza del intento previo).

**¿Por qué un contador numérico (`intento`) y no otro valor (como un booleano `reintentando` o el propio `error`)?**
- Un contador siempre produce un valor nuevo garantizado en cada clic (`0 → 1 → 2`), evitando quedarse “trabado” en `true` como ocurriría con un booleano si no se resetea.
- No conviene depender de `error` ni de `cargando` porque el propio efecto modifica ambos estados, lo cual provocaría bucles infinitos o re-ejecuciones indeseadas.

---

### B2. La condición de carrera del buscador

Archivo de referencia: `src/app/buscar.tsx` (líneas 38–67).

> Nota: nuestra implementación incluye además un **debounce de 300 ms** (`DEMORA_DEBOUNCE_MS = 300`, línea 21). Para comparar con precisión la tabla del enunciado, se indica lo que ocurre tanto por el flag `cancelado` como por el debounce.

| Momento | Qué pasa | Sin limpieza: qué se ve | Con tu código: qué se ve |
| :--- | :--- | :--- | :--- |
| `t = 0 ms` | Escribe “bor” → se pide `buscarLibros("bor")`, que tarda 1.400 ms. | Indicador de carga (o lista anterior) esperando “bor”. | Se programa el temporizador de 300 ms para “bor”. Aún no se dispara la red (sigue mostrando estado anterior/carga). |
| `t = 200 ms` | Escribe “borges” → se pide `buscarLibros("borges")`, que tarda 300 ms. | Se lanza un segundo pedido paralelo; sigue cargando mientras ambos pedidos corren. | El cleanup del efecto de “bor” ejecuta `cancelado = true` y `clearTimeout(temporizador)`. El pedido de “bor” ni siquiera llega a dispararse (y si se hubiera disparado sin debounce, su bandera `cancelado` ya sería `true`). Se programa el temporizador de “borges”. |
| `t = 500 ms` | Llega la respuesta de “borges”. | Aparecen los resultados de **“borges”** (*El Aleph* y *Ficciones*). | Aparecen los resultados de **“borges”** (*El Aleph* y *Ficciones*). |
| `t = 1.400 ms` | Llega la respuesta de “bor”. | **Bug:** `setResultados` sobrescribe la pantalla con los resultados viejos de **“bor”** aunque el input dice “borges”. | **Se siguen viendo los resultados de “borges”.** Con el debounce “bor” fue cancelado antes de salir; e incluso si la pausa hubiese superado 300 ms y “bor” hubiera salido a red, su `if (!cancelado)` evalúa `false` y descarta la respuesta vieja. |

#### a) Qué hace la limpieza exactamente y cuándo se ejecuta

En `src/app/buscar.tsx` (líneas 38–67):

```ts
useEffect(() => {
  let cancelado = false;

  const temporizador = setTimeout(() => {
    async function ejecutarBusqueda() {
      setCargando(true);
      setError(null);
      try {
        const datos = await buscarLibros(consulta);
        if (!cancelado) {
          setResultados(datos);
          setCargando(false);
        }
      } catch {
        if (!cancelado) {
          setError('No pudimos completar la búsqueda. Intentá de nuevo.');
          setCargando(false);
        }
      }
    }

    void ejecutarBusqueda();
  }, DEMORA_DEBOUNCE_MS);

  return () => {
    cancelado = true;
    clearTimeout(temporizador);
  };
}, [consulta, intento]);
```

- **Cuándo se ejecuta:** inmediatamente **antes** de que vuelva a ejecutarse el efecto por un cambio en `consulta` (o `intento`), y también cuando `PantallaBuscar` se desmonta.
- **Qué hace:** (1) cancela el `setTimeout` pendiente con `clearTimeout(temporizador)` para no disparar pedidos innecesarios mientras la persona escribe; y (2) marca `cancelado = true` en la clausura de esa ejecución del efecto, de modo que si `buscarLibros(consulta)` ya estaba en vuelo y se resuelve tarde, la condición `if (!cancelado)` impide llamar a `setResultados` o `setError`.

#### b) ¿Funciona comparar `if (texto === q)` dentro del `.then()`?

**No funciona.** En JavaScript, la función callback que se pasa a `.then()` forma una **clausura (closure)** sobre las variables del render en el que se creó el `useEffect`. En ese render, `q` tenía el valor `"bor"` y `texto` también valía `"bor"`.

Cuando más tarde la persona escribe `"borges"`, React ejecuta la función componente otra vez y crea una **nueva** constante `q = "borges"` en un nuevo ámbito léxico. Sin embargo, el `.then()` del pedido anterior sigue cerrado sobre la `q` vieja (`"bor"`). Por lo tanto, cuando llega la respuesta vieja, `texto === q` evalúa `"bor" === "bor"`, que es **siempre `true`**, y sobrescribe igualmente los resultados nuevos.

#### c) URL, botón atrás y diferencia entre `router.setParams` y `router.push`

- Con `router.setParams({ q: texto })` (`src/app/buscar.tsx`, línea 97), la URL se actualiza en el lugar (`/buscar?q=b` → `/buscar?q=bo` → `/buscar?q=borges`) **sin agregar entradas nuevas a la pila del Stack raíz**. Al tocar atrás una sola vez, la persona vuelve directamente a la pantalla desde donde abrió el buscador (por ejemplo, el Catálogo).
- Si usáramos `router.push` en `onChangeText`, cada tecla presionada apilaría una pantalla nueva en el Stack (`/buscar?q=b`, `/buscar?q=bo`, `/buscar?q=bor`, …). La persona tendría que tocar “atrás” 6 veces solo para deshacer la palabra `"borges"`, además de perder el foco del `TextInput` y degradar severamente el rendimiento.

---

### B3. Mutar o reemplazar

#### a) La persona toca “Anotarme” tres veces. ¿Qué muestra el texto? ¿Por qué?

El texto sigue mostrando **`Personas en espera: 0`**.

**Por qué:** `espera.encolar('Ana')` muta internamente el campo privado `#items` de la misma instancia de `Cola`, pero nunca llama al *setter* de `useState`. Como React solo programa un re-render cuando se invoca el setter con un valor distinto por `Object.is`, el componente no se vuelve a renderizar y la pantalla queda congelada en `0`.

#### b) Al escribir en un `TextInput` controlado el número “salta” a 3

Al escribir en el `TextInput` controlado, su `onChangeText` llama a otro `setState` de la misma pantalla, lo que sí dispara un re-render completo del componente. En ese nuevo render, React evalúa nuevamente `{espera.tamanio}` leyendo la instancia que ya había sido mutada 3 veces en silencio, por lo que el número “salta” de `0` a `3` de golpe.

**Por qué un bug intermitente es peor que uno constante:** un error que ocurre siempre se detecta en la primera prueba y se corrige de inmediato. Un error que “a veces funciona” porque otro estado vecino provoca un re-render casual puede pasar desapercibido en desarrollo, llegar a producción y manifestarse solo cuando la persona usa la pantalla en un orden distinto, volviéndolo mucho más difícil de reproducir y diagnosticar.

#### c) Cómo se resolvió en `BibliotecaContext` y comparación con alternativas

En `src/context/BibliotecaContext.tsx` (líneas 225–233 y 301–307), nunca mutamos la `Cola` ni la `Pila` almacenadas en el estado. Clonamos la estructura antes de modificarla y reemplazamos la referencia en el estado:

```ts
const colaActual = listasEspera[isbn] ?? new Cola<string>();
const nuevaCola = colaActual.clonar();
nuevaCola.encolar(ALUMNO_ACTUAL);

setListasEspera((actuales) => ({
  ...actuales,
  [isbn]: nuevaCola,
}));
```

Y para la `Pila` de recientes (líneas 181–190):

```ts
setPilaRecientes((pilaActual) => {
  if (pilaActual.verTope()?.isbn === libro.isbn) {
    return pilaActual;
  }
  const nuevaPila = pilaActual.clonar();
  nuevaPila.push(libro);
  return nuevaPila;
});
```

| Estrategia | Ventaja | Costo / Desventaja |
| :--- | :--- | :--- |
| **Clonar y reemplazar (elegida)** | Inmutabilidad real: compatible con React Compiler, `useMemo`, `React.memo` y comparaciones por referencia (`Object.is`). | Copia superficial de los elementos (`O(n)`), insignificante para colas de biblioteca y pilas pequeñas. |
| **Contador de versión (`version + 1`) mutando la misma instancia** | Evita clonar la estructura (`O(1)` en memoria). | Rompe la inmutabilidad: cualquier hijo memorizado que reciba la instancia `cola` por props no detecta cambios porque la referencia no cambió; más propenso a bugs sutiles. |
| **`useReducer` con estado inmutable** | Centraliza todas las transiciones en una función pura fácil de testear. | Más código boilerplate (tipos de acciones y `switch`) que para este tamaño de contexto no era estrictamente necesario. |

---

### B4. ¿Dónde vive cada dato?

| Dato | Dónde vive en tu app | Por qué ahí y no en otro lugar |
| :--- | :--- | :--- |
| **Texto del buscador** | **URL** (`?q=` leído con `useLocalSearchParams` y actualizado con `router.setParams` en `src/app/buscar.tsx`, líneas 24–25 y 97). | Permite deep links directos como `bibliotecaipf://buscar?q=borges`, compartir búsquedas y mantener una única fuente de verdad sin duplicarlo en `useState`. |
| **Préstamos y reservas** | **Context** (`BibliotecaContext.tsx`, línea 90) + persistencia en `AsyncStorage` (`src/lib/almacenamiento.ts`). | Se consultan y modifican desde varias pantallas no emparentadas: Detalle (`/libro/[isbn]`), Modal de reserva (`/reservar/[isbn]`), Mis reservas (`/reservas`) y Mostrador (`/mostrador`). |
| **Listas de espera** | **Context** (`listasEspera: Record<string, Cola<string>>` en `BibliotecaContext.tsx`, líneas 94–96) + `AsyncStorage`. | Se leen en Catálogo, Detalle, Reserva, Mis reservas y Mostrador, y se modifican desde `/reservar/[isbn]` y `/mostrador`. |
| **Vistos recientemente** | **Context** (`pilaRecientes: Pila<Libro>` en `BibliotecaContext.tsx`, líneas 91–93) + `AsyncStorage`. | Se escribe al abrir `/libro/[isbn]` y se lee en `/` (Catálogo). Si viviera en estado local del Catálogo, el Detalle no podría hacer `push`. |
| **Sesión del personal** | **Context** (`sesionActiva` en `BibliotecaContext.tsx`, línea 98). | Controla `<Stack.Protected>` en `src/components/NavegadorRaiz.tsx` (líneas 47–64), el link “Personal” del header y las pantallas `/login` y `/mostrador`. No se persiste a propósito para que la sesión de mostrador sea temporal. |
| **Ejemplares disponibles de un libro** | **Se calcula** (`obtenerEjemplaresDisponibles` en `BibliotecaContext.tsx`, líneas 138–144). | Se deriva como `Math.max(0, libro.ejemplares - prestamosActivosDelLibro)`. Guardarlo aparte duplicaría la fuente de verdad y podría desincronizarse al prestar o devolver. |
| **Estado del permiso de cámara** | **Sistema operativo** (consultado vía `useCameraPermissions()` dentro de `src/hooks/usePermiso.ts`, líneas 41 y 60–89). | La autoridad real es Android/iOS; el usuario puede cambiarlo fuera de la app en Ajustes, por eso lo consultamos al SO y lo refrescamos con `AppState`. |
| **Identificador de la notificación programada** | **Context** (campo `notificacionId` dentro de cada `Prestamo` en `BibliotecaContext.tsx`, línea 264) + **persistido en `AsyncStorage`**. | Se genera al activar el interruptor en `/reservas` y debe seguir accesible para cancelar la notificación si la persona apaga el interruptor, devuelve el libro o cierra y reabre la app. |

#### Re-renderizado al cambiar el `value` del Context

Cuando cambia cualquier estado dentro de `BibliotecaProvider` (por ejemplo, al activar un recordatorio en `/reservas`, lo que actualiza `prestamos`), se recalcula el objeto `valor` del `useMemo` (`BibliotecaContext.tsx`, líneas 392–438) y **todos los componentes que consumen `useBiblioteca()` se vuelven a renderizar**, incluido `PantallaCatalogo` (aunque solo use `recientes`, `obtenerEjemplaresDisponibles` y `obtenerCantidadEnEspera`, y además `obtenerEjemplaresDisponibles` sí depende de `prestamos`).

- **Cómo evitarlo:** dividir el contexto en contextos más pequeños por dominio (por ejemplo `RecientesContext`, `PrestamosContext`, `SesionContext`) o usar una librería con selectores granulares (como Zustand).
- **¿Vale la pena en una app de este tamaño?** No es necesario: tenemos 16 libros y pocas pantallas; el costo de re-renderizar es de milisegundos y dividir en 4 contextos agregaría complejidad innecesaria. Sí es buena práctica mantener el `value` memorizado con `useMemo` y los callbacks con `useCallback` como hicimos.

---

## Parte C · Navegación y rutas

### C1. La pila en tu app

| # | Acción | Pilas resultantes (de base a tope) |
| :--- | :--- | :--- |
| 1 | Abre la app. | **Stack raíz:** `[(tabs)]` · **Tab activa:** `(catalogo)` · **Stack Catálogo:** `[/]` |
| 2 | Toca un libro del Catálogo. | **Stack raíz:** `[(tabs)]` · **Tab activa:** `(catalogo)` · **Stack Catálogo:** `[/, /libro/[isbn]]` |
| 3 | Toca “Reservar”. | **Stack raíz:** `[(tabs), /reservar/[isbn] (modal)]` · **Tab activa:** `(catalogo)` · **Stack Catálogo:** `[/, /libro/[isbn]]` |
| 4 | Toca “Confirmar”. | **Stack raíz:** `[(tabs)]` · **Tab activa:** `reservas` (`/reservas`) · **Stack Catálogo:** `[/, /libro/[isbn]]` |
| 5 | Toca atrás (Android). | **Stack raíz:** `[(tabs)]` · **Tab activa:** `(catalogo)` · **Stack Catálogo:** `[/, /libro/[isbn]]` (vuelve a la tab anterior sin volver jamás al modal `/reservar/[isbn]`) |
| 6 | Toca la tab “Catálogo”. | **Stack raíz:** `[(tabs)]` · **Tab activa:** `(catalogo)` · **Stack Catálogo:** `[/, /libro/[isbn]]` |

#### a) Método usado en el paso 4 y comparación

En `src/app/reservar/[isbn].tsx` (línea 72) se usó:

```ts
router.dismissTo('/reservas');
```

- **Qué habría pasado con `push('/reservas')`:** habría apilado una pantalla encima del modal o dejado `/reservar/[isbn]` vivo en la pila, de modo que al tocar atrás la persona volvería al formulario de confirmación ya completado.
- **Qué habría pasado con `replace('/reservas')`:** en un modal del Stack raíz que navega hacia una pestaña anidada dentro de `(tabs)`, `replace` puede reemplazar la entrada dentro del Stack raíz en lugar de descartar limpiamente el modal y enfocar la tab `(tabs)` ya existente debajo.
- **Por qué `dismissTo('/reservas')`:** cierra (descarta) el modal `/reservar/[isbn]` del Stack raíz volviendo al grupo `(tabs)` que estaba debajo y selecciona directamente la pestaña `/reservas`. Así el modal desaparece del historial y “atrás” nunca vuelve a la confirmación.

#### b) En el paso 6, ¿qué pantalla ve la persona?

La persona ve el **detalle del libro (`/libro/[isbn]`)**, porque el Stack propio de la pestaña `(catalogo)` (`src/app/(tabs)/(catalogo)/_layout.tsx`) conserva su historial independiente `[/, /libro/[isbn]]` mientras el usuario estuvo en la pestaña `reservas`.

**¿Es el comportamiento correcto?** Sí, es el patrón estándar en aplicaciones móviles con tabs + stacks anidados (como App Store o Spotify): volver a la pestaña Catálogo retoma donde dejaste la lectura (ahora además reflejando el stock actualizado o “Ya reservado”), y un segundo toque en la tab o el botón atrás del header vuelve a la raíz `/`.

---

### C2. El escáner que dispara de más

Archivo de referencia: `src/app/escanear.tsx` (líneas 31–32 y 56–88).

#### a) Qué pasaría si llamaras a `router.push` sin protección

`CameraView` invoca `onBarcodeScanned` en cada frame donde detecta el código (fácilmente 15–30 veces por segundo). Cada llamada encolaría una acción `PUSH /libro/[isbn]` en la cola de acciones de navegación del router (como vimos en el TP 2). El resultado sería abrir múltiples copias apiladas del mismo detalle `/libro/[isbn]`; al tocar atrás, la persona vería el mismo libro una y otra vez hasta vaciar todas las copias apiladas.

#### b) `useState` vs `useRef`

Usamos **`useRef<boolean>(false)`** (`navegandoRef`, `src/app/escanear.tsx`, línea 31):

```ts
const navegandoRef = useRef<boolean>(false);
// ...
const manejarCodigoEscaneado = useCallback(
  (resultado: BarcodeScanningResult) => {
    if (navegandoRef.current) {
      return;
    }
    abrirLibroPorIsbn(resultado.data);
  },
  [abrirLibroPorIsbn],
);
```

**Por qué `useState` no alcanza:** `setEscaneado(true)` es **asíncrono** respecto al render actual; el nuevo valor solo existirá en el próximo render. Los siguientes 3 o 5 frames de la cámara pueden disparar `onBarcodeScanned` en los milisegundos previos al re-render, leyendo todavía `escaneado === false` en la clausura del callback y disparando navegaciones duplicadas. En cambio, mutar `navegandoRef.current = true` (línea 76) es **inmediato y síncrono**, bloqueando al instante cualquier invocación posterior.

#### c) Por qué conviene `router.replace` para ir del escáner al detalle

En `src/app/escanear.tsx` (línea 77) usamos `router.replace({ pathname: '/libro/[isbn]', params: { isbn: libro.isbn } })`.

Si usáramos `push`, al tocar atrás desde el detalle la persona volvería a `/escanear` con la cámara abierta apuntando probablemente al mismo libro que todavía tiene en la mano, lo que volvería a escanearlo y a reabrir el detalle en un bucle molesto. Con `replace`, `/escanear` se reemplaza en el historial y tocar atrás regresa al Catálogo.

#### d) ISBN que no está en el catálogo

En `src/app/escanear.tsx` (líneas 32 y 65–74):

```ts
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
```

La app **no navega** ni bloquea la cámara: muestra un banner de advertencia en pantalla (`cajaAviso`, líneas 155–164) y permite seguir escaneando otros libros. Como guardamos el último ISBN inexistente en `ultimoIsbnNoEncontradoRef`, si el mismo código sigue frente a la cámara durante varios segundos, la condición `ultimoIsbnNoEncontradoRef.current !== limpio` evita disparar avisos repetidos ni re-renders innecesarios.

---

### C3. Deep links y rutas protegidas

| Link | Qué ve la persona | Qué queda debajo en la pila | Qué parte de tu código lo decide |
| :--- | :--- | :--- | :--- |
| `bibliotecaipf://libro/9780132350884` | Ficha completa de *Clean Code* con título en el header y botón “Reservar”. | `/` (Catálogo) dentro del Stack de la tab `(catalogo)`. | `src/app/(tabs)/(catalogo)/_layout.tsx` (`unstable_settings = { anchor: 'index' }`) y `src/app/(tabs)/(catalogo)/libro/[isbn].tsx`. |
| `bibliotecaipf://libro/123` | Mensaje claro: *“El código '123' no tiene un formato ISBN-13 válido de 13 dígitos”* y botón “Volver al Catálogo”. | `/` (Catálogo). | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (líneas 21–23 y 40–58) usando `esIsbnValido` de `src/lib/validacion.ts`. |
| `bibliotecaipf://buscar?q=borges` | Pantalla de búsqueda con `"borges"` precargado en el campo y los resultados (*El Aleph*, *Ficciones*). | `(tabs)` (Catálogo). | `src/app/_layout.tsx` (`unstable_settings = { anchor: '(tabs)' }`) y `src/app/buscar.tsx` (`useLocalSearchParams`). |
| `bibliotecaipf://mostrador` (sin sesión) | Es redirigida automáticamente al anchor `(tabs)` (Catálogo `/`), sin ver `/mostrador`. | Nada debajo (queda en la raíz de `(tabs)`). | `src/components/NavegadorRaiz.tsx` (líneas 56–63): `<Stack.Protected guard={sesionActiva}>` bloquea `mostrador` cuando `sesionActiva === false`. |
| `bibliotecaipf://reserva` | Pestaña **Mis reservas** (`/reservas`). | `(tabs)` (es una de las pestañas). | `src/app/reserva.tsx` (línea 4): `<Redirect href="/reservas" />`. |
| `bibliotecaipf://escanear` (cámara bloqueada) | Se abre `/escanear`, detecta `estado === 'bloqueado'` y presenta el modal `/permisos/camara` con botón “Abrir Ajustes”. Al cerrarlo, `/escanear` muestra el aviso de cámara bloqueada + ingreso manual de ISBN. | `(tabs)` debajo de `/escanear` (por `anchor: '(tabs)'`). | `src/app/_layout.tsx`, `src/app/escanear.tsx` (líneas 43–54 y 137–152) y `src/app/permisos/[recurso].tsx` (líneas 82–113). |

#### ¿Por qué `/libro/123` llega a la pantalla de detalle aunque no exista el libro?

Porque el enrutador basado en archivos de Expo Router hace coincidir el patrón dinámico `[isbn]` con **cualquier segmento de texto** (`/libro/<cualquier-cosa>`); el router no conoce reglas de negocio ni qué ISBNs existen en la base de datos. La responsabilidad de validar el formato del parámetro (`esIsbnValido`) y verificar la existencia del recurso (`buscarLibroPorIsbn`) corresponde **a la propia pantalla de detalle** (`src/app/(tabs)/(catalogo)/libro/[isbn].tsx`, líneas 20–58), devolviendo siempre un mensaje claro y una salida hacia el Catálogo.

---

### C4. Foco, montaje y primer plano

#### a) Qué evento detecta cada herramienta

- **`useEffect(..., [])`:** se ejecuta **una sola vez** al montarse el componente (y su limpieza al desmontarse).
- **`useFocusEffect` (de `expo-router`):** se ejecuta **cada vez que la pantalla gana foco** dentro de la navegación (al entrar por primera vez, al volver desde otra pestaña o al cerrar un modal que estaba encima).
- **`AppState.addEventListener('change', ...)`:** detecta cambios en el ciclo de vida de la **aplicación completa en el sistema operativo** (`active`, `background`, `inactive`), por ejemplo cuando la persona sale a Ajustes del teléfono y regresa a la app.

#### b) Comparación de dos escenarios

- **La persona sale a Ajustes, habilita notificaciones y vuelve a la app:** solo **`AppState`** se entera (`background → active`). Ni `useEffect([])` (la pantalla ya estaba montada) ni `useFocusEffect` (la pantalla nunca perdió foco dentro del navegador de React Navigation) se disparan.
- **La persona va a la pestaña Catálogo y vuelve a “Mis reservas”:** solo **`useFocusEffect`** se entera. `useEffect([])` no corre porque la pestaña no se desmontó, y `AppState` tampoco cambia porque la app siguió en primer plano (`active`).

#### c) Cuál usamos en nuestra app y por qué

Usamos **una combinación de `AppState` (dentro de `usePermiso`, `src/hooks/usePermiso.ts`, líneas 75–85) y `useFocusEffect` (en `src/app/(tabs)/reservas.tsx`, líneas 41–45, y en `src/app/escanear.tsx`, líneas 37–41)**:

- `AppState` garantiza que si la persona habilita o revoca el permiso en Ajustes del sistema operativo y vuelve a la app, el estado se actualiza automáticamente.
- `useFocusEffect` garantiza que si el permiso cambia desde el modal `/permisos/[recurso]` o mientras el usuario estaba en otra pestaña, al regresar a “Mis reservas” o “Escanear” se consulte el estado vigente.

Si hubiéramos usado únicamente `useEffect([])`, al volver de Ajustes o del modal `/permisos/notificaciones` la pestaña “Mis reservas” seguiría mostrando el estado viejo (“Notificaciones bloqueadas”) hasta reiniciar la app.

---

## Parte D · Permisos en tu app

### D1. Recorrido completo de la cámara (Android 14, app recién instalada)

| # | Acción | Qué muestra tu app | `status` | `canAskAgain` |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Toca “Escanear” por primera vez. | Entra a `/escanear`; al detectar `estado === 'preguntable'`, abre el modal `/permisos/camara` con el beneficio y el botón **“Continuar”**. | `undetermined` | `true` |
| 2 | “Continuar” → “No permitir”. | Se muestra el diálogo del sistema, se rechaza, se cierra el modal y queda en `/escanear` en estado `preguntable` (aviso + botón “Permitir cámara” + ingreso manual de ISBN). | `denied` | `true` |
| 3 | Toca “Escanear” otra vez. | Vuelve a abrir `/permisos/camara` con el botón **“Continuar”** (en Android 14 el sistema permite preguntar una segunda vez antes de bloquear). | `denied` | `true` |
| 4 | “Continuar” → “No permitir”. | Segundo rechazo consecutivo: Android bloquea futuros diálogos (`canAskAgain: false`). Se cierra el modal y `/escanear` pasa al estado `bloqueado` con botón “Abrir Ajustes” + ingreso manual. | `denied` | `false` |
| 5 | Toca “Escanear” otra vez. | Abre `/permisos/camara`, que detecta `estaBloqueado === true` y muestra el único botón **“Abrir Ajustes”**. | `denied` | `false` |
| 6 | “Abrir Ajustes” → habilita la cámara → vuelve a la app. | Al volver a primer plano, `AppState` dispara `recargar()`, el estado cambia a `concedido`, `/permisos/camara` se cierra solo (`router.back()`) y `/escanear` muestra `CameraView` listo para leer EAN-13. | `granted` | `true` |

#### a) Recorrido en iOS

En **iOS**, el resultado cambia ya en el **paso 2**: iOS solo muestra el diálogo del sistema **una única vez**. Tras el primer “No permitir” en el paso 2, iOS ya devuelve `status: "denied"` y `canAskAgain: false`. Por lo tanto, ya en el **paso 3** (la segunda vez que toca “Escanear”), nuestra app detecta `estado === 'bloqueado'` y muestra directamente el botón **“Abrir Ajustes”** en lugar de volver a mostrar “Continuar”.

#### b) Línea de código que decide entre “Continuar” y “Abrir Ajustes”

En `src/app/permisos/[recurso].tsx` (líneas 82 y 108) y `src/hooks/usePermiso.ts` (líneas 23–37):

```ts
// src/hooks/usePermiso.ts (líneas 31-36)
if (respuesta.canAskAgain) {
  return 'preguntable';
}
return 'bloqueado';

// src/app/permisos/[recurso].tsx (líneas 82 y 108)
const estaBloqueado = estado === 'bloqueado' || !puedePreguntar;
// ...
etiqueta={estaBloqueado ? 'Abrir Ajustes' : 'Continuar'}
```

Usa el campo **`canAskAgain`** (expuesto como `puedePreguntar` y reflejado en `estado === 'bloqueado'`). **No alcanza con mirar `status`** porque en Android tanto después del primer rechazo (paso 2, donde todavía se puede volver a pedir) como después del segundo rechazo (paso 4, donde el sistema ya ignora nuevas solicitudes) el `status` es exactamente el mismo: `"denied"`. Solo `canAskAgain` distingue si todavía se puede mostrar el diálogo del sistema o si hay que llevar a la persona a Ajustes.

#### c) Cómo se entera la app en el paso 6

En `src/hooks/usePermiso.ts` (líneas 75–85):

```ts
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
```

Cuando la persona vuelve de Ajustes, `AppState` pasa a `'active'` y dispara `recargar()`, que vuelve a consultar el permiso al sistema operativo. En `src/app/permisos/[recurso].tsx` (líneas 59–63), al pasar `estado` a `'concedido'`, se ejecuta `router.back()` automáticamente para dejar visible la cámara en `/escanear`.

**Si esa parte no existiera:** al volver de Ajustes la app seguiría mostrando la pantalla de “Cámara bloqueada / Abrir Ajustes” aunque el permiso ya estuviera concedido, obligando a la persona a cerrar y volver a entrar a la pantalla (o reiniciar la app).

---

### D2. Notificaciones y consistencia

#### a) Activar “Recordarme” y devolver antes de los 15 segundos

Si no canceláramos la notificación programada, a los 15 segundos el sistema operativo dispararía igualmente el recordatorio pidiendo devolver un libro que la persona **ya devolvió**, rompiendo la confianza en la app. En nuestro código (`src/context/BibliotecaContext.tsx`, líneas 240–248), `devolverLibro` verifica `if (prestamo?.notificacionId)` y llama a `await cancelarNotificacion(prestamo.notificacionId)` antes de eliminar el préstamo.

#### b) Dónde se guarda el identificador y qué pasa si la app se cierra

En nuestra app, el `notificacionId` se guarda dentro del objeto `Prestamo` en `BibliotecaContext` (`src/context/BibliotecaContext.tsx`, línea 264) **y se persiste en `AsyncStorage`** mediante `guardarEstado` (`src/context/BibliotecaContext.tsx`, líneas 121–132, y `src/lib/almacenamiento.ts`).

- **Qué pasa si la app se cierra antes de los 15 segundos:** la notificación ya fue agendada en el sistema operativo, por lo que **se dispara igualmente** aunque la app esté cerrada.
- **El problema si solo viviera en memoria (`useState`):** al reabrir la app antes de que se dispare, el estado en memoria se perdería junto con el `notificacionId`, por lo que la app ya no podría cancelarla si la persona devuelve el libro o apaga el interruptor.
- **Cómo se resolvió:** persistiendo `prestamos` (incluyendo `notificacionId`) en `AsyncStorage` y rehidratándolo antes de mostrar la interfaz (`hidratado` en `NavegadorRaiz.tsx`, líneas 12–14).

#### c) Canal de notificaciones en Android 13+ vs Android 12

- **Android 13 (API 33) o superior:** introdujo el permiso en tiempo de ejecución `POST_NOTIFICATIONS`. En Android 13+, el sistema solo muestra el diálogo de permiso si la app tiene al menos un canal de notificación creado; además, crear el canal `"prestamos"` antes de pedir el permiso garantiza que el canal exista configurado con `AndroidImportance.HIGH` en cuanto se conceda. En `src/lib/notificaciones.ts` (líneas 42–45), `solicitarPermisoNotificaciones()` llama primero a `await asegurarCanalPrestamos()` y recién después a `requestPermissionsAsync()`.
- **Android 12 (API 32) o inferior:** las notificaciones están permitidas por defecto al instalar la app (no existe el diálogo `POST_NOTIFICATIONS`), por lo que `requestPermissionsAsync()` resuelve como concedido sin mostrar popup; el canal `"prestamos"` sigue siendo necesario igualmente (desde Android 8 / API 26) para que el sistema muestre las notificaciones con prioridad alta.

#### d) Entrega desde el mostrador con permiso denegado

Cuando el personal toca “Entregar al siguiente” y la persona del frente es el alumno actual (`ALUMNO_ACTUAL`), `entregarAlSiguiente` (`src/context/BibliotecaContext.tsx`, líneas 346–357) llama a `enviarNotificacionEntrega(libro.titulo)` (`src/lib/notificaciones.ts`, líneas 75–92):

```ts
// src/lib/notificaciones.ts (líneas 75-92)
export async function enviarNotificacionEntrega(
  tituloLibro: string,
): Promise<boolean> {
  const estadoPermiso = await getPermissionsAsync();
  if (!estadoPermiso.granted) {
    return false;
  }
  await asegurarCanalPrestamos();
  await scheduleNotificationAsync({ ... });
  return true;
}

// src/context/BibliotecaContext.tsx (líneas 346-357)
const notificadoPorSistema = await enviarNotificacionEntrega(libro.titulo);
if (!notificadoPorSistema) {
  const nuevoAviso: AvisoInterno = {
    id: `${isbn}-${Date.now()}`,
    titulo: '¡Libro listo para retirar!',
    mensaje: `Se te asignó "${libro.titulo}" desde la lista de espera. Pasá por el mostrador a retirarlo.`,
    fecha: hoy.toISOString(),
  };
  setAvisos((actuales) => [nuevoAviso, ...actuales]);
}
```

- **Cómo te enterás si el permiso está denegado:** `enviarNotificacionEntrega` devuelve `false` y el contexto agrega un `AvisoInterno` que se muestra destacado en la parte superior de la pestaña `/reservas` (`src/app/(tabs)/reservas.tsx`, líneas 122–144).
- **¿Consulta el permiso en ese momento o usa un valor guardado?** Lo **consulta al sistema operativo en ese mismo momento** con `await getPermissionsAsync()`. Esto es fundamental porque el usuario pudo haber revocado o habilitado las notificaciones en Ajustes en cualquier instante: confiar en un booleano guardado en memoria podría intentar enviar una notificación silenciada sin crear el aviso interno, dejando al alumno sin enterarse.

---

### D3. Lo que tu app pide y lo que no

| Plataforma | Permiso o clave declarada | Función de la app que lo justifica | ¿Quién lo agrega? |
| :--- | :--- | :--- | :--- |
| **iOS** | `NSCameraUsageDescription` | Escanear el código de barras EAN-13 de la contratapa de los libros en `/escanear`. | Plugin `expo-camera` (y `ios.infoPlist`) en `app.json`. |
| **Android** | `android.permission.CAMERA` | Escanear el código de barras EAN-13 en `/escanear`. | Plugin `expo-camera` en `app.json`. |
| **Android (13+)** | `android.permission.POST_NOTIFICATIONS` | Mostrar recordatorios locales de devolución y avisos de entrega en mostrador. | Plugin `expo-notifications` en `app.json`. |
| **Android** | `blockedPermissions` (`RECORD_AUDIO`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`) | Principio de mínimo privilegio: bloquea permisos no utilizados por la app. | Configuración explícita `expo.android.blockedPermissions` en `app.json`. |

#### a) Por qué la app no declara `RECORD_AUDIO` aunque usa `expo-camera`

Porque en `app.json` (líneas 45–53) se desactivó explícitamente el micrófono en el plugin de `expo-camera` y además se bloqueó `android.permission.RECORD_AUDIO` en `android.blockedPermissions` (línea 24):

```json
[
  "expo-camera",
  {
    "cameraPermission": "Usamos tu cámara para escanear el código de barras de los libros y abrir su ficha al instante.",
    "microphonePermission": false,
    "recordAudioAndroid": false
  }
]
```

#### b) “Elegir una foto de portada desde la galería”: paquete, permiso y OTA vs build nueva

- **Paquete:** `expo-image-picker` (instalado con `npx expo install expo-image-picker`).
- **Permiso necesario:** en Android moderno (Android 13+ / Photo Picker del sistema) y en iOS (PHPickerViewController), elegir una foto puntual con `launchImageLibraryAsync` **no requiere pedir permiso amplio de galería** al usuario porque el selector del sistema solo entrega la imagen elegida; en versiones antiguas de Android o si se accede a la biblioteca completa, el plugin configura `NSPhotoLibraryUsageDescription` / permisos de lectura de medios.
- **¿OTA o build nueva?** Hace falta una **build nativa nueva** (development build / EAS Build), **no alcanza con una actualización OTA (`eas update`)**, porque `expo-image-picker` incorpora código nativo (Swift/Kotlin) y configuración de config plugin que no existen en el binario compilado previamente.

#### c) Qué no se puede verificar del todo en Expo Go y cómo verificarlo

En **Expo Go** la app corre dentro del binario genérico de Expo Go, cuyo `Info.plist` y `AndroidManifest.xml` ya están precompilados:
1. **El texto de propósito personalizado (`NSCameraUsageDescription`) en iOS:** Expo Go muestra su propio texto genérico de cámara, no el definido en nuestro `app.json`.
2. **`blockedPermissions` y el `AndroidManifest.xml` final:** Expo Go declara los permisos de todos los módulos que trae embebidos (ubicación, audio, etc.).
3. **El `scheme: "bibliotecaipf"` nativo y ciertos comportamientos de notificaciones en Android 13+/iOS (ícono/nombre de la app y canal por defecto del plugin):** en Expo Go los deep links usan `exp://IP:8081/--/...` en lugar de `bibliotecaipf://`.

**Cómo verificarlo:** generando una **development build** propia (`npx expo run:android` / `npx expo run:ios` o `npx eas-cli@latest build --profile development`), donde Continuous Native Generation (CNG) aplica todos los plugins de `app.json` y genera el binario nativo real de Biblioteca IPF.

---

## Parte E · Buenas prácticas y decisiones de diseño

### E1. Revisión de código

#### a) Al menos ocho problemas encontrados en el fragmento del compañero

1. **Líneas 18–20 (`useEffect` sin array de dependencias) — Error de ejecución / Rendimiento crítico:** al omitir el segundo argumento, el efecto corre en **cada render**, llamando a `obtenerLibros()` y luego a `setLibros(datos)` con un array nuevo cada vez, generando un **bucle infinito** de pedidos y renders. **Corrección:** usar `useLibros()` con array de dependencias `[intento]` y limpieza `cancelado`.
2. **Líneas 13–16 (pedir permisos de cámara y notificaciones al abrir la app) — Mala práctica grave:** pide ambos permisos sin contexto, sin pantalla previa y sin que la persona haya tocado “Escanear” ni activado un recordatorio. **Corrección:** pedir cámara solo al entrar a `/escanear` (previo `/permisos/camara`) y notificaciones solo al activar “Recordarme” en `/reservas`.
3. **Línea 19 (promesa sin `.catch()` ni limpieza) — Error de ejecución:** `obtenerLibros()` falla 1 de cada 5 veces; al no manejar el rechazo se produce una *Unhandled Promise Rejection*, y al no tener cleanup puede actualizar estado si el componente se desmonta. **Corrección:** `try/catch`, estado de `error` con botón “Reintentar” y bandera `cancelado`.
4. **Líneas 10 y 22 (uso de `any`) — Mala práctica (TypeScript):** `useState<any[]>([])` y `{ libro: any }` anulan el chequeo de tipos. **Corrección:** tipar con `Libro` (`src/types/index.ts`).
5. **Línea 22 (componente `Fila` declarado dentro de `Catalogo`) — Rendimiento / Mala práctica:** en cada render de `Catalogo` se crea una nueva referencia de función `Fila`, haciendo que React desmonte y remonte todas las filas perdiendo su estado interno. **Corrección:** extraer `TarjetaLibro` a nivel de módulo en `src/components/TarjetaLibro.tsx`.
6. **Líneas 33–36 (`ScrollView` + `.map` con `key={i}`) — Rendimiento y advertencia:** no virtualiza la lista y usa el índice del array como `key`, lo que rompe la reconciliación si cambia el orden o se filtran libros. **Corrección:** usar `FlatList` con `keyExtractor={(item) => item.isbn}` y `ListEmptyComponent`.
7. **Línea 25 (estilos en línea con colores y tamaños fijos) — Mala práctica:** `style={{ fontSize: 16, color: '#333', padding: 12 }}` crea objetos nuevos en cada render y no respeta `tema.ts` ni modo oscuro. **Corrección:** `StyleSheet.create` usando constantes de `src/constants/tema.ts`.
8. **Líneas 24 y 37–39 (accesibilidad ausente y área táctil insuficiente) — Mala práctica / Accesibilidad:** los `Pressable` no tienen `accessibilityRole="button"`, el botón de cámara solo tiene un ícono de `28×28` (menor al mínimo de `44×44`) y carece de `accessibilityLabel`. **Corrección:** usar `BotonAccion` y `TarjetaLibro` con `accessibilityRole="button"`, `accessibilityLabel` y `minHeight: 44, minWidth: 44`.
9. **Línea 11 (`permiso` declarado y nunca usado) — Advertencia de lint:** variable sin usar que falla `npx expo lint`, además de omitir estados de carga, error y vacío en la pantalla.

#### b) Qué pasa durante el primer minuto con el efecto sin dependencias (líneas 18–20)

1. `t = 0 s`: monta `Catalogo` → corre el efecto → llama a `obtenerLibros()`.
2. `t = 0.8 s`: `obtenerLibros()` devuelve un **array nuevo** (`LIBROS.map(...)`) → `setLibros(datos)` detecta una nueva referencia → dispara Render 2.
3. Render 2 vuelve a ejecutar el efecto sin dependencias → lanza otro `obtenerLibros()`.
4. Este ciclo se repite cada ~0.8 s (salvo cuando cae en el 20% de error y lanza una *Unhandled Promise Rejection*, momento en que si no detiene la app, corta la cadena o el siguiente render la reinicia). Durante el primer minuto se acumulan decenas de pedidos innecesarios, consumo de batería/red y múltiples rechazos sin capturar.
5. **¿Cambiaría algo si `obtenerLibros()` devolviera siempre exactamente la misma referencia de array?** Sí: después del primer `setLibros(mismoArray)`, en el segundo ciclo `Object.is(estadoAnterior, mismoArray)` daría **`true`**, por lo que React haría *bailout* (no re-renderizaría) y el bucle infinito se detendría tras dos pedidos. Sin embargo, seguiría siendo un bug: cualquier otro re-render del componente volvería a disparar `obtenerLibros()`.

#### c) Pantalla reescrita con nuestros hooks, componentes y constantes

```tsx
import { router, Stack } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { BotonAccion } from '../../../components/BotonAccion';
import { EnlacePersonalHeader } from '../../../components/EnlacePersonalHeader';
import { EstadoCarga } from '../../../components/EstadoCarga';
import { EstadoError } from '../../../components/EstadoError';
import { EstadoVacio } from '../../../components/EstadoVacio';
import { SeccionRecientes } from '../../../components/SeccionRecientes';
import { TarjetaLibro } from '../../../components/TarjetaLibro';
import { ESPACIADO, type PaletaColores } from '../../../constants/tema';
import { useBiblioteca } from '../../../context/BibliotecaContext';
import { useLibros } from '../../../hooks/useLibros';
import { useTema } from '../../../hooks/useTema';
import type { Libro } from '../../../types';

export default function PantallaCatalogo() {
  const { libros, cargando, error, reintentar } = useLibros();
  const { recientes, obtenerEjemplaresDisponibles, obtenerCantidadEnEspera } =
    useBiblioteca();
  const { colores } = useTema();
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  const abrirDetalle = useCallback((isbn: string) => {
    router.push({ pathname: '/libro/[isbn]', params: { isbn } });
  }, []);

  if (cargando) return <EstadoCarga mensaje="Cargando catálogo…" />;
  if (error) return <EstadoError mensaje={error} onAccion={reintentar} />;

  return (
    <View style={estilos.contenedor}>
      <Stack.Screen
        options={{
          title: 'Biblioteca IPF',
          headerRight: () => <EnlacePersonalHeader />,
        }}
      />
      <FlatList
        data={libros}
        keyExtractor={(item: Libro) => item.isbn}
        ListHeaderComponent={
          <View style={estilos.encabezado}>
            <BotonAccion
              etiqueta="Escanear"
              icono="barcode-outline"
              onPress={() => router.push('/escanear')}
            />
            <SeccionRecientes recientes={recientes} onAbrirLibro={abrirDetalle} />
          </View>
        }
        renderItem={({ item }) => (
          <TarjetaLibro
            libro={item}
            ejemplaresDisponibles={obtenerEjemplaresDisponibles(item)}
            cantidadEnEspera={obtenerCantidadEnEspera(item.isbn)}
            onPress={abrirDetalle}
          />
        )}
        ListEmptyComponent={<EstadoVacio titulo="El catálogo está vacío" />}
      />
    </View>
  );
}

function crearEstilos(colores: PaletaColores) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: colores.fondo },
    encabezado: { padding: ESPACIADO.lg, gap: ESPACIADO.md },
  });
}
```

#### d) Qué provocaría rechazo en tiendas y qué haría desinstalar la app primero

- **Rechazo en tiendas (especialmente App Store Review Guidelines 5.1.1):** pedir permisos de cámara y notificaciones apenas arranca la app sin contexto ni justificación (líneas 13–16), sumado a posibles fallas no manejadas que cierran la app. Apple rechaza apps que solicitan permisos sin relación directa con una acción iniciada por el usuario.
- **Desinstalación inmediata por el usuario:** el bucle infinito de pedidos cada 800 ms (líneas 18–20) combinado con el bombardeo de dos popups invasivos de permisos al abrir la app por primera vez y la pantalla en blanco cuando falla la red sin opción de reintentar.

---

### E2. Organización y acoplamiento

#### a) Grafo de dependencias entre carpetas

```text
src/app/         ──► components, context, hooks, lib, constants, types
src/components/  ──► context, hooks, lib, constants, types
src/context/     ──► estructuras, lib, data (solo LISTAS_ESPERA_INICIALES), constants, types
src/hooks/       ──► lib, constants, types
src/lib/         ──► data (LIBROS), constants, types
src/data/        ──► types
src/estructuras/ ──► (sin dependencias internas — 100% independientes)
src/constants/   ──► (sin dependencias internas)
src/types/       ──► (sin dependencias internas)
```

- **¿Hay alguna importación “hacia arriba”?** **No.** Ningún archivo de `components`, `hooks`, `lib`, `context`, `estructuras`, `data`, `types` o `constants` importa nada desde `src/app/`.
- **Por qué sería un problema:** crearía dependencias circulares con Expo Router (que registra las rutas desde `src/app/`), acoplaría la lógica reutilizable a pantallas concretas e impediría probar hooks o estructuras de forma aislada.

#### b) Si el catálogo pasara a venir de una API real

Cambiarían solo **2 archivos** de la capa de datos/acceso:
1. `src/lib/api.ts`: reemplazar los `esperar()` y el filtrado sobre `LIBROS` por llamadas `fetch(...)` reales contra el backend.
2. `src/lib/validacion.ts` (o reemplazar `buscarLibroPorIsbn`/`obtenerCatalogoBase` por el endpoint de detalle/listado en `api.ts`).

Si hubiera que tocar más de dos archivos (por ejemplo, editar pantallas en `src/app/` o componentes en `src/components/`), sería señal de **alto acoplamiento**: significaría que las pantallas acceden directamente a los datos crudos en lugar de depender de una abstracción en `src/lib/` y `src/hooks/`.

#### c) ¿Conviene reemplazar `usePermiso` y `/permisos/[recurso]` por `<ConPermiso recurso="camara">…</ConPermiso>`?

- **Qué ganarías:** menos código repetido en pantallas cuya UI principal depende 100% de un permiso (como la cámara en `/escanear`), declarando el control de acceso de forma declarativa en el JSX.
- **Qué perderías:** control fino sobre la interfaz alternativa (por ejemplo, en `/escanear` queremos mostrar siempre `<IngresoManualIsbn />` debajo del estado de permiso, y además necesitamos una ruta modal propia `/permisos/[recurso]` navegable y testeable por deep link).
- **¿Serviría para notificaciones?** **No.** Las notificaciones en Biblioteca IPF no bloquean una pantalla sino que se piden **en respuesta a una acción puntual** (activar el interruptor “Recordarme” dentro de una tarjeta en `/reservas`, `src/app/(tabs)/reservas.tsx`, líneas 63–89). Un wrapper `<ConPermiso>` que envuelva la pantalla rompería la consigna de pedir el permiso únicamente al activar el interruptor y ocultaría los préstamos si el permiso fuera denegado.

---

### E3. Mapa de fallas

| Situación | Qué ve la persona | Dónde se maneja (archivo y línea) |
| :--- | :--- | :--- |
| `obtenerLibros()` falla | Pantalla de error amigable (“No pudimos conectarnos con el catálogo de la biblioteca. Intentá nuevamente.”) con botón **“Reintentar”**. | `src/hooks/useLibros.ts` (líneas 30–36) y `src/app/(tabs)/(catalogo)/index.tsx` (líneas 81–82). |
| Se abre `/libro/abc` | Header “Libro no encontrado”, mensaje explicando que `"abc"` no tiene formato ISBN-13 de 13 dígitos y botón **“Volver al Catálogo”**. | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (líneas 20–23 y 40–58). |
| Se escanea un ISBN que no está en el catálogo | Banner de advertencia indicando que el ISBN no está en el catálogo de Biblioteca IPF, dejando la cámara activa para seguir escaneando o escribir a mano. | `src/app/escanear.tsx` (líneas 65–74 y 155–164). |
| La cámara está bloqueada | Modal `/permisos/camara` con botón **“Abrir Ajustes”**; en `/escanear`, tarjeta “Cámara bloqueada” con botón “Abrir Ajustes” y el formulario de ingreso manual de ISBN siempre usable. | `src/hooks/usePermiso.ts` (líneas 31–36), `src/app/permisos/[recurso].tsx` (líneas 82–113) y `src/app/escanear.tsx` (líneas 137–152 y 166). |
| Las notificaciones están denegadas | En `/reservas`, barra indicando que las notificaciones están bloqueadas; si activa “Recordarme”, modal con “Abrir Ajustes” + mensaje explicativo; si le entregan un libro desde mostrador, aparece un **aviso destacado dentro de `/reservas`**. | `src/app/(tabs)/reservas.tsx` (líneas 74–86 y 122–144), `src/lib/notificaciones.ts` (líneas 78–81) y `src/context/BibliotecaContext.tsx` (líneas 346–357). |
| Se intenta reservar un libro ya reservado | En `/libro/[isbn]`, botón deshabilitado “Ya reservado” con aviso del estado actual; si entra igual a `/reservar/[isbn]`, advertencia clara sin botón “Confirmar”; y `reservarLibro` devuelve `{ tipo: 'duplicado' }`. | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (líneas 119–144), `src/app/reservar/[isbn].tsx` (líneas 85–91) y `src/context/BibliotecaContext.tsx` (líneas 201–206). |
| “Entregar al siguiente” con la lista de espera vacía | Los libros con cola vacía no aparecen pendientes y el botón se deshabilita si `cantidad === 0`; además `entregarAlSiguiente` valida `colaActual.estaVacia()` y retorna `{ entregadoA: null }` sin fallar. | `src/app/mostrador.tsx` (líneas 35–42 y 85–91) y `src/context/BibliotecaContext.tsx` (líneas 292–299). |
| Login con clave incorrecta | Caja de error clara en rojo (“Usuario o clave incorrectos. Revisá los datos e intentá de nuevo.”) sin cerrar el modal y limpiando el error al volver a escribir. | `src/app/login.tsx` (líneas 39–43 y 111–115) y `src/context/BibliotecaContext.tsx` (líneas 379–387). |

---

### E4. Decisiones con argumentos

#### a) Identificador: ¿ISBN o id numérico propio?

- **Postura:** en esta app usamos **ISBN-13** porque es un requisito de las rutas (`/libro/[isbn]`, `/reservar/[isbn]`), coincide de forma natural con el código de barras EAN-13 de la contratapa y evita convertir tipos al leer `useLocalSearchParams()` (que siempre devuelve `string | string[]`, evitando errores de `NaN` al parsear números como vimos en el TP 2). Además, cada edición distinta tiene su propio ISBN-13, por lo que dos ediciones del mismo título se diferencian sin ambigüedad.
- **Limitación real en una biblioteca completa:** una biblioteca real también tiene apuntes de cátedra, tesis, revistas o libros antiguos **sin ISBN**. Para un sistema en producción convendría usar un **ID interno propio (UUID o string opaco)** como clave primaria y parámetro de ruta, manteniendo el `isbn` como un campo indexado opcional para las búsquedas por escáner.

#### b) Estructuras: ¿Clase `Pila` con `#items` o array en estado con `[...pila, x]` y `slice`?

- **Qué nos dio la clase `Pila` (`src/estructuras/Pila.ts`):** encapsulación real mediante el campo privado `#items` (nadie fuera de la clase puede hacer `splice` o mutar índices arbitrarios), una API semántica de dominio (`push`, `pop`, `verTope`, `tamanio`, `aArray`) y código fácilmente testeable de forma unitaria (`src/estructuras/__tests__/estructuras.test.ts`).
- **Qué complicó al combinarla con React:** React detecta cambios por identidad de referencia (`Object.is`), mientras que las clases con métodos mutables (`push`, `encolar`) modifican la instancia en el lugar. Eso nos obligó a agregar `clonar()` y reemplazar la instancia completa en cada `setState` (y serializar con `aArray()` para `AsyncStorage`). En una app real fuera del contexto pedagógico de estructuras de datos, un array inmutable con `[...pila, libro]` y `slice(-3)` sería más idiomático para React; en cambio, para la `Cola` sí conviene encapsularla para garantizar `desencolar()` en $O(1)$ sin `Array.prototype.shift()`.

#### c) Memorización: ¿dónde aporta `useMemo`/`useCallback` y dónde sería ruido?

- **Dónde aporta en nuestra app:**
  1. En `src/context/BibliotecaContext.tsx` (líneas 392–438): memorizar el objeto `valor` del `Provider` con `useMemo` (y sus acciones con `useCallback`) evita que todos los consumidores se re-rendericen si `BibliotecaProvider` re-renderiza por una causa externa sin haber cambiado el estado interno.
  2. En `crearEstilos(colores)` con `useMemo(() => crearEstilos(colores), [colores])` en las pantallas y componentes: evita recrear todo el `StyleSheet` en cada render cuando no cambió el modo claro/oscuro.
  3. En `renderizarLibro` y `abrirDetalle` pasados a `FlatList` (`src/app/(tabs)/(catalogo)/index.tsx`, líneas 31–44).
- **Dónde sería ruido:** en cálculos triviales de costo $O(1)$ sobre primitivos, como `const hayDisponibles = ejemplaresDisponibles > 0` (`src/components/TarjetaLibro.tsx`, línea 31) o `const isbnNormalizado = isbn.trim()`, donde el costo de memorizar y comparar dependencias supera al cálculo mismo. Además, con `reactCompiler: true` activo en `app.json`, el compilador ya optimiza automáticamente muchos de estos casos.
- **Cómo comprobarlo en lugar de suponerlo:** usando **React DevTools Profiler** (con la opción *Highlight updates when components render* y midiendo *commit duration* y motivos de re-render antes y después de memorizar).

#### d) Datos duplicados: “ejemplares disponibles”

En nuestra app **no guardamos “ejemplares disponibles” en el estado: lo calculamos** en `obtenerEjemplaresDisponibles(libro)` (`src/context/BibliotecaContext.tsx`, líneas 138–144):

```ts
const obtenerEjemplaresDisponibles = useCallback(
  (libro: Libro): number => {
    const prestados = prestamos.filter((p) => p.isbn === libro.isbn).length;
    return Math.max(0, libro.ejemplares - prestados);
  },
  [prestamos],
);
```

- **El error que aparece cuando el dato vive en dos lugares:** si guardáramos un mapa `disponiblesPorIsbn` aparte del array `prestamos`, cualquier camino de código que agregue o quite un préstamo (reservar, devolver, entregar desde mostrador, hidratar desde `AsyncStorage`) y olvide actualizar el contador dejaría la app en un estado inconsistente (por ejemplo, mostrando “0 disponibles” cuando ya devolviste el libro, o permitiendo prestar más ejemplares de los que existen).
- **Cómo lo evita nuestro diseño:** existe una única fuente de verdad (`libro.ejemplares` como stock base del estante y `prestamos` como préstamos activos). Al derivar los disponibles al vuelo, cualquier alta, devolución o carga desde `AsyncStorage` mantiene el número siempre exacto de forma automática.
