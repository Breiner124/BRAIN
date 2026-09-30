-- ══════════════════════════════════════════════════════════════════
--  El Cerebro — Datos semilla  ·  §10 del blueprint
--  Reemplaza :user_id por el uuid de Bran (auth.users) antes de correr.
--  Espejo de /lib/demo/seed-data.ts (modo demo).
-- ══════════════════════════════════════════════════════════════════

-- \set user_id '00000000-0000-0000-0000-000000000000'

-- ── Perfil ─────────────────────────────────────────────────────────
insert into profile (id, nombre, moneda, tasa_cambio_usd, margen_neto_bolsillo)
values (:'user_id', 'Bran', 'COP', 4000, 0.15)
on conflict (id) do nothing;

-- ── Unidades de negocio ────────────────────────────────────────────
insert into unidades_negocio (user_id, slug, nombre, margen_neto) values
  (:'user_id', 'consultoria', 'Consultoría', null),
  (:'user_id', 'ecom',        'Empresa E-com', 0.15);

-- ── Nodos del grafo (posiciones normalizadas 0..1) ────────────────
insert into nodos (user_id, tipo, titulo, resumen, posicion_x, posicion_y, color, icono, orden) values
  (:'user_id', 'central',      'El Cerebro',   'Resumen de todo',            0.50, 0.50, 'central',      'brain',       0),
  (:'user_id', 'yo',           'Yo',           'Semana · Consultoría · E-com',0.18, 0.22, 'yo',           'user',        1),
  (:'user_id', 'proyecciones', 'Proyecciones', 'Personales + Empresarial',   0.50, 0.12, 'proyecciones', 'trending-up', 2),
  (:'user_id', 'metas',        'Metas',        'BMW · China · Navidad',      0.82, 0.22, 'metas',        'target',      3),
  (:'user_id', 'ganancias',    'Ganancias',    'Centro de gravedad',         0.80, 0.78, 'ganancias',    'dollar',      4),
  (:'user_id', 'deudas',       'Deudas',       'Ordenadas por importancia',  0.20, 0.78, 'deudas',       'credit-card', 5);
-- ── Conexiones (sinapsis) referenciando los nodos recién creados ──
do $$
declare uid uuid := :'user_id';
  n_central uuid; n_yo uuid; n_proy uuid; n_metas uuid; n_gan uuid; n_deu uuid;
begin
  select id into n_central from nodos where user_id = uid and tipo = 'central' limit 1;
  select id into n_yo      from nodos where user_id = uid and tipo = 'yo' limit 1;
  select id into n_proy    from nodos where user_id = uid and tipo = 'proyecciones' limit 1;
  select id into n_metas   from nodos where user_id = uid and tipo = 'metas' limit 1;
  select id into n_gan     from nodos where user_id = uid and tipo = 'ganancias' limit 1;
  select id into n_deu     from nodos where user_id = uid and tipo = 'deudas' limit 1;

  insert into conexiones (user_id, origen_id, destino_id, tipo_flujo, activa) values
    (uid, n_gan,  n_proy,  'financiero', true),
    (uid, n_gan,  n_metas, 'financiero', true),
    (uid, n_gan,  n_deu,   'financiero', true),
    (uid, n_proy, n_gan,   'financiero', true),
    (uid, n_proy, n_metas, 'informativo', true),
    (uid, n_yo,   n_metas, 'tarea', true),
    (uid, n_yo,   n_proy,  'tarea', true),
    (uid, n_central, n_yo,    'informativo', true),
    (uid, n_central, n_proy,  'informativo', true),
    (uid, n_central, n_metas, 'informativo', true),
    (uid, n_central, n_gan,   'informativo', true),
    (uid, n_central, n_deu,   'informativo', true);
end$$;

-- ── Deudas: Computador $150.000 (credito_fijo, importancia 3) ─────
insert into deudas (user_id, nombre, categoria, nivel_importancia, monto_original, saldo_actual, estado)
values (:'user_id', 'Computador a crédito', 'credito_fijo', 3, 150000, 150000, 'activa');

-- ── Metas ──────────────────────────────────────────────────────────
insert into metas (user_id, nombre, categoria, costo_objetivo, ahorrado, fecha_objetivo, fecha_tipo, prioridad, detalle) values
  (:'user_id', 'BMW M340i', 'vehiculo', 185000000, 0, null, 'variable', 3,
   '{"nota":"Fecha variable — depende del flujo"}'),
  (:'user_id', 'Viaje China (Feria de Cantón)', 'viaje', 30000000, 0, '2027-04-25', 'fija', 2,
   '{"base_sin_compras":21200000,"all_in":33200000,"estimado_editable":true,
     "rubros":{"vuelos":8000000,"visa":800000,"hotel":6600000,"comida":3120000,
     "transporte":1200000,"seguro":480000,"sim_varios":1000000,"compras":12000000}}'),
  (:'user_id', 'Navidad 2026', 'festividad', 6000000, 0, '2026-12-24', 'fija', 1,
   '{"editable":true,"reparto":{"Mamá":600000,"Papá":600000,"Abuela":600000,"Hermano":600000,
     "Padrastro":600000,"Tía":600000,"Abuelo":600000,"Prima":600000,"Tío":600000,"Bran":600000}}');

-- ── Proyecciones empresariales ─────────────────────────────────────
insert into proyecciones (user_id, ambito, unidad_id, nombre, tipo, facturacion_esperada, costo_recurrente, fecha_objetivo, fecha_tipo, estado, detalle)
select :'user_id', 'empresarial', u.id, 'Facturación esperada E-com', 'ingreso_esperado', 115000000, null, null, 'variable', 'en_progreso',
  '{"escenarios":["conservador","medio","optimista","stretch"]}'
from unidades_negocio u where u.slug = 'ecom' and u.user_id = :'user_id';

insert into proyecciones (user_id, ambito, unidad_id, nombre, tipo, costo_recurrente, fecha_objetivo, fecha_tipo, estado, detalle)
select :'user_id', 'empresarial', u.id, 'Contratar persona de logística', 'expansion', 2000000, current_date + 45, 'variable', 'pendiente',
  '{"roi_umbral":13333333,"dias_objetivo":45}'
from unidades_negocio u where u.slug = 'ecom' and u.user_id = :'user_id';

-- ── Semana activa inicial (lunes–domingo de la semana actual) ─────
insert into semanas (user_id, fecha_inicio, fecha_fin, activa, nota)
values (
  :'user_id',
  date_trunc('week', current_date)::date,
  (date_trunc('week', current_date) + interval '6 days')::date,
  true,
  'Semana inicial'
);
