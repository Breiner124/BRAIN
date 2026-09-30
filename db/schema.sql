-- ══════════════════════════════════════════════════════════════════
--  El Cerebro — Esquema Supabase (Postgres)  ·  §4 del blueprint
--  Montos en numeric (COP). Fechas timestamptz/date. Todo cuelga de user_id.
--  Ejecutar en Supabase → SQL Editor. Habilita RLS (un solo usuario: Bran).
-- ══════════════════════════════════════════════════════════════════

-- ── 4.1 Núcleo: perfil, nodos y sinapsis ──────────────────────────
create table if not exists profile (
  id uuid primary key references auth.users,
  nombre text,
  moneda text default 'COP',
  tasa_cambio_usd numeric default 4000,        -- COP por USD, editable
  margen_neto_bolsillo numeric default 0.15,   -- 15% editable
  created_at timestamptz default now()
);

create table if not exists nodos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  parent_id uuid references nodos(id),          -- null = central
  tipo text,     -- 'central'|'yo'|'proyecciones'|'proy_personal'|'proy_empresarial'
                 -- |'unidad_consultoria'|'unidad_ecom'|'metas'|'ganancias'|'deudas'
  titulo text,
  resumen text,
  posicion_x float,
  posicion_y float,
  color text,
  icono text,
  orden int,
  created_at timestamptz default now()
);

create table if not exists conexiones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  origen_id uuid references nodos(id),
  destino_id uuid references nodos(id),
  tipo_flujo text,   -- 'financiero'|'tarea'|'informativo'
  activa boolean default true
);

-- ── 4.2 Unidades de negocio ────────────────────────────────────────
create table if not exists unidades_negocio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  slug text,          -- 'consultoria' | 'ecom'
  nombre text,
  margen_neto numeric,-- editable por unidad (ecom = 0.15; consultoria = null)
  created_at timestamptz default now()
);

-- ── 4.7 Proyecciones (declarada antes por FK desde ingresos) ───────
create table if not exists proyecciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  ambito text,           -- 'personal' | 'empresarial'
  unidad_id uuid references unidades_negocio(id),
  nombre text,
  tipo text,             -- 'ingreso_esperado'|'contratacion'|'inversion'|'expansion'|'personal'
  facturacion_esperada numeric,
  costo_estimado numeric,        -- inversión requerida (una vez)
  costo_recurrente numeric,      -- costo fijo mensual generado (ej: salario)
  objetivo numeric,              -- objetivo de la barra (proyecciones personales)
  avance numeric default 0,      -- avance acumulado (proyecciones personales)
  fecha_objetivo date,
  fecha_tipo text,       -- 'fija'|'variable'
  estado text default 'pendiente', -- 'pendiente'|'en_progreso'|'lograda'
  detalle jsonb,
  created_at timestamptz default now()
);

-- ── 4.3 Ganancias (ingresos) — ruteo bidireccional ────────────────
create table if not exists ingresos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  unidad_id uuid references unidades_negocio(id), -- consultoría | ecom | null(otros)
  fuente text,            -- 'consultoria' | 'ecom' | 'otros'
  descripcion text,
  monto numeric,          -- COP (lo que entra al bolsillo si es_facturacion=false)
  es_facturacion boolean default false, -- true → se le aplica margen de la unidad
  fecha date,
  recurrente boolean default false,
  origen_registro text default 'ganancias', -- 'ganancias'|'proy_consultoria'|'proy_ecom'
  proyeccion_id uuid references proyecciones(id),
  created_at timestamptz default now()
);

-- ── 4.4 Egresos ────────────────────────────────────────────────────
create table if not exists egresos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  unidad_id uuid references unidades_negocio(id),
  categoria text,   -- 'operativo'|'nomina'|'deuda'|'personal'|'inversion'
  descripcion text,
  monto numeric,
  fecha date,
  fijo boolean default false,
  created_at timestamptz default now()
);

-- ── 4.5 Deudas ─────────────────────────────────────────────────────
create table if not exists deudas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  nombre text,
  categoria text,        -- 'tarjeta_credito'|'tercero'|'credito_fijo'|'otro'
  nivel_importancia int, -- 1 = más importante
  monto_original numeric,
  saldo_actual numeric,
  tasa_interes numeric,  -- % mensual, opcional
  fecha_limite date,
  estado text default 'activa', -- 'activa'|'pagada'
  created_at timestamptz default now()
);

create table if not exists deuda_movimientos (
  id uuid primary key default gen_random_uuid(),
  deuda_id uuid references deudas(id),
  tipo text,             -- 'abono'|'pago_total'
  monto numeric,
  fecha date default now()
);

-- ── 4.6 Metas ──────────────────────────────────────────────────────
create table if not exists metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  nombre text,
  categoria text,        -- 'vehiculo'|'viaje'|'festividad'|'otro'
  costo_objetivo numeric,
  ahorrado numeric default 0,
  fecha_objetivo date,
  fecha_tipo text,       -- 'fija'|'variable'
  prioridad int,
  detalle jsonb,
  created_at timestamptz default now()
);

-- ── 4.8 Yo — semanas, tareas, reuniones ───────────────────────────
create table if not exists semanas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  fecha_inicio date,
  fecha_fin date,
  activa boolean default true,
  nota text
);

create table if not exists tareas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  semana_id uuid references semanas(id),
  ambito text,           -- 'consultoria'|'ecom'|'personal'
  titulo text,
  descripcion text,
  estado text default 'pendiente', -- 'pendiente'|'hecha'|'aplazada'
  heredada boolean default false,
  prioridad int,
  vinculo_meta_id uuid references metas(id),
  vinculo_proyeccion_id uuid references proyecciones(id),
  created_at timestamptz default now()
);

create table if not exists reuniones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  ambito text,           -- 'consultoria'|'ecom'
  titulo text,
  con_quien text,
  inicio timestamptz,
  fin timestamptz,
  fuente text default 'manual', -- 'manual'|'calendly'
  calendly_event_id text,
  notas text
);

-- ── Índices útiles ─────────────────────────────────────────────────
create index if not exists idx_ingresos_fecha on ingresos(fecha);
create index if not exists idx_ingresos_fuente on ingresos(fuente);
create index if not exists idx_egresos_fecha on egresos(fecha);
create index if not exists idx_nodos_user on nodos(user_id);
create index if not exists idx_conexiones_user on conexiones(user_id);

-- ── RLS (un solo usuario: cada quien ve solo lo suyo) ──────────────
alter table profile          enable row level security;
alter table nodos            enable row level security;
alter table conexiones       enable row level security;
alter table unidades_negocio enable row level security;
alter table ingresos         enable row level security;
alter table egresos          enable row level security;
alter table deudas           enable row level security;
alter table metas            enable row level security;
alter table proyecciones     enable row level security;
alter table semanas          enable row level security;
alter table tareas           enable row level security;
alter table reuniones        enable row level security;

-- Política genérica user_id = auth.uid() (crea equivalentes por tabla).
-- Ejemplo (repetir por tabla con columna user_id):
--   create policy "propio" on ingresos for all
--     using (user_id = auth.uid()) with check (user_id = auth.uid());
