-- ══════════════════════════════════════════════════════════════════
--  El Cerebro — Políticas RLS (un solo usuario: cada quien ve lo suyo)
--  Ejecutar DESPUÉS de schema.sql. Cada tabla con user_id: propio.
-- ══════════════════════════════════════════════════════════════════

-- Tablas con columna user_id → política "propio" (user_id = auth.uid())
do $$
declare
  t text;
  tablas text[] := array[
    'nodos','conexiones','unidades_negocio','ingresos','egresos',
    'deudas','metas','proyecciones','semanas','tareas','reuniones'
  ];
begin
  foreach t in array tablas loop
    execute format('drop policy if exists "propio" on %I;', t);
    execute format(
      'create policy "propio" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid());',
      t
    );
  end loop;
end$$;

-- profile: la fila es el propio usuario (id = auth.uid())
drop policy if exists "propio" on profile;
create policy "propio" on profile for all
  using (id = auth.uid()) with check (id = auth.uid());

-- deuda_movimientos: sin user_id propio → se filtra por la deuda dueña.
drop policy if exists "propio" on deuda_movimientos;
create policy "propio" on deuda_movimientos for all
  using (exists (select 1 from deudas d where d.id = deuda_id and d.user_id = auth.uid()))
  with check (exists (select 1 from deudas d where d.id = deuda_id and d.user_id = auth.uid()));
