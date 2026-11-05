# M13 — Métricas, conciliación y exportación

Actualización: 2026-11-01. La conexión de ventas Hotmart (M12) queda para el final por instrucción del titular. M13 implementa cálculos, lectura agregada y exportación; no activa medición, importaciones ni compras. La conciliación con ventas reales y la hoja externa conservan pendientes verificables.

## Entregables

| Archivo | Uso |
| --- | --- |
| `backend/marketing_report_contract.py` | Contrato cerrado, período de hasta 366 días y declaración explícita de cobertura. |
| `backend/marketing_report_data.py` | Agregación de movimientos normalizados de M11 y deduplicación para conciliación. |
| `backend/marketing_metrics.py` | Importes exactos, ratios, embudos y calidad. |
| `backend/marketing_report_store.py` | Lectura de RPC privada, con habilitación independiente de las escrituras. |
| `backend/marketing_report_export.py` | CSV UTF-8, defensa contra fórmulas y escritura atómica sin sobrescribir. |
| `scripts/export_marketing_report.py` | CLI offline o con agregados de la base. |

El lote no añade pantallas al administrador ni sustituye el tablero de M14. El consumidor recibe conjuntos ya agregados y no debe unir filas de contacto con ventas.

## Ejecución offline y ejemplo reproducible

Desde la raíz, con un directorio de destino nuevo:

```powershell
.\.venv\Scripts\python.exe -m scripts.export_marketing_report --input tests/fixtures/marketing/report_synthetic.json --output reports/ejemplo-m13
```

`report_synthetic.json` contiene exclusivamente datos ficticios: una venta CLP 10.000, dos registros persistidos y una conversión observada entre dos usuarios/sesiones medidos. No representa resultados del sitio. La venta coincide en importe y moneda con el fixture de importación `movements.csv`; las pruebas verifican deduplicación por evento y transacción.

El modo offline no carga variables de entorno, credenciales ni almacenamiento. El período y la zona se obtienen del snapshot. Se rechazan claves extra, campos personales, campañas no registradas, agregados duplicados y conteos incompatibles. Un valor ausente se representa como `null`; no se sustituye por cero.

## Lectura de la base

La RPC `public.marketing_report_snapshot(date,date)` se aplicó como migración `20261101201452_marketing_report_snapshot`. Es `STABLE`, `SECURITY INVOKER`, con `search_path` vacío y ejecución exclusiva de `service_role`. No modifica registros ni abre tablas de contactos a visitantes.

Se calculan por separado:

- Movimientos por día del hecho en America/Santiago, proveedor, servicio, moneda, campaña y método de atribución. La única unión monetaria es movimiento → su transacción, una relación muchos a uno.
- Gasto por día, plataforma, campaña y moneda, conservando su zona de origen.
- Intereses por día, servicio y origen. No se devuelven nombres, correos, teléfonos, UUID de contacto, cookies ni huellas.
- Metadatos de última importación y cobertura; GA4 y Search Console permanecen ausentes hasta disponer de fuentes reales.

La respuesta está limitada a 10.000 agregados por conjunto y aproximadamente 1,9 MB; si se excede, falla y se debe reducir el período. El adaptador admite hasta 2 MB y rechaza respuestas truncadas. No hay un endpoint público para descargar reportes.

Para una exportación explícita de solo lectura, habilitar temporalmente el flag en el proceso:

```powershell
$env:MARKETING_REPORTS_ENABLED='true'
.\.venv\Scripts\python.exe -m scripts.export_marketing_report --database --start 2026-10-01 --end 2026-11-01 --output reports/octubre-hasta-noviembre
Remove-Item Env:MARKETING_REPORTS_ENABLED
```

La plantilla conserva `MARKETING_REPORTS_ENABLED=false`. Este flag es independiente de `MARKETING_LEDGER_ENABLED`: leer no habilita importaciones. No se modificó `.env.local` ni la configuración productiva para activarlo.

## Archivos de salida

| Conjunto | Contenido y límites |
| --- | --- |
| `revenue.csv` | Movimientos diarios observados, pagos con venta, reversos, componentes conocidos y resultados condicionados a cobertura. Nunca suma monedas distintas. |
| `campaigns.csv` | Dinero y gasto agregados primero a campaña + moneda; después se calculan ROAS y costos. Mantiene separada atribución manual y del proveedor. |
| `funnel.csv` | Registros persistidos, segmentos exactos de analítica y CTR de búsqueda, cada uno con fuente y denominador propios. |
| `quality.csv` | Estado de cada fuente, cantidad de agregados, actualización, antigüedad, operaciones/importes sin atribución y motivos de N/D. |
| `cohorts.csv` | Solo cabecera por ahora: no existe fecha de adquisición verificable. No se usa la fecha de pago como sustituto. |
| `manifest.json` | Versión, período, corte, archivos, filas y limitaciones. |

Todos conservan período inclusivo, fecha de corte y zona de reporte. `N/D` significa ausencia/no aplicabilidad del valor; la columna de motivo distingue fuente incompleta, divisor cero o dato faltante. Un conjunto sin filas se identifica como sin datos en calidad; no representa conversión ni ingreso cero.

El directorio debe ser nuevo: nunca se sobrescribe un reporte anterior. La preparación se completa en una carpeta temporal y se mueve al destino solo al terminar. En sistemas POSIX se crean permisos de propietario; en Windows se heredan los permisos del directorio del operador y deben mantenerse privados.

`reports/` está excluido de Git y Vercel. Vite conserva sus bloqueos predeterminados y añade `**/reports/**` a la denegación de archivos. No copiar exportaciones a `public/`, repositorios públicos ni carpetas compartidas sin autorización.

## Fórmulas y semántica

- Importes en unidades menores enteras; presentación exacta para CLP/USD/EUR. Los ratios se redondean a seis decimales con Decimal, sin float.
- Ingreso observado después de reversos = ventas − reembolsos − contracargos. Puede ser negativo en un día donde se devuelve una venta de otro período.
- Una transacción con venta se cuenta una vez, incluso con replay o segunda entrega. El contador es de pagos que tuvieron venta; no de clientes nuevos ni de pagos aún no reembolsados.
- Ticket = venta bruta / transacciones con venta dentro de la misma agrupación. No promediar los tickets de varias filas: reagrupar numerador y denominador.
- Después de comisiones = ingreso ajustado − comisiones − tributos, únicamente con cobertura y semántica completas declaradas. No es margen ni beneficio.
- ROAS bruto/ajustado: dinero atribuible / gasto de la misma campaña, moneda y período. Las fuentes deben estar completas. El gasto requiere al menos una fila diaria explícita para cada día del rango; si faltan días o su zona no es Santiago, el ratio queda N/D.
- Costo por pago y por interés observado se expresan en unidades menores de la moneda declarada. El costo por interés usa `observed_leads` del segmento exacto de campaña, no registros operativos ni clics.
- Cobertura de atribución se define aquí sobre venta bruta atribuible / venta bruta confirmada, por moneda. Incluye también monto y número de ventas de atribución desconocida. No usar ingreso neto negativo como denominador.
- La conversión de usuarios utiliza usuarios elegibles; la de sesiones, sesiones con lead / sesiones medidas. No se divide un conteo de eventos por sesiones y se lo llama conversión por sesión.
- El abandono usa completadores/iniciadores de un embudo cerrado de usuarios de la misma cohorte y `funnel_window_days` declarado. No se resta una serie de eventos independientes.
- `send_attempts` incluye envíos aceptados y reintentos; `retries` se informa aparte. Los adaptadores futuros deben construir ese ámbito explícito, no confundir el evento inicial con todos los envíos.
- Search Console conserva `source_timezone` y fechas originales. Sus clics no se suman a sesiones ni se desplazan por horas sin datos suficientes.
- `engagement_metrics` implementa alcance, CTR único por vista y frecuencia, conservando clics sin exposición. Los conectores deben aportar conteos exactos; no se fabrican esos denominadores a partir de eventos brutos.

Los segmentos de analítica de entrada son agregados del período completo y de ámbito `site`, `campaign` o `form`. No se suman usuarios distintos entre días o segmentos. Ningún identificador de visitante o transacción se exporta ni sirve para unir GA4 con contactos.

