"""Real HTTP pipeline exercise, cost accounting and reproducible Markdown reports.

No provider mocks, no direct calls to Responses, no changes to project-wide model
settings. Each entry point can deploy its own Preview and has its own cookie jar.
"""
import argparse
from datetime import datetime, timezone
from decimal import Decimal
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
from uuid import uuid4
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
WORK = ROOT / 'chatbot testing'
PRIVATE = ROOT / '.preview' / 'chatbot-testing'
PROJECT = 'prj_9NLR5XePMoPl4dVGO06bZHQ0r5jq'
TEAM = 'team_wpjRCdTWmM7mt6hz8P5oOwtr'
PROMPTS = [
    'Hola, quiero información sobre el curso Flores de Bach para la vida cotidiana.',
    '¿Qué propuesta tiene ese curso? Busco información general para aprender.',
    '¿La futura modalidad online ya está abierta?',
    'Prefiero volver al curso actual. ¿Dónde puedo revisar su precio y condiciones?',
    '¿Puedes mostrarme el enlace para inscribirme al curso actual?',
    'No quiero dejar mis datos por ahora, solo seguir leyendo información del curso.',
    'Gracias. ¿También puedo encontrar información sobre las terapias en la web?',
    'Me interesa una primera consulta individual. ¿Cómo comienza?',
    '¿Puedes confirmar cuánto dura y qué disponibilidad hay para la consulta? Si no está publicado, no lo inventes.',
    'Quiero que el equipo me contacte por una consulta individual.',
]
WELCOME = {'role': 'assistant', 'content': 'Hola, puedo orientarte sobre consultas, terapias, cursos y actividades en la naturaleza. ¿Qué estás buscando?'}


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding='utf-8')


def safe_error(text):
    return re.sub(r'[A-Za-z0-9_-]{40,}', '[redacted]', text)[-1400:]


def deploy(effort, evidence):
    command = [shutil.which('vercel.cmd') or 'vercel', 'deploy', '--yes', '--target', 'preview',
        '--project', PROJECT, '--scope', TEAM]
    overrides = {'OPENAI_MODEL': 'gpt-6-luna', 'OPENAI_REASONING_EFFORT': effort,
        'OPENAI_MAX_OUTPUT_TOKENS': '25000', 'OPENAI_REQUEST_TIMEOUT_SECONDS': '25', 'CHAT_TEST_METRICS': '1',
        'CHAT_INPUT_USD_PER_MILLION': '0.10', 'CHAT_OUTPUT_USD_PER_MILLION': '0.50',
        'CHAT_DAILY_BUDGET_MICRO_USD': '3000000'}
    for key, value in overrides.items():
        command.extend(['--env', f'{key}={value}'])
    print(f'Deploying isolated Preview for Luna {effort}...', flush=True)
    completed = subprocess.run(command, capture_output=True, text=True, encoding='utf-8', timeout=300, cwd=ROOT)
    if completed.returncode:
        raise RuntimeError('Preview deployment failed: ' + safe_error(completed.stderr))
    url = None
    for match in re.finditer(r'\{', completed.stdout):
        try:
            value, _ = json.JSONDecoder().raw_decode(completed.stdout[match.start():])
            if isinstance(value, dict) and isinstance(value.get('deployment'), dict):
                url = value['deployment'].get('url')
                if url:
                    dump(evidence / 'deployment.json', {'deployment': value['deployment'], 'overrides': overrides})
                    break
        except ValueError:
            continue
    if not url:
        urls = re.findall(r'https://nicolaszamara-[a-z0-9-]+\.vercel\.app', completed.stdout)
        if urls:
            url = urls[-1]
            dump(evidence / 'deployment.json', {'url': url, 'overrides': overrides})
    if not url:
        raise RuntimeError('No Preview URL returned by Vercel')
    print(f'Preview ready: {url}', flush=True)
    return url


