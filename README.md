# 🧠 El Cerebro — Bran

Plataforma personal de vida, finanzas, proyecciones y ganancias, visualizada como una
**red neuronal**. Un solo usuario (Bran), privado. Español (Colombia), moneda **COP**.

> Construido a partir de `CEREBRO_Bran_Blueprint.md` (v2.0). Este README y el
> `CHANGELOG.md` se mantienen al día por fase.

---

## ✅ Estado — Fases 1 y 2 completas

| Módulo | Estado |
|---|---|
| Grafo neuronal (home) con nodos + **sinapsis con pulso animado** + peek panels | ✅ |
| Nodo **Ganancias**: alta rápida + bandeja unificada + cruce + óptimos + excedente | ✅ |
| Nodo **Deudas**: abonar / pagar en totalidad, ordenadas por importancia | ✅ |
| Nodo **Metas**: barras de progreso + aportar + "cuánto apartar/mes" | ✅ |
| Nodo **Proyecciones Personales**: crear + barra de avance + aportar | ✅ |
| Nodo **Proyección Empresarial**: Consultoría + E-com con **flujo bidireccional** | ✅ |
| Escenarios §9 (ScenarioSlider) + ROI de expansión §6.7 | ✅ |
| Nodo **Yo** completo: semana por ámbito + arrastre de tareas + reuniones | ✅ |
| **Motor Financiero** (§6.2–6.8) puro + **26 tests Vitest** | ✅ |
| API route handlers (§11) | ✅ |
| Esquema Supabase (`/db/schema.sql`) + seed (`/db/seed.sql`) | ✅ |

**Fase 3** (siguiente): integración Calendly (webhooks §14), Google Calendar opcional,
reportes/exportables, notificaciones y refinamiento visual.

---

## 🚀 Arrancar en local

```bash
npm install
npm run dev        # http://localhost:3000
```

La app arranca en **modo demo**: los datos semilla (§10) viven en memoria y todo
funciona sin configurar nada. Registra ingresos, abona deudas y aporta a metas para ver
el motor recalcular en vivo.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Corre los tests del motor (Vitest) |
| `npm run typecheck` | Chequeo de tipos |
| `npm run lint` | ESLint |

---

## 🧩 Arquitectura

- **Next.js 14 (App Router)** desplegable en **Vercel**.
- **React Flow (`@xyflow/react`)** para el grafo neuronal.
- **Tailwind CSS** (tema oscuro neuronal, tokens en `:root`).
- **Framer Motion** para pulsos y transiciones.
- **Zod** para validar la API. **Vitest** para el motor.
- **Motor financiero** en `/lib/engine`: funciones **puras y deterministas**
  (reciben `hoy`, nada de fecha global; nada de números "quemados" — todo lee de config).

```
/app
  /(auth)/login          → placeholder de login (Supabase Auth en Fase 1→persistencia)
  /page.tsx              → grafo neuronal (home)
  /nodo/ganancias · /nodo/deudas · /nodo/metas · /nodo/yo
  /nodo/proyecciones · /personales · /empresarial · /empresarial/{consultoria,ecom}
  /api/...               → route handlers (§11)
/components/graph        → NeuralGraph, NodeCard, SynapseEdge, PeekPanel
/components/finance      → ProgressBar, DebtCard, MetaCard, IncomeQuickAdd, ScenarioSlider…
/components/yo           → WeekBoard (semana, tareas, reuniones)
/lib/engine              → motor financiero + tests
/lib/data                → store en memoria (demo) + repositorio de dominio
/lib/supabase            → clientes (para persistencia real)
/lib/summary.ts          → resumen del nodo central (§5.1)
/db/schema.sql · /db/seed.sql
```

---

## 🔌 Conectar Supabase (persistencia real entre dispositivos)

En Fase 1 la app usa un **store en memoria** (se reinicia en cada cold start de Vercel).
Para persistir de verdad:

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta `/db/schema.sql`.
3. Ejecuta `/db/seed.sql` reemplazando `:user_id` por tu uuid de `auth.users`.
   (Las conexiones del grafo referencian los `id` de `nodos` generados — créalas después
   de insertar los nodos.)
4. Copia `.env.example` a `.env.local` y llena:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_DATA_SOURCE=supabase
   ```
5. El repositorio (`/lib/data/repository.ts`) es la **única puerta a los datos**: ahí se
   cambia la implementación del store en memoria por consultas Supabase, sin tocar la UI
   ni las rutas. Los clientes ya están listos en `/lib/supabase`.

### Deploy en Vercel

1. Conecta el repo de GitHub en Vercel.
2. Agrega las mismas variables de entorno en el proyecto de Vercel.
3. Deploy automático en cada push.

---

## ⚙️ Reglas del motor (todas editables, nada quemado)

- **Margen neto al bolsillo:** 15% (en `profile.margen_neto_bolsillo`).
- **Escenarios de facturación** (§9): conservador $80M · medio $115M · optimista $150M ·
  stretch $200M.
- **Semáforo maestro** (§6.6): 🟢 cubre proyecciones y metas · 🟡 solo proyecciones ·
  🔴 no cubre proyecciones.
- **Reparto de excedente** (§6.8): 40% ahorro · 30% inversión · 20% metas · 10% gusto.

Todos estos valores son *semillas* editables desde `EngineConfig` / `profile`.

---

## 🌱 Datos semilla (§10)

- **Deuda:** Computador $150.000 (crédito fijo, importancia 3).
- **Metas:** BMW M340i $185M (variable) · Viaje China $30M (2027-04-25) ·
  Navidad 2026 $6M (2026-12-24).
- **Proyecciones empresariales:** Facturación esperada E-com ($115M, escenarios) ·
  Contratar logística ($2M/mes, ROI ≥ $13.333.333/mes de facturación).
