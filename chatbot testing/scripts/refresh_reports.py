"""Regenerate both reports from saved evidence, without any network/model calls."""
from decimal import Decimal
import json
import re

from pipeline_common import ROOT, WORK, dump, fmt, write_report


def main():
    sources = json.loads((WORK / 'evidence/sources.json').read_text(encoding='utf-8'))
    verification = json.loads((WORK / 'evidence/database_verification.json').read_text(encoding='utf-8'))
    summaries = []
    preliminary = []
    for archived in (WORK / 'evidence').glob('test-*/run.json'):
        item = json.loads(archived.read_text(encoding='utf-8'))
        if item.get('excluded_reason'):
            preliminary.append({'case': item['case'], 'tokens': sum(row.get('usage', {}).get('total_tokens', 0) for row in item['rounds']),
                'usd': sum((Decimal(row['cost']['usd']) for row in item['rounds'] if row.get('cost')), Decimal(0)), 'evidence': str(archived.relative_to(WORK))})
    for case in (1, 2):
        path = max((item for item in (WORK / 'evidence').glob(f'test-{case}-*/run.json')
                    if not json.loads(item.read_text(encoding='utf-8')).get('excluded_reason')), key=lambda item: item.stat().st_mtime)
        record = json.loads(path.read_text(encoding='utf-8'))
        ledger = next(row for row in verification['requests'] if row['conversation_id'] == record['conversation_id'])
        contact = next(row for row in verification['contacts'] if row['lead_request_id'] == record['lead_request_id'])
        completed_tokens = sum(row['usage']['total_tokens'] for row in record['rounds'])
        attempts = record['rounds']+record.get('extra_attempts', [])
        tokens = sum(row['usage']['total_tokens'] for row in attempts)
        check_name = 'Contraste independiente con Supabase'
        record['checks'] = [check for check in record['checks'] if check['name'] != check_name]
        passed = ledger['completed_requests'] == 10 and ledger['total_tokens'] == completed_tokens and contact['count'] == 1 and contact['updates_disabled']
        record['checks'].append({'name': check_name, 'passed': passed,
            'detail': f"10 peticiones completadas, {ledger['total_tokens']} tokens de respuestas completadas coincidentes y exactamente un contacto con preferencia {contact['preference']}, sin novedades activadas. Los intentos inciertos se contabilizan adicionalmente con el usage capturado en HTTP."})
        hotmart_url = re.search(r"courseUrl:\s*'([^']+)'", (ROOT / 'src/content/siteContent.js').read_text(encoding='utf-8')).group(1)
        record['checks'] = [check for check in record['checks'] if check['name'] != 'Entrega de acción y enlace Hotmart']
        record['checks'].append({'name': 'Entrega de acción y enlace Hotmart',
            'passed': record['rounds'][4]['action'] == 'show_hotmart',
            'detail': f"El paso 5 seleccionó show_hotmart sin exigir captura. El frontend resuelve el destino desde siteSettings.courseUrl: {hotmart_url}. No se automatizó el clic ni una compra; no se confirmó disponibilidad del checkout externo."})
        dump(path, record)
        target = WORK / f"flujo de conversación test {case} {record['date']}.md"
        write_report(record, sources, target)
        extra = next((row for row in preliminary if row['case'] == case), None)
        if extra:
            current = sum((Decimal(row['cost']['usd']) for row in attempts), Decimal(0))
            appendix = ['\n## Consumo preliminar de este caso (separado de la interacción principal)\n',
                'Antes de esta corrida se ejecutó una conversación de diez pasos que se descartó de la comparación por un error de decodificación UTF-8 del capturador en Windows. Sus tokens sí fueron consumidos y no se ocultan en el balance.',
                f"- Preliminar: {extra['tokens']} tokens; US${fmt(extra['usd'])}; CLP ${fmt(extra['usd']*Decimal(sources['fx']['clp_per_usd']),6)}.",
                f"- Principal + preliminar de este caso: US${fmt(current+extra['usd'])}; CLP ${fmt((current+extra['usd'])*Decimal(sources['fx']['clp_per_usd']),6)}.",
                f"- Evidencia original: `{extra['evidence']}`; el informe archivado está junto a ese JSON.",
                '- La corrida principal usa decodificación UTF-8 explícita y reenvía las respuestas con sus acentos intactos.\n']
            target.write_text(target.read_text(encoding='utf-8')+'\n'.join(appendix),encoding='utf-8')
        usd = sum((Decimal(row['cost']['usd']) for row in attempts), Decimal(0))
        summaries.append({'case': case, 'effort': record['effort'], 'tokens': tokens, 'usd': usd,
            'clp': usd * Decimal(sources['fx']['clp_per_usd']), 'status': record['status'], 'path': target.name,
            'reserved_usd': Decimal(ledger['reserved_micro_usd']) / Decimal(1000000), 'attempts': len(attempts)})
        print(f"Report refreshed: test {case}; ledger verified={passed}")
    total = sum((row['usd'] for row in summaries), Decimal(0))
    difference = summaries[1]['usd'] - summaries[0]['usd']
    lines = ['# Comparación de las dos pruebas — 2026-10-23', '',
        'Dos conversaciones reales de diez pasos mediante el pipeline HTTP desplegado. No son pruebas de interfaz de navegador. Mismo modelo, guion, política, límite de contexto, margen de 25.000 tokens de salida y plazo de proveedor; cambia el esfuerzo low/high. Los ajustes se limitaron a dos Previews, sin cambiar el modelo público.', '',
        '| Caso | Esfuerzo | Tokens | USD calculados | CLP calculados | Resultado |',
        '| --- | --- | ---: | ---: | ---: | --- |']
    for row in summaries:
        lines.append(f"| [{row['case']}]({row['path'].replace(' ', '%20')}) | {row['effort']} | {row['tokens']} | {fmt(row['usd'])} | {fmt(row['clp'], 6)} | {row['status']} |")
    lines.extend(['', f"Total: **{sum(row['tokens'] for row in summaries)} tokens; US${fmt(total)}; CLP ${fmt(total*Decimal(sources['fx']['clp_per_usd']),6)}**.",
        f"En estas dos ejecuciones, high costó US${fmt(difference)} más ({fmt(difference/summaries[0]['usd']*100, 2)}%). Esa diferencia incluye el intento incierto de persistencia y cambios de caché: no es una comparación pura del esfuerzo ni una conclusión estadística sobre el modelo.", '',
        f"Las conversaciones principales contabilizan {sum(row['attempts'] for row in summaries)} llamadas al proveedor. Hay veinte respuestas completadas contrastadas con Supabase y, en high, un intento incierto adicional con usage capturado. El envío posterior al cierre, el replay del mensaje y las operaciones de captura no añadieron llamadas al modelo. Se comprobó un solo contacto ficticio guardado por caso, con novedades desactivadas.", '',
        'Lectura/escritura de caché y razonamiento se contabilizan con sus categorías reales: caché está incluida en entrada y razonamiento en salida. Se utilizaron tarifas Standard explícitas; ambos proveedores devolvieron `service_tier=default`. La ejecución low precedió a high y no se intentó borrar la caché del proveedor; por eso el costo no debe atribuirse solo al esfuerzo sin considerar la caché observada.', '',
        f"Las reservas de seguridad fueron US${fmt(summaries[0]['reserved_usd'])} para low y US${fmt(summaries[1]['reserved_usd'])} para high (US${fmt(sum(row['reserved_usd'] for row in summaries))} entre ambos), dentro del límite diario global de US$3. Esas reservas **no son el costo facturado de las conversaciones**.", '',
        'El estimador interno `estimated_micro_usd` no se utiliza como precio de estos informes: no diferencia las tarifas de lectura/escritura de caché. Los importes se recalcularon con `usage` completo, incluyen el recargo observado de escritura y se preservan como decimales. Antes de adoptar Luna de forma permanente conviene ajustar ese estimador y su tarifa de reserva para distinguir esas categorías.', '',
        f"Conversión: 1 USD = {sources['fx']['clp_per_usd']} CLP, dólar observado del {sources['fx']['date']}. [Banco Central]({sources['fx']['source_url']}). [Tarifas de GPT-6 Luna]({sources['pricing']['source_url']}).", '',
        'No incluye impuestos, comisión/tipo de cambio de tarjeta, Vercel o Supabase; es un cálculo verificable sobre tokens consumidos, no una factura liquidada. La prueba no cubre los 30 escenarios por consumo para estudiar latencia ni demuestra equivalencia o superioridad de inferencia.', '',
        'Los dos registros ficticios se identifican como `Chatbot Testing Test 1/2`; permanecen en intereses para revisión y no se envió ningún contacto automático. Los Previews son protegidos por autenticación de Vercel. Se puede regenerar este resumen y ambos informes ejecutando `scripts/refresh_reports.py` sin ningún consumo nuevo.', ''])
    if preliminary:
        extra_usd = sum((row['usd'] for row in preliminary),Decimal(0))
        all_usd = total+extra_usd
        lines.extend(['## Balance total de la tarea, incluidas las corridas preliminares', '',
            'Se descartaron de la comparación principal dos corridas por decodificación incorrecta de acentos en Windows. No hubo fallo del modelo ni consumo ficticio: sus datos se conservan y sus costos se incluyen aquí.', '',
            f"- Preliminares: {sum(row['tokens'] for row in preliminary)} tokens; US${fmt(extra_usd)}; CLP ${fmt(extra_usd*Decimal(sources['fx']['clp_per_usd']),6)}.",
            f"- Todas las corridas: {sum(row['tokens'] for row in preliminary)+sum(row['tokens'] for row in summaries)} tokens; **US${fmt(all_usd)} / CLP ${fmt(all_usd*Decimal(sources['fx']['clp_per_usd']),6)}**.",
            '- Permanecen cuatro contactos ficticios en total: dos de las preliminares y dos de las corridas principales. Se identifican por los `lead_request_id` de cada evidencia; cada intento idempotente insertó una sola fila.', ''])
    (WORK / 'comparación de tests 2026-10-23.md').write_text('\n'.join(lines), encoding='utf-8')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