class Pipeline:
    def __init__(self, deployment, case, run_id):
        self.deployment = deployment
        self.private = PRIVATE / f'test-{case}-{run_id}'
        self.private.mkdir(parents=True, exist_ok=True)
        self.jar = self.private / 'session.cookies'
        self.sequence = 0

    def request(self, path='/api/chat', payload=None):
        self.sequence += 1
        command = [shutil.which('vercel.cmd') or 'vercel', 'curl', path, '--deployment', self.deployment,
            '--scope', TEAM, '--yes', '--', '--silent', '--show-error', '--max-time', '70',
            '--cookie', str(self.jar), '--cookie-jar', str(self.jar), '--write-out', 'HTTP_CODE:%{http_code}']
        if payload is not None:
            body_path = self.private / f'{self.sequence}.request.json'
            dump(body_path, payload)
            command.extend(['--request', 'POST', '--header', 'Content-Type: application/json',
                            '--data-binary', '@' + str(body_path)])
        started = time.perf_counter()
        try:
            completed = subprocess.run(command, capture_output=True, timeout=100, cwd=ROOT)
        except subprocess.TimeoutExpired:
            return {'http_status': None, 'body': {'status': 'transport_timeout'}, 'duration_ms': round((time.perf_counter()-started)*1000, 2)}
        duration = round((time.perf_counter()-started)*1000, 2)
        if completed.returncode:
            return {'http_status': None, 'body': {'status': 'transport_error', 'cli_exit': completed.returncode}, 'duration_ms': duration}
        parsed = parse_http_output(completed.stdout)
        return {**parsed, 'duration_ms': duration}


def parse_http_output(raw):
    # curl emits UTF-8 JSON. Windows' locale is not necessarily UTF-8: decoding
    # with that locale corrupts accents and changes the next round's context.
    text = raw.decode('utf-8')
    body, separator, status = text.strip().rpartition('HTTP_CODE:')
    try:
        value = json.loads(body) if separator else {'status': 'invalid_transport_output'}
    except ValueError:
        value = {'status': 'non_json_response'}
    return {'http_status': int(status) if status.isdigit() else None, 'body': value}


def calculate_cost(usage, sources):
    if usage.get('service_tier') not in (None, 'default', 'standard'):
        return None
    if not all(type(usage.get(field)) is int for field in ('input_tokens', 'output_tokens', 'total_tokens')):
        return None
    details = usage.get('input_tokens_details', {})
    cached = details.get('cached_tokens')
    if type(cached) is not int:
        return None
    writes = details.get('cache_write_tokens', details.get('cache_creation_tokens', 0))
    if type(writes) is not int or not 0 <= cached + writes <= usage['input_tokens']:
        return None
    prices = sources['pricing']
    amount = (Decimal(usage['input_tokens'] - cached - writes) * Decimal(prices['usd_per_million_input'])
        + Decimal(cached) * Decimal(prices['usd_per_million_cached_input'])
        + Decimal(writes) * Decimal(prices['usd_per_million_cache_write'])
        + Decimal(usage['output_tokens']) * Decimal(prices['usd_per_million_output'])) / Decimal(1000000)
    return {'usd': str(amount), 'clp': str(amount * Decimal(sources['fx']['clp_per_usd']))}


def fmt(value, digits=9):
    return 'N/D' if value is None else f'{Decimal(str(value)):.{digits}f}'


