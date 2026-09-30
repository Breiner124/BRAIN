# Changelog — El Cerebro

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).

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
