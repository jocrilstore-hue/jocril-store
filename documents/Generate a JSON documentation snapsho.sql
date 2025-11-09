-- Generate a JSON documentation snapshot of your Supabase/Postgres database.
-- Covers: schemas, tables, comments, columns, relationships (FKs), indexes,
-- grants, and row-level security (RLS) including policies.
WITH non_system_schemas AS (
  SELECT n.nspname AS schema_name
  FROM pg_namespace n
  WHERE n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
    AND n.nspname NOT LIKE 'pg_temp_%'
    AND n.nspname NOT LIKE 'pg_toast_temp_%'
    -- Uncomment to only document public:
    -- AND n.nspname = 'public'
),
tables AS (
  SELECT
    n.nspname AS schema_name,
    c.oid       AS table_oid,
    c.relname   AS table_name,
    obj_description(c.oid, 'pg_class') AS table_comment,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'  -- ordinary tables
    AND n.nspname IN (SELECT schema_name FROM non_system_schemas)
),
columns AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    a.attname AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    NOT a.attnotnull AS is_nullable,
    pg_get_expr(ad.adbin, ad.adrelid) AS column_default,
    a.attidentity IN ('a','d') AS is_identity,
    CASE a.attidentity WHEN 'a' THEN 'ALWAYS' WHEN 'd' THEN 'BY DEFAULT' ELSE NULL END AS identity_generation,
    col_description(c.oid, a.attnum) AS column_comment
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
  WHERE a.attnum > 0 AND NOT a.attisdropped
    AND c.relkind = 'r'
    AND n.nspname IN (SELECT schema_name FROM non_system_schemas)
),
fk_relationships AS (
  -- One row per FK column; aggregated later to multi-column keys.
  SELECT
    src_n.nspname AS src_schema,
    src_c.relname AS src_table,
    src_c.oid     AS src_table_oid,
    tgt_n.nspname AS tgt_schema,
    tgt_c.relname AS tgt_table,
    con.oid       AS constraint_oid,
    con.conname   AS constraint_name,
    con.confdeltype, -- for delete action
    con.confupdtype, -- for update action
    src_a.attname AS src_column,
    tgt_a.attname AS tgt_column,
    con.conkey[ord]  AS src_attnum,
    con.confkey[ord] AS tgt_attnum,
    ord
  FROM pg_constraint con
  JOIN pg_class src_c ON src_c.oid = con.conrelid
  JOIN pg_namespace src_n ON src_n.oid = src_c.relnamespace
  JOIN pg_class tgt_c ON tgt_c.oid = con.confrelid
  JOIN pg_namespace tgt_n ON tgt_n.oid = tgt_c.relnamespace
  JOIN LATERAL generate_subscripts(con.conkey, 1) AS gs(ord) ON TRUE
  JOIN pg_attribute src_a ON src_a.attrelid = src_c.oid AND src_a.attnum = con.conkey[ord]
  JOIN pg_attribute tgt_a ON tgt_a.attrelid = tgt_c.oid AND tgt_a.attnum = con.confkey[ord]
  WHERE con.contype = 'f'
    AND src_n.nspname IN (SELECT schema_name FROM non_system_schemas)
),
fk_grouped AS (
  SELECT
    src_schema,
    src_table,
    constraint_name,
    tgt_schema,
    tgt_table,
    jsonb_agg(jsonb_build_object('source_column', src_column, 'target_column', tgt_column) ORDER BY ord)::json AS column_mapping,
    CASE confdeltype
      WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE'
      WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' ELSE NULL END AS on_delete,
    CASE confupdtype
      WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT' WHEN 'c' THEN 'CASCADE'
      WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' ELSE NULL END AS on_update
  FROM fk_relationships
  GROUP BY src_schema, src_table, constraint_name, tgt_schema, tgt_table, confdeltype, confupdtype
),
indexes AS (
  SELECT
    schemaname AS schema_name,
    tablename  AS table_name,
    indexname  AS index_name,
    indexdef   AS index_def,
    (position(' UNIQUE ' in upper(indexdef)) > 0) AS is_unique,
    (position(' PRIMARY KEY ' in upper(indexdef)) > 0) AS is_primary
  FROM pg_indexes
  WHERE schemaname IN (SELECT schema_name FROM non_system_schemas)
),
grants AS (
  SELECT
    table_schema AS schema_name,
    table_name,
    grantee,
    privilege_type
  FROM information_schema.table_privileges
  WHERE table_schema IN (SELECT schema_name FROM non_system_schemas)
),
-- ✅ Fixed: use pg_policies view directly; no polrelid, no pg_get_expr needed.
policies AS (
  SELECT
    p.schemaname AS schema_name,
    p.tablename  AS table_name,
    p.policyname,
    p.permissive,
    p.cmd        AS command,      -- ALL, SELECT, INSERT, UPDATE, DELETE
    p.roles,
    p.qual       AS using_expression,
    p.with_check AS check_expression
  FROM pg_policies p
  WHERE p.schemaname IN (SELECT schema_name FROM non_system_schemas)
),
assembled AS (
  SELECT
    t.schema_name,
    t.table_name,
    t.table_comment,
    t.rls_enabled,
    t.rls_forced,
    -- Columns
    COALESCE((
      SELECT json_agg(json_build_object(
               'name', c.column_name,
               'data_type', c.data_type,
               'is_nullable', c.is_nullable,
               'default', c.column_default,
               'is_identity', c.is_identity,
               'identity_generation', c.identity_generation,
               'comment', c.column_comment
             ) ORDER BY c.column_name)
      FROM columns c
      WHERE c.schema_name = t.schema_name AND c.table_name = t.table_name
    ), '[]'::json) AS columns,
    -- Relationships (FKs)
    COALESCE((
      SELECT json_agg(json_build_object(
               'name', f.constraint_name,
               'target', json_build_object('schema', f.tgt_schema, 'table', f.tgt_table),
               'column_mapping', f.column_mapping,
               'on_update', f.on_update,
               'on_delete', f.on_delete
             ) ORDER BY f.constraint_name)
      FROM fk_grouped f
      WHERE f.src_schema = t.schema_name AND f.src_table = t.table_name
    ), '[]'::json) AS relationships,
    -- Indexes
    COALESCE((
      SELECT json_agg(json_build_object(
               'name', i.index_name,
               'definition', i.index_def,
               'is_unique', i.is_unique,
               'is_primary', i.is_primary
             ) ORDER BY i.index_name)
      FROM indexes i
      WHERE i.schema_name = t.schema_name AND i.table_name = t.table_name
    ), '[]'::json) AS indexes,
    -- Grants
    COALESCE((
      SELECT json_agg(json_build_object(
               'grantee', g.grantee,
               'privilege', g.privilege_type
             ) ORDER BY g.grantee, g.privilege_type)
      FROM grants g
      WHERE g.schema_name = t.schema_name AND g.table_name = t.table_name
    ), '[]'::json) AS grants,
    -- RLS Policies
    COALESCE((
      SELECT json_agg(json_build_object(
               'name', p.policyname,
               'permissive', p.permissive,
               'command', p.command,
               'roles', p.roles,
               'using', p.using_expression,
               'check', p.check_expression
             ) ORDER BY p.policyname)
      FROM policies p
      WHERE p.schema_name = t.schema_name AND p.table_name = t.table_name
    ), '[]'::json) AS rls_policies
  FROM tables t
),
schemas_agg AS (
  SELECT
    schema_name,
    json_agg(json_build_object(
      'name', table_name,
      'comment', table_comment,
      'row_level_security', json_build_object(
        'enabled', rls_enabled,
        'forced', rls_forced
      ),
      'columns', columns,
      'relationships', relationships,
      'indexes', indexes,
      'grants', grants,
      'policies', rls_policies
    ) ORDER BY table_name) AS tables_json
  FROM assembled
  GROUP BY schema_name
)
SELECT json_build_object(
  'generated_at', now(),
  'database', current_database(),
  'schemas', (
    SELECT json_agg(json_build_object(
             'name', s.schema_name,
             'tables', s.tables_json
           ) ORDER BY s.schema_name)
    FROM schemas_agg s
  )
) AS documentation_json;