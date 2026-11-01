# M11: libro monetario e importación CSV

Estado: código, esquema privado y comprobación SQL completados. La importación real está desactivada mediante `MARKETING_LEDGER_ENABLED=false` por defecto. No se han importado pagos, contactos ni campañas reales.

## Uso

Validar un archivo sin leer credenciales ni escribir en la base:

```powershell
.venv\Scripts\python -m scripts.import_marketing_data ARCHIVO.csv --kind movements --dry-run
.venv\Scripts\python -m scripts.import_marketing_data GASTO.csv --kind spend --dry-run
```

Sin `--apply`, el comportamiento también es dry-run. Las plantillas de encabezados están en `config/marketing/import-templates/`. El fixture de `tests/fixtures/marketing/movements.csv` es exclusivamente de pruebas; no debe aplicarse a producción.

La escritura exige que el operador habilite explícitamente `MARKETING_LEDGER_ENABLED=true` en su entorno de servidor y disponga de la clave secreta admitida por el adaptador existente. Después puede usar `--apply`; no hay endpoint público de importación. Ninguna clave se coloca en argumentos o fixtures. Esta implementación no habilitó esa bandera ni envió un archivo real.

## Reglas de datos

- UTF-8, encabezados exactos, hasta 10 MB/10.000 filas. Un error invalida todo el lote. Los reportes muestran fila y código cerrado, no valores originales.
- CLP sin decimales, USD/EUR con hasta dos decimales significativos. Dinero convertido con Decimal a unidades menores enteras; no float ni conversión implícita de moneda.
- Referencias estables de transacción y movimiento comercial, no IDs nuevos por cada entrega o exportación. Las campañas deben existir en `config/marketing/campaigns.json`; el registro sigue vacío.
- Sin evidencia de campaña, usar `attribution_method=unknown` y dejar vacíos campaña/referencia. Sin producto conocido, dejarlo vacío. No reconstruir esos valores a partir de datos personales.
- Los movimientos `adjustment` se rechazan para revisión: el formato actual no define su signo económico. Una venta contradictoria se rechaza y requiere corrección revisada; nunca se sustituye silenciosamente ni se suma otra venta.
- El gasto corregido para la misma plataforma/campaña/fecha/moneda sustituye el importe y conserva una revisión. No se suman reimportaciones.
- Un reembolso requiere que la venta ya exista o venga en el mismo lote. No puede superar el saldo; una venta de otro archivo/canal para la misma transacción no se cuenta otra vez. M12 deberá decidir cómo retener notificaciones fuera de orden antes de llamar a esta RPC.
- El dry-run valida estructura y filas; los conflictos con históricos y límites de reverso se verifican en la transacción de base de datos al aplicar.

## Esquema y acceso

Migración `marketing_ledger`, versión remota `20261029232155`. Archivo local en `supabase/migrations/20261029232155_marketing_ledger.sql`; creado inicialmente mediante la CLI y sincronizado con la versión asignada por Supabase al aplicar.

Tablas privadas de lotes, transacciones, movimientos, gasto, revisiones de gasto y recibos de webhook. RLS habilitado, sin acceso de anon/authenticated. La RPC `public.marketing_import_batch` es SECURITY INVOKER con search_path vacío y ejecución exclusiva de service_role.

El lote completo es atómico y usa una exclusión transaccional para serializar importaciones cortas. Repetir el mismo archivo devuelve replay; un contenido normalizado contradictorio para el mismo digest/identificador se rechaza. No ampliar permisos de contactos para generar reportes.

No ejecutar `supabase db push` a ciegas: el repositorio ya tenía migraciones históricas remotas documentadas como scripts en `database/`. Antes de usar la CLI para desplegar, conciliar el historial completo; esta carpeta no es una copia de todo ese historial.

## Evidencia

- Pruebas Python con proveedores simulados: normalización, dinero, duplicados, privacidad, dry-run y gates de escritura.
- `tests/marketing_ledger_unit.sql`: ejecutado con rol service_role, verifica replay, venta única entre entregas, reembolso parcial, rollback de lote inválido, reemplazo/auditoría de gasto y denegación de RPC pública. Resultado: `marketing_ledger_unit_passed`.
- Los registros sintéticos se revirtieron mediante ROLLBACK. Consulta posterior: cero lotes, transacciones, movimientos, gastos y revisiones.
- Advisors de seguridad: solo avisos INFO `rls_enabled_no_policy`, correspondientes a tablas privadas sin acceso público; las nuevas seis tablas usan exclusivamente service_role. [Descripción del aviso](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Pendientes fuera de M11: recepción de Hotmart (M12), métricas/exportación (M13), tablero (M14) y activación con datos comerciales autorizados (M15).
