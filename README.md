# 🧠 El Cerebro — Bran

Plataforma personal de vida, finanzas, proyecciones y ganancias, visualizada como una
**red neuronal**. Un solo usuario (Bran), privado. Español (Colombia), moneda **COP**.

> Construido a partir de `CEREBRO_Bran_Blueprint.md` (v2.0). Este README y el
> `CHANGELOG.md` se mantienen al día por fase.

---

## ✅ Estado — Fases 1, 2 y 3 completas

| Módulo | Estado |
|---|---|
| Grafo neuronal (home) con nodos + **sinapsis con pulso animado** + peek panels | ✅ |
| Nodo **Ganancias**: alta rápida + bandeja unificada + cruce + óptimos + excedente | ✅ |
| Nodo **Deudas**: abonar / pagar en totalidad, ordenadas por importancia | ✅ |
| Nodo **Metas**: barras de progreso + aportar + "cuánto apartar/mes" | ✅ |
| Nodo **Proyecciones Personales + Empresarial** con **flujo bidireccional** | ✅ |
| Nodo **Yo** completo: semana por ámbito + arrastre de tareas + reuniones | ✅ |
| **Reportes**: gráficas (Recharts) + exportables CSV | ✅ |
| **Calendly** (§14): webhook con firma → reuniones | ✅ |
| **Notificaciones** (campana) + toggle de tema claro/oscuro | ✅ |
| **Motor Financiero** (§6.2–6.8) puro + **38 tests Vitest** | ✅ |
| Esquema + políticas + seed Supabase (`/db/*.sql`) | ✅ |

**Pendiente (infra de persistencia):** el swap del repositorio en memoria por consultas
Supabase (ver sección "Conectar Supabase"). La base de datos ya está lista con SQL
turnkey; falta cablear las consultas en `/lib/data`.

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

La app usa hoy un **store en memoria** (se reinicia en cada cold start de Vercel). Estos
pasos dejan tu base de datos 100% lista; el último paso (cablear las consultas) es el
único código pendiente.

**1. Crear el proyecto**
- Entra a [supabase.com](https://supabase.com) → **New project**. Guarda la contraseña.
- Espera a que termine de aprovisionar (~2 min).

**2. Crear las tablas** — en **SQL Editor** pega y corre, en orden:
1. `db/schema.sql` (tablas + índices + RLS activado)
2. `db/policies.sql` (políticas: cada quien ve solo lo suyo)

**3. Crear tu usuario y sembrar datos**
- En **Authentication → Users → Add user**, crea tu usuario (email + contraseña) y copia
  su **UUID**.
- En **SQL Editor**, arriba del `db/seed.sql`, define el uuid y luego corre el archivo:
  ```sql
  \set user_id '«pega-aquí-tu-uuid»'
  ```
  (Si el editor no soporta `\set`, reemplaza a mano `:'user_id'` por `'tu-uuid'`.)
  El seed crea perfil, unidades, nodos, **conexiones**, deudas, metas y proyecciones.

**4. Variables de entorno** — copia `.env.example` a `.env.local` y llena (los valores
están en **Project Settings → API**):
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...        # solo servidor, NUNCA al cliente
NEXT_PUBLIC_DATA_SOURCE=supabase
```

**5. Cablear las consultas (paso de código pendiente)**
El repositorio (`/lib/data/repository.ts`) es la **única puerta a los datos**. Ahí se
cambia el store en memoria por llamadas a Supabase (clientes ya listos en
`/lib/supabase`). Al terminar este paso, toda la app (grafo, ganancias, metas, deudas,
proyecciones, semana) persiste en la nube sin tocar UI ni rutas.

> ¿Quieres que lo haga? Dímelo y lo implemento contra tu instancia para validarlo en vivo.

### Deploy en Vercel
1. Conecta el repo de GitHub en Vercel (**New Project** → importar `Breiner124/BRAIN`).
2. En **Settings → Environment Variables**, agrega las mismas variables del paso 4.
3. Deploy automático en cada push a la rama.

---

## 📅 Conectar Calendly (§14)

1. En Vercel ten tu URL pública (ej. `https://tu-app.vercel.app`).
2. En Calendly (**Integrations → Webhooks**, requiere plan que lo permita), crea una
   suscripción al evento `invitee.created` apuntando a:
   ```
   https://tu-app.vercel.app/api/webhooks/calendly?ambito=consultoria
   ```
   (usa `?ambito=ecom` para reuniones con mentores).
3. Copia la **signing key** que te da Calendly y ponla en el env
   `CALENDLY_WEBHOOK_SIGNING_KEY`. El endpoint entonces **exige firma válida** en cada
   webhook (HMAC-SHA256 + anti-replay). Sin esa variable, acepta sin verificar (solo dev).
4. Cada reunión agendada aparecerá en **Nodo Yo** y se contabiliza en **Reportes**.

> Alternativa por API: `crearSuscripcionWebhook()` en `/lib/calendar/calendly.ts` registra
> el webhook usando `CALENDLY_TOKEN` (córrelo una sola vez).

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