def write_report(record, sources, path):
    rounds = record['rounds']
    attempts = rounds + record.get('extra_attempts', [])
    known = [row for row in attempts if row.get('cost')]
    measured_usd = sum((Decimal(row['cost']['usd']) for row in known), Decimal(0))
    measured_clp = measured_usd * Decimal(sources['fx']['clp_per_usd'])
    total_known = len(known) == len(attempts) and len(rounds) == 10
    tokens = {key: sum(row.get('usage', {}).get(key, 0) for row in attempts) for key in ('input_tokens', 'output_tokens', 'total_tokens')}
    reasoning = sum(row.get('usage', {}).get('output_tokens_details', {}).get('reasoning_tokens', 0) for row in attempts)
    cached = sum(row.get('usage', {}).get('input_tokens_details', {}).get('cached_tokens', 0) for row in attempts)
    written = sum(row.get('usage', {}).get('input_tokens_details', {}).get('cache_write_tokens', 0) for row in attempts)
    lines = [f"# Flujo de conversación test {record['case']} — {record['date']}", '',
        f"Modelo solicitado: **gpt-6-luna**, esfuerzo **{record['effort']}**.",
        f"Estado: **{record['status']}**. Inicio UTC: `{record['started_at']}`.",
        f"Preview aislado: {record.get('deployment', 'no disponible')}.", '',
        '## Alcance y configuración', '',
        'Prueba E2E HTTP real del pipeline de la app: sesión/cookie → API Python → autorización atómica en Supabase → OpenAI Responses → validación → plantilla y acción → cierre. No utiliza mocks ni una llamada directa al modelo para simular el chat. No automatiza el DOM, los tooltips ni mide el tiempo de revelado de React.',
        'La solicitud explícita del usuario autoriza estas dos pruebas reales como excepción puntual a la política general de unitarias de AGENTS.md.',
        'Se usa el mismo guion de diez mensajes, una identidad independiente por caso y el mismo contrato del frontend de hasta 12 mensajes de contexto.',
        'Solo estos Previews configuran `reasoning.effort=low/high`, `max_output_tokens=25000`, plazo de OpenAI de 25 s y métricas habilitadas. El valor normal de la app sigue siendo 256 tokens, 15 s y sin cambio del modelo público. El margen mayor incluye razonamiento, evita truncarlo artificialmente y está incorporado en la reserva de presupuesto.',
        'El presupuesto global autorizado sigue siendo US$3/día. Las reservas conservadoras no son el costo facturado de los tokens.', '',
        '## Tarifas y conversión', '',
        f"Tarifas estándar por millón de tokens: entrada US${sources['pricing']['usd_per_million_input']}; entrada en caché US${sources['pricing']['usd_per_million_cached_input']}; escritura explícita de caché US${sources['pricing']['usd_per_million_cache_write']}; salida US${sources['pricing']['usd_per_million_output']}.",
        f"Fuente: [OpenAI, GPT-6 Luna]({sources['pricing']['source_url']}), consultada {sources['retrieved_date']}.",
        f"Conversión: **1 USD = {sources['fx']['clp_per_usd']} CLP**, dólar observado del {sources['fx']['date']}. [Banco Central]({sources['fx']['source_url']}).",
        'Costo USD = (entrada no cacheada × tarifa entrada + lectura caché × tarifa caché + escritura caché × tarifa escritura + salida × tarifa salida) / 1.000.000. Los tokens de razonamiento ya forman parte de salida: no se cobran dos veces.',
        'Son costos calculados a partir de usage real y tarifas publicadas, no una factura liquidada. No incluyen impuestos, comisión/tipo de cambio de tarjeta, Vercel ni Supabase. La duración incluye la CLI, autenticación/protección de Vercel y red; no es latencia pura de OpenAI.', '',
        '## Consumo por ronda', '',
        '| Ronda | HTTP / resultado | Entrada | Lectura caché | Escritura caché | Salida | Razonamiento (incluido) | Tokens totales | USD | CLP | Duración ms |',
        '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |']
    for row in rounds:
        u, cost = row.get('usage', {}), row.get('cost') or {}
        extras = [item for item in record.get('extra_attempts', []) if item['step'] == row['step']]
        status = f"{row.get('http_status')} / {row.get('status')}"
        duration = row.get('duration_ms')
        if extras:
            parts = [row]+extras
            u = {key: sum(item['usage'].get(key,0) for item in parts) for key in ('input_tokens','output_tokens','total_tokens')}
            u['input_tokens_details'] = {key: sum(item['usage'].get('input_tokens_details',{}).get(key,0) for item in parts) for key in ('cached_tokens','cache_write_tokens')}
            u['output_tokens_details'] = {'reasoning_tokens':sum(item['usage'].get('output_tokens_details',{}).get('reasoning_tokens',0) for item in parts)}
            cost = {key: str(sum((Decimal(item['cost'][key]) for item in parts),Decimal(0))) for key in ('usd','clp')}
            status += f" (+{len(extras)} intento fallido)"
            duration = sum(item['duration_ms'] for item in parts)
        lines.append(f"| {row['step']} | {status} | {u.get('input_tokens', 'N/D')} | {u.get('input_tokens_details', {}).get('cached_tokens', 'N/D')} | {u.get('input_tokens_details', {}).get('cache_write_tokens', 0)} | {u.get('output_tokens', 'N/D')} | {u.get('output_tokens_details', {}).get('reasoning_tokens', 'N/D')} | {u.get('total_tokens', 'N/D')} | {fmt(cost.get('usd'))} | {fmt(cost.get('clp'), 6)} | {duration} |")
    lines.extend(['', '## Total de la interacción', '',
        f"- Pasos de conversación: {len(rounds)}/10; respuestas entregadas: {sum(row.get('status') == 'completed' for row in rounds)}; intentos de proveedor contabilizados: {len(attempts)}.",
        f"- Tokens medidos: entrada **{tokens['input_tokens']}**, salida **{tokens['output_tokens']}**, total **{tokens['total_tokens']}**.",
        f"- Subconjuntos incluidos en los totales: **{reasoning}** tokens de razonamiento en salida; **{cached}** de lectura de caché y **{written}** de escritura de caché en entrada. No se suman otra vez al total.",
        f"- {'Costo total calculado' if total_known else 'Subtotal medido (total no determinable con los datos disponibles)'}: **US${fmt(measured_usd)} / CLP ${fmt(measured_clp, 6)}**.",
        f"- Intentos con usage y costo determinables: {len(known)}/{len(attempts)}. `N/D` significa no medido; no equivale a costo cero.", '',
        '## Conversación registrada', ''])
    for row in rounds:
        lines.extend([f"### Paso {row['step']}", '', f"**Visitante:** {row['prompt']}", '',
            f"**Asistente:** {row.get('reply') or '(No se entregó una respuesta)'}", '',
            f"Decisión: `{row.get('topic')}` / `{row.get('action')}`. Contadores: {row.get('completed_rounds')} respuestas, {row.get('provider_attempts')} intentos.",
            f"Modelo devuelto: `{row.get('usage', {}).get('actual_model')}`. Servicio: `{row.get('usage', {}).get('service_tier')}`.", ''])
    if record.get('incident'):
        lines.extend(['## Incidencia real y recuperación explícita', '', record['incident'], '',
            'La tabla principal agrega en la ronda 8 el intento inicial fallido y el reintento que entregó la respuesta. El intento inicial siguiente se desglosa aquí, pero **ya está incluido** en la fila 8 y en los totales; no debe sumarse de nuevo:', '',
            '| Paso / intento adicional | Estado | Entrada | Salida | Total tokens | USD | CLP |',
            '| --- | --- | ---: | ---: | ---: | ---: | ---: |'])
        for row in record.get('extra_attempts', []):
            usage, cost = row.get('usage', {}), row.get('cost') or {}
            lines.append(f"| {row['step']} / inicial | {row['status']} | {usage.get('input_tokens')} | {usage.get('output_tokens')} | {usage.get('total_tokens')} | {fmt(cost.get('usd'))} | {fmt(cost.get('clp'),6)} |")
            lines.extend(['', f"**Visitante, intento inicial del paso {row['step']}:** {row['prompt']}", '',
                          f"**Resultado:** HTTP {row.get('http_status')}, `{row['status']}`. OpenAI devolvió usage, pero no se entregó una respuesta guardada al visitante.", ''])
        for event in record.get('blocked_transport_events', []):
            lines.extend([f"**Visitante, envío bloqueado del paso {event['step']}:** {event['prompt']}", '',
                f"**Resultado:** HTTP {event.get('http_status')}, `{event['status']}`. La reserva activa bloqueó la llamada al proveedor; no se contó como ronda completada. Se conservó el evento en `before_explicit_recovery.json`.", ''])
        lines.append('Tras consultar el ID original, el servidor devolvió `uncertain` sin repetir OpenAI. El operador inició un nuevo intento explícito para el paso 8; no hubo reintento automático del proveedor. Después se completaron los pasos 9 y 10.\n')
    lines.extend(['## Comprobaciones adicionales', ''])
    for check in record.get('checks', []):
        lines.append(f"- **{check['name']}**: {'APROBADO' if check['passed'] else 'FALLÓ'} — {check.get('detail', '')}")
    if record.get('error'):
        lines.extend(['', '## Incidencia', '', record['error']])
    lines.extend(['', '## Evidencia y reproducibilidad', '',
        f"Script independiente: `scripts/test_{record['case']}_luna_{record['effort']}.py`.",
        f"Registro JSON: `evidence/test-{record['case']}-{record['run_id']}/run.json`; configuración de despliegue en el mismo directorio. Fuentes en `evidence/sources.json`.",
        'Las cookies y los archivos transitorios de transporte quedan fuera de los informes, en `.preview/chatbot-testing`. No se incluyen claves ni bypass de Vercel.',
        'Una ejecución por esfuerzo no permite afirmar superioridad estadística, igualdad de inferencia ni cubrir los 30 escenarios por consumo exigidos para estudiar coreografías de carga.', ''])
    path.write_text('\n'.join(lines), encoding='utf-8')


def run_case(case, effort):
    parser = argparse.ArgumentParser()
    parser.add_argument('--deployment', help='Reuse an isolated Preview configured for this effort')
    args = parser.parse_args()
    sources = json.loads((WORK / 'evidence/sources.json').read_text(encoding='utf-8'))
    available = json.loads((WORK / 'evidence/model_availability.json').read_text(encoding='utf-8'))
    if not available.get('available'):
        raise SystemExit('Requested Luna model is unavailable; no paid request was sent.')
    run_id = str(uuid4())
    evidence = WORK / 'evidence' / f'test-{case}-{run_id}'
    evidence.mkdir(parents=True, exist_ok=True)
    date = datetime.now(ZoneInfo('America/Santiago')).date().isoformat()
    report_path = WORK / f'flujo de conversación test {case} {date}.md'
    record = {'case': case, 'effort': effort, 'run_id': run_id, 'date': date,
              'started_at': datetime.now(timezone.utc).isoformat(), 'status': 'EN CURSO', 'rounds': [], 'checks': []}

    def persist():
        dump(evidence / 'run.json', record)
        write_report(record, sources, report_path)

    def check(name, passed, detail=''):
        record['checks'].append({'name': name, 'passed': bool(passed), 'detail': detail})
        persist()

    persist()
    try:
        record['deployment'] = args.deployment or deploy(effort, evidence)
        api = Pipeline(record['deployment'], case, run_id)
        initial = api.request()
        configuration = initial['body'].get('testing_configuration', {})
        valid = initial['http_status'] == 200 and initial['body'].get('provider_enabled') and configuration.get('model') == 'gpt-6-luna' and configuration.get('reasoning_effort') == effort
        check('Sesión y configuración del esfuerzo', valid, f"HTTP {initial['http_status']}; configuración {json.dumps(configuration)}")
        if not valid:
            raise RuntimeError('The Preview did not confirm the requested model/effort; no provider request was sent.')
        conversation = initial['body']['state']['conversation_id']
        record['conversation_id'] = conversation
        messages = [dict(WELCOME)]
        last_payload = None
        for step, prompt in enumerate(PROMPTS, 1):
            messages.append({'role': 'user', 'content': prompt})
            payload = {'operation': 'send', 'conversation_id': conversation, 'request_id': str(uuid4()), 'messages': messages[-12:]}
            last_payload = payload
            response = api.request(payload=payload)
            dump(evidence / f'step-{step:02d}.response.json', response)
            body = response['body']
            decision, state = body.get('result') or {}, body.get('state') or {}
            usage = body.get('testing_usage') or {}
            row = {'step': step, 'prompt': prompt, 'request_id': payload['request_id'], 'http_status': response['http_status'],
                   'status': body.get('status'), 'duration_ms': response['duration_ms'], 'reply': decision.get('reply'),
                   'topic': decision.get('topic'), 'action': decision.get('action'),
                   'completed_rounds': state.get('completed_rounds'), 'provider_attempts': state.get('provider_attempts'),
                   'closed': state.get('closed'), 'usage': usage, 'cost': calculate_cost(usage, sources)}
            record['rounds'].append(row)
            if body.get('status') == 'completed' and decision.get('reply'):
                messages.append({'role': 'assistant', 'content': decision['reply']})
            persist()
            print(f"Test {case} / {effort} / step {step}: HTTP {response['http_status']} {body.get('status')}; tokens={usage.get('total_tokens', 'unknown')}", flush=True)
        final_state = api.request()['body'].get('state', {})
        closed = final_state.get('closed') and final_state.get('completed_rounds') == 10
        check('Diez respuestas y cierre', closed, f"completed_rounds={final_state.get('completed_rounds')}, closed={final_state.get('closed')}")
        before = final_state.get('provider_attempts')
        if closed:
            eleventh = api.request(payload={'operation': 'send', 'conversation_id': conversation, 'request_id': str(uuid4()),
                'messages': [{'role': 'user', 'content': 'Quiero hacer una pregunta adicional.'}]})['body']
            check('Intento 11 sin llamada al proveedor', eleventh.get('status') == 'conversation_closed' and eleventh.get('state', {}).get('provider_attempts') == before,
                  f"status={eleventh.get('status')}; intentos={eleventh.get('state', {}).get('provider_attempts')}")
            replay = api.request(payload=last_payload)['body']
            check('Repetición idempotente de ronda 10', replay.get('status') == 'completed' and replay.get('result', {}).get('reply') == record['rounds'][-1]['reply']
                  and replay.get('state', {}).get('provider_attempts') == before, 'Mismo request_id; sin incremento de intentos.')
            opened = api.request(payload={'operation': 'start_capture', 'conversation_id': conversation})['body']
            check('Captura disponible después del cierre', opened.get('state', {}).get('capturing'), 'Comando local, sin OpenAI.')
            lead_id = str(uuid4())
            preference = 'phone' if case == 1 else 'video_call'
            contact = {'source': 'chatbot', 'interest': 'consultation', 'conversation_id': conversation, 'request_id': lead_id,
                'values': {'name': f'Chatbot Testing Test {case} {date} {run_id[:8]}', 'phone': f'+5690000010{case}',
                           'email': '' if case == 1 else 'qa-luna-high@example.invalid', 'contactPreference': preference},
                'privacyConsent': True, 'contactConsent': True, 'updatesConsent': False}
            saved = api.request('/api/interests', contact)
            repeated = api.request('/api/interests', contact)
            record['lead_request_id'] = lead_id
            check('Guardado de contacto ficticio autorizado', saved['http_status'] == 201 and saved['body'].get('status') == 'saved', f'Preferencia {preference}; lead_request_id={lead_id}.')
            check('Reintento del contacto sin duplicar', repeated['http_status'] == 201 and repeated['body'].get('status') == 'saved', 'Se reutilizó el identificador de guardado; comprobar unicidad en Supabase.')
            recovered = api.request()['body'].get('state', {})
            check('Cuotas conservadas después de guardar', recovered.get('completed_rounds') == 10 and recovered.get('provider_attempts') == before and not recovered.get('capturing'), 'Sin nuevas rondas ni intentos durante la captura.')
        record['status'] = 'APROBADO' if closed and all(item['passed'] for item in record['checks']) else 'CON FALLOS'
        if any(row.get('cost') is None for row in record['rounds']):
            record['status'] = 'CON FALLOS O CONSUMO NO DETERMINABLE'
        return 0 if record['status'] == 'APROBADO' else 1
    except Exception as error:
        record['status'] = 'INTERRUMPIDO'
        record['error'] = safe_error(str(error))
        print(f"Test {case} interrupted: {record['error']}", flush=True)
        return 1
    finally:
        record['finished_at'] = datetime.now(timezone.utc).isoformat()
        persist()
        print(f'Report: {report_path.name}', flush=True)