## Declaración de cobertura

La existencia de filas importadas no prueba que se hayan entregado todas las ventas, gastos o comisiones. La RPC devuelve dinero/gasto como `partial` si hay importaciones, o `missing` si no las hay. Los importes observados se conservan, pero los KPI que exigen una fuente completa quedan N/D.

Después de conciliar externamente un período, el operador puede aportar `--coverage cobertura.json` con exactamente:

```json
{
  "period": {"start": "2026-10-01", "end": "2026-11-01", "timezone": "America/Santiago"},
  "ledger_complete": true,
  "spend_complete": false,
  "cost_components_complete": false
}
```

Los booleanos son afirmaciones expresas del operador, no verificaciones automáticas. Deben respaldarse con un export comercial conciliado. El período debe coincidir exactamente con el snapshot; no se puede completar GA4/Search Console con esta declaración. `cost_components_complete` exige confirmar también que comisiones y tributos no se solapan y que los ceros son reales. No marcar completo por comodidad para obtener un ratio.

## Evidencia de conciliación

1. **Importación → agregación Python:** el fixture de M11 conserva su importe exacto; repetir el evento o una entrega equivalente de la misma venta no incrementa el total.
2. **Importación → RPC SQL:** `tests/marketing_report_unit.sql` importa una venta ficticia de CLP 10.000 y un reembolso de CLP 2.500 al día siguiente, repite el archivo y una entrega equivalente, y comprueba una sola venta y los días de hecho correctos. Todo se revierte con rollback.
3. **Agregación → CSV:** se comprueban importes/unidades, N/D, separaciones de moneda, defensa contra fórmulas y ausencia de campos personales/comerciales individuales.
4. **Sin multiplicación:** una venta, tres clics y dos sesiones siguen representando una venta; las fuentes de comportamiento no se unen a filas monetarias.
5. **Fuente real, solo lectura:** se exportó 2026-10-01 a 2026-11-01. Ingresos/campañas sin filas y seis agregados de intereses; no se inventaron ventas ni se modificaron registros. Los archivos finales quedan locales en `reports/m13-current-final-2026-11-01/`, fuera de Git. El ejemplo ficticio está en `reports/m13-synthetic-final/`.

Verificaciones: 24 pruebas nuevas de reportes; suite completa de Python con 131 pruebas aprobadas; build cliente/SSR/prerender aprobado. Incluyen regresión de permisos de Windows: las carpetas finales heredan el ACL del destino y son legibles desde el workspace normal. El RPC compartido conserva su límite ordinario y los reportes solicitan un límite explícito mayor, con detección de truncado. Advisors: sin WARN/ERROR; avisos INFO existentes por tablas privadas con RLS sin políticas públicas.

## Pendientes externos

- La conciliación de una operación comercial real requiere fuente y autorización; no se hizo una compra ni se cargaron ventas reales para probar.
- GA4/Search Console no aportan todavía datos reales al reporte. Falta validar sus exportaciones/segmentos exactos al disponer de cuentas.
- Hoja privada: el conector de Google Drive solicitó autenticación en dos intentos consecutivos y no completó la creación de carpeta/hoja. No se inventó una URL ni se cambió la compartición. Los CSV y el procedimiento de importación están preparados; importar a una hoja privada y verificar sus permisos sigue pendiente.
- M12 (Hotmart) queda para el final. Los recibos/webhooks y su conciliación se comprobarán entonces con el mismo libro de M11.
- No hay datos de adquisición verificables para cohortes, costos completos para ROI ni identidad de cliente nuevo para CAC/LTV.
- No se midieron 30 escenarios de latencia ni se cambiaron coreografías de carga. Este lote es un exportador administrativo sin región nueva de interfaz.

Para la hoja privada, importar cada CSV a una pestaña del mismo nombre, usar UTF-8, fijar la primera fila y conservar `N/D` como texto. No publicar ni ampliar permisos; verificar que el total por moneda coincide con los CSV y registrar fecha de corte. La conexión de Looker corresponde a M14.
