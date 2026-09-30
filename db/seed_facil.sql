-- ══════════════════════════════════════════════════════════════════
--  El Cerebro — SEED FÁCIL (un solo bloque)
--  Solo cambia el email de la línea de abajo por el TUYO (el que usaste
--  al crear el usuario en Authentication → Users). Luego pulsa Run.
--  Correr DESPUÉS de schema.sql y policies.sql.
-- ══════════════════════════════════════════════════════════════════

do $$
declare
  v_email text := 'TU_EMAIL_AQUI@ejemplo.com';   -- 👈 CAMBIA ESTO
  uid uuid;
  u_ecom uuid;
begin
  select id into uid from auth.users where email = v_email;
  if uid is null then
    raise exception 'No hay usuario con el email %. Créalo en Authentication → Users y vuelve a correr.', v_email;
  end if;

  -- Perfil
  insert into profile (id, nombre, moneda, tasa_cambio_usd, margen_neto_bolsillo)
  values (uid, 'Bran', 'COP', 4000, 0.15)
  on conflict (id) do nothing;

  -- Unidades de negocio
  insert into unidades_negocio (user_id, slug, nombre, margen_neto)
  values (uid, 'consultoria', 'Consultoría', null);
  insert into unidades_negocio (user_id, slug, nombre, margen_neto)
  values (uid, 'ecom', 'Empresa E-com', 0.15)
  returning id into u_ecom;

  -- Nodos del grafo
  insert into nodos (user_id, tipo, titulo, resumen, posicion_x, posicion_y, color, icono, orden) values
    (uid, 'central',      'El Cerebro',   'Resumen de todo',              0.50, 0.50, 'central',      'brain',       0),
    (uid, 'yo',           'Yo',           'Semana · Consultoría · E-com', 0.18, 0.22, 'yo',           'user',        1),
    (uid, 'proyecciones', 'Proyecciones', 'Personales + Empresarial',     0.50, 0.12, 'proyecciones', 'trending-up', 2),
    (uid, 'metas',        'Metas',        'BMW · China · Navidad',        0.82, 0.22, 'metas',        'target',      3),
    (uid, 'ganancias',    'Ganancias',    'Centro de gravedad',           0.80, 0.78, 'ganancias',    'dollar',      4),
    (uid, 'deudas',       'Deudas',       'Ordenadas por importancia',    0.20, 0.78, 'deudas',       'credit-card', 5);

  -- Conexiones (sinapsis) entre los nodos recién creados
  insert into conexiones (user_id, origen_id, destino_id, tipo_flujo, activa)
  select uid, o.id, d.id, f.tipo_flujo, true
  from (values
    ('ganancias','proyecciones','financiero'),
    ('ganancias','metas','financiero'),
    ('ganancias','deudas','financiero'),
    ('proyecciones','ganancias','financiero'),
    ('proyecciones','metas','informativo'),
    ('yo','metas','tarea'),
    ('yo','proyecciones','tarea'),
    ('central','yo','informativo'),
    ('central','proyecciones','informativo'),
    ('central','metas','informativo'),
    ('central','ganancias','informativo'),
    ('central','deudas','informativo')
  ) as f(origen, destino, tipo_flujo)
  join nodos o on o.user_id = uid and o.tipo = f.origen
  join nodos d on d.user_id = uid and d.tipo = f.destino;

  -- Deuda semilla
  insert into deudas (user_id, nombre, categoria, nivel_importancia, monto_original, saldo_actual, estado)
  values (uid, 'Computador a crédito', 'credito_fijo', 3, 150000, 150000, 'activa');

  -- Metas semilla
  insert into metas (user_id, nombre, categoria, costo_objetivo, ahorrado, fecha_objetivo, fecha_tipo, prioridad, detalle) values
    (uid, 'BMW M340i', 'vehiculo', 185000000, 0, null, 'variable', 3,
     '{"nota":"Fecha variable — depende del flujo"}'),
    (uid, 'Viaje China (Feria de Cantón)', 'viaje', 30000000, 0, '2027-04-25', 'fija', 2,
     '{"base_sin_compras":21200000,"all_in":33200000,"estimado_editable":true}'),
    (uid, 'Navidad 2026', 'festividad', 6000000, 0, '2026-12-24', 'fija', 1,
     '{"editable":true,"reparto":{"Mamá":600000,"Papá":600000,"Abuela":600000,"Hermano":600000,"Padrastro":600000,"Tía":600000,"Abuelo":600000,"Prima":600000,"Tío":600000,"Bran":600000}}');

  -- Proyecciones empresariales
  insert into proyecciones (user_id, ambito, unidad_id, nombre, tipo, facturacion_esperada, fecha_tipo, estado, detalle)
  values (uid, 'empresarial', u_ecom, 'Facturación esperada E-com', 'ingreso_esperado', 115000000, 'variable', 'en_progreso',
    '{"escenarios":["conservador","medio","optimista","stretch"]}');
  insert into proyecciones (user_id, ambito, unidad_id, nombre, tipo, costo_recurrente, fecha_objetivo, fecha_tipo, estado, detalle)
  values (uid, 'empresarial', u_ecom, 'Contratar persona de logística', 'expansion', 2000000, current_date + 45, 'variable', 'pendiente',
    '{"roi_umbral":13333333,"dias_objetivo":45}');

  -- Semana activa inicial (lunes–domingo actual)
  insert into semanas (user_id, fecha_inicio, fecha_fin, activa, nota)
  values (uid, date_trunc('week', current_date)::date, (date_trunc('week', current_date) + interval '6 days')::date, true, 'Semana inicial');

  raise notice 'Cerebro sembrado para % ✔', v_email;
end$$;
