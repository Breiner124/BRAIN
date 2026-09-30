-- ══════════════════════════════════════════════════════════════════
--  El Cerebro — Nodo TESTEOS (tablas + nodo del grafo)
--  Correr en Supabase → SQL Editor (una sola vez).
-- ══════════════════════════════════════════════════════════════════

-- ── Tablas ─────────────────────────────────────────────────────────
create table if not exists testeos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  producto text,
  hipotesis text,
  fecha_testeo date,
  estado text default 'planificado',  -- 'planificado'|'en_curso'|'hecho'|'descartado'
  prioridad int default 3,
  presupuesto numeric,
  notas text,      -- preparación / checklist
  resultado text,  -- qué pasó / feedback de mentores
  created_at timestamptz default now()
);

create table if not exists notas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  fecha date default current_date,
  categoria text default 'general', -- 'mentoria'|'tarea'|'idea'|'general'
  contenido text,
  fuente text,      -- quién lo dijo (mentor, cliente…)
  hecha boolean default false, -- para tareas fundamentales
  created_at timestamptz default now()
);

-- ── RLS + políticas ────────────────────────────────────────────────
alter table testeos enable row level security;
alter table notas   enable row level security;

drop policy if exists "propio" on testeos;
create policy "propio" on testeos for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "propio" on notas;
create policy "propio" on notas for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Nodo del grafo + conexión al central ───────────────────────────
do $$
declare uid uuid; n_central uuid; n_testeos uuid;
begin
  select user_id, id into uid, n_central from nodos where tipo = 'central' limit 1;
  if uid is null then
    raise exception 'No se encontró el nodo central. Corre primero el seed principal.';
  end if;

  -- evita duplicar si ya existe
  if exists (select 1 from nodos where user_id = uid and tipo = 'testeos') then
    raise notice 'El nodo Testeos ya existe ✔';
    return;
  end if;

  insert into nodos (user_id, tipo, titulo, resumen, posicion_x, posicion_y, color, icono, orden)
  values (uid, 'testeos', 'Testeos', 'Programación de testeos + notas', 0.5, 0.9, 'testeos', 'flask', 6)
  returning id into n_testeos;

  insert into conexiones (user_id, origen_id, destino_id, tipo_flujo, activa) values
    (uid, n_central, n_testeos, 'informativo', true),
    (uid, n_testeos, (select id from nodos where user_id = uid and tipo = 'proyecciones' limit 1), 'tarea', true);

  raise notice 'Nodo Testeos creado ✔';
end$$;
