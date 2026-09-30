# Changelog — El Cerebro

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).

## [0.3.0] — Fase 3: Integraciones y pulido — 2026-09-30

### Added
- **Calendly (§14) real**: `/api/webhooks/calendly` con **verificación de firma**
  (HMAC-SHA256 + anti-replay) que inserta reuniones `fuente='calendly'` sin duplicar
  (`upsertReunionCalendly`). Módulo `/lib/calendar/calendly.ts` (parseo + helper para
  registrar la suscripción). Tag de ámbito vía `?ambito=consultoria|ecom`.
- **Google Calendar**: stub `/lib/calendar/google.ts` (opcional, marcado como TODO).
- **Reportes** (`/nodo/reportes`): gráficas Recharts (ingresos por fuente y flujo de caja
  a 6 meses), tarjetas de totales y **exportables CSV** (`/api/export/ingresos`,
  `/api/export/egresos`) con BOM UTF-8 para Excel.
- **Notificaciones**: alertas derivadas del estado (`/lib/alertas.ts`,
  `/api/alertas`) — semáforo, deudas por vencer, metas cerca, excedente disponible —
  con **campana en el TopNav** (`AlertsBell`).
- **Toggle de tema** claro/oscuro (`ThemeToggle`) persistido en localStorage.
- **12 tests nuevos** (reportes + firma/parseo Calendly): total **38 tests** en verde.

### Added — Supabase turnkey
- `/db/policies.sql`: políticas RLS por tabla (un solo usuario).
- `/db/seed.sql`: ahora crea también las **conexiones** del grafo automáticamente.
- Variables `CALENDLY_WEBHOOK_SIGNING_KEY` / `CALENDLY_TOKEN` en `.env.example`.

## [0.2.0] — Fase 2: Proyecciones y profundidad — 2026-09-30

### Added
- **Proyección Empresarial** reestructurada en dos unidades con subnodos:
  - `/nodo/proyecciones/empresarial/consultoria`: proyección esperada vs realizado y
    **anexar ganancias** (fuente consultoría → caen en Ganancias como `proy_consultoria`).
  - `/nodo/proyecciones/empresarial/ecom`: **ScenarioSlider** (conservador↔stretch),
    bolsillo al 15%, expansiones con **ROI** (§6.7) y anexar ganancias (`proy_ecom`).
- **Flujo bidireccional de ganancias** completo en UI (§5.3, §11): una sola tabla
  `ingresos`, dos puertas de entrada (Ganancias o Proyección Empresarial).
- **Proyecciones Personales** (`/nodo/proyecciones/personales`): crear proyección con
  objetivo y **barra de avance**, más aportes que la llenan.
- **Nodo Yo completo** (§7): tablero semanal por ámbito (Consultoría / E-com / Personal),
  crear tareas, marcar hechas / aplazar, **"Iniciar nueva semana"** con arrastre de
  pendientes (etiqueta ⏮ Semana pasada), y **reuniones manuales**.
- **Animaciones de sinapsis** (§12): edge custom con un pulso que viaja por las
  conexiones de flujo financiero y de tareas.
- **Formulario de proyecciones** reutilizable (personal / empresarial por tipo).
- Nuevas API: `/api/proyecciones/:id/aportar`, `/api/semanas/nueva`, `/api/tareas`,
  `/api/tareas/:id`, `/api/reuniones`.
- **5 tests nuevos** (arrastre de semana, aporte a proyección, flujo bidireccional):
  total **26 tests** en verde.

### Changed
- Esquema Supabase: columnas `objetivo` y `avance` en `proyecciones`.
- El hub `/nodo/proyecciones` ahora enlaza a Personales y Empresarial.

## [0.1.0] — Fase 1: Fundación — 2026-09-30

### Added
- **Scaffold Next.js 14 (App Router)** + Tailwind + tema oscuro neuronal, listo para Vercel.
- **Grafo neuronal** (React Flow) como home: nodos Central, Yo, Proyecciones, Metas,
  Ganancias, Deudas, con sinapsis animadas y **peek panels** por nodo.
- **Motor Financiero** (`/lib/engine`) con funciones puras (§6.2–6.8):
  cruce ingresos/egresos, proyección de bolsillo, óptimo de proyecciones+deudas,
  óptimo de metas, semáforo maestro, ROI de expansión y recomendador de excedente.
  **21 tests con Vitest** (todos en verde).
- **Nodo Ganancias**: alta rápida de ingreso (selector de fuente/unidad + facturación),
  bandeja unificada con etiqueta de `origen_registro`, panel de cruce, medidor de óptimos
  con semáforo, bolsillo proyectado y recomendador de excedente.
- **Nodo Deudas**: tarjetas ordenadas por importancia con barra de % pagado y acciones
  **Abonar** / **Pagar en totalidad** (crean movimiento + egreso).
- **Nodo Metas**: barras de progreso, aportar, y "cuánto apartar/mes" para llegar a tiempo.
- **Nodo Proyecciones** (base): escenarios de facturación (§9) y ROI de expansión (§6.7).
- **Nodo Yo** (base): estructura de la semana por ámbitos.
- **API route handlers** (§11): `/api/resumen`, `/api/ingresos`, `/api/egresos`,
  `/api/deudas/:id/abonar`, `/api/deudas/:id/pagar-total`, `/api/metas/:id/aportar`,
  `/api/motor/optimos`, `/api/proyecciones` (con ruteo bidireccional).
- **Esquema Supabase** (`/db/schema.sql`) y **seed** (`/db/seed.sql`) según §4 y §10.
- **Store en memoria** sembrado (modo demo) + **repositorio de dominio** como única
  puerta a los datos, para migrar a Supabase sin tocar UI ni rutas.

### Notas
- Modo demo por defecto: datos en memoria, sin necesidad de configurar Supabase.
- Todos los montos y reglas son editables (nada quemado); los valores son semillas.

### Próximo — Fase 2
- Flujo bidireccional de ganancias completo en UI (anexar desde Consultoría / E-com).
- Proyecciones Personales con barras.
- Semana del Nodo Yo con "iniciar nueva semana" y arrastre de tareas.
- Animaciones de sinapsis que pulsan según el flujo de datos.
