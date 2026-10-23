"""Explicit diagnostic continuation after the observed persistence failure.

This is not an automatic provider retry in the application: the operator invokes
the script explicitly, inspects the existing request and creates one new attempt.
"""
from datetime import datetime, timezone
import json
from pathlib import Path
from uuid import uuid4

from pipeline_common import WORK, PRIVATE, PROMPTS, WELCOME, Pipeline, calculate_cost, dump, write_report


def resume_high():
    sources = json.loads((WORK / 'evidence/sources.json').read_text(encoding='utf-8'))
    candidates = [(path, json.loads(path.read_text(encoding='utf-8'))) for path in (WORK / 'evidence').glob('test-2-*/run.json')]
    path, record = max((pair for pair in candidates if not pair[1].get('excluded_reason')), key=lambda pair: pair[0].stat().st_mtime)
    archive = path.parent / 'before_explicit_recovery.json'
    if not archive.exists():
        archive.write_bytes(path.read_bytes())
    api = Pipeline(record['deployment'], 2, record['run_id'])
    # Reuse the original session but never overwrite the original request evidence.
    api.sequence = 100
    record['incident_checks'] = list(record['checks'])
    record['checks'] = []
    failed = [row for row in record['rounds'] if row['status'] != 'completed']
    record['extra_attempts'] = [row for row in failed if row.get('usage', {}).get('total_tokens') is not None]
    record['blocked_transport_events'] = [row for row in failed if not row.get('usage')]
    record['rounds'] = [row for row in record['rounds'] if row['status'] == 'completed']
    record['status'] = 'RECUPERACION EXPLICITA EN CURSO'
    record['incident'] = 'La ronda 8 recibió HTTP 503 storage_unavailable después de OpenAI. Su respuesta no se persistió; los pasos 9 y 10 recibieron pending y no llamaron al proveedor. Se preserva el consumo del intento fallido. Tras vencer la reserva, el operador consulta el mismo ID y realiza un solo reintento nuevo explícito para completar las diez respuestas.'
    target = WORK / f"flujo de conversación test 2 {record['date']}.md"

    def persist():
        dump(path, record)
        write_report(record, sources, target)

    def check(name, passed, detail=''):
        record['checks'].append({'name': name, 'passed': bool(passed), 'detail': detail})
        persist()
        if not passed:
            raise RuntimeError(name + ': ' + detail)

    try:
        session = api.request()['body']
        state = session.get('state', {})
        conversation = record['conversation_id']
        check('Sesión original recuperada', state.get('conversation_id') == conversation and state.get('completed_rounds') == 7,
              f"Respuestas={state.get('completed_rounds')}; intentos={state.get('provider_attempts')}; busy={state.get('busy')}")
        if state.get('busy'):
            raise RuntimeError('Reservation still pending. No provider request was repeated.')
        # The original payload was retained in the private transport directory.
        failed_id = record['extra_attempts'][0]['request_id']
        original = None
        for request_path in api.private.glob('*.request.json'):
            value = json.loads(request_path.read_text(encoding='utf-8'))
            if value.get('request_id') == failed_id:
                original = value
                break
        if not original:
            raise RuntimeError('Original request not found; no replay was sent.')
        replay = api.request(payload=original)['body']
        check('Intento incierto no reenvía al modelo', replay.get('status') == 'uncertain' and replay.get('state', {}).get('provider_attempts') == 8,
              f"status={replay.get('status')}; intentos={replay.get('state', {}).get('provider_attempts')}")
        messages = [dict(WELCOME)]
        for row in record['rounds']:
            messages.extend([{'role': 'user', 'content': row['prompt']}, {'role': 'assistant', 'content': row['reply']}])
        last_payload = None
        for step in (8, 9, 10):
            prompt = PROMPTS[step-1]
            messages.append({'role': 'user', 'content': prompt})
            payload = {'operation': 'send', 'conversation_id': conversation, 'request_id': str(uuid4()), 'messages': messages[-12:]}
            last_payload = payload
            response = api.request(payload=payload)
            dump(path.parent / f'step-{step:02d}.recovery.response.json', response)
            body = response['body']
            decision, state = body.get('result') or {}, body.get('state') or {}
            usage = body.get('testing_usage') or {}
            row = {'step': step, 'prompt': prompt, 'request_id': payload['request_id'], 'http_status': response['http_status'],
                   'status': body.get('status'), 'duration_ms': response['duration_ms'], 'reply': decision.get('reply'),
                   'topic': decision.get('topic'), 'action': decision.get('action'),
                   'completed_rounds': state.get('completed_rounds'), 'provider_attempts': state.get('provider_attempts'),
                   'closed': state.get('closed'), 'usage': usage, 'cost': calculate_cost(usage, sources)}
            record['rounds'].append(row)
            persist()
            print(f"High explicit continuation / step {step}: HTTP {response['http_status']} {body.get('status')}; tokens={usage.get('total_tokens', 'unknown')}", flush=True)
            if body.get('status') != 'completed':
                raise RuntimeError('Continuation did not complete. No further provider retry was made.')
            messages.append({'role': 'assistant', 'content': decision['reply']})
        check('Diez respuestas tras la recuperación explícita', state.get('completed_rounds') == 10 and state.get('closed') and state.get('provider_attempts') == 11,
              '10 respuestas entregadas, 11 intentos de proveedor; uno incierto conservado y cobrado en el informe.')
        eleventh = api.request(payload={'operation': 'send', 'conversation_id': conversation, 'request_id': str(uuid4()),
            'messages': [{'role': 'user', 'content': 'Quiero hacer otra pregunta.'}]})['body']
        check('Intento 11 de conversación cerrado sin nueva llamada', eleventh.get('status') == 'conversation_closed' and eleventh.get('state', {}).get('provider_attempts') == 11,
              'La cifra 11 de provider_attempts incluye el intento incierto, no otra respuesta después del cierre.')
        replay = api.request(payload=last_payload)['body']
        check('Replay de ronda 10 sin duplicar consumo', replay.get('status') == 'completed' and replay.get('state', {}).get('provider_attempts') == 11)
        opened = api.request(payload={'operation': 'start_capture', 'conversation_id': conversation})['body']
        check('Captura disponible después del cierre', opened.get('state', {}).get('capturing'))
        lead_id = str(uuid4())
        contact = {'source': 'chatbot', 'interest': 'consultation', 'conversation_id': conversation, 'request_id': lead_id,
            'values': {'name': f"Chatbot Testing Test 2 {record['date']} {record['run_id'][:8]}", 'phone': '+56900000102',
                       'email': 'qa-luna-high@example.invalid', 'contactPreference': 'video_call'},
            'privacyConsent': True, 'contactConsent': True, 'updatesConsent': False}
        saved = api.request('/api/interests', contact)
        repeated = api.request('/api/interests', contact)
        record['lead_request_id'] = lead_id
        check('Contacto ficticio autorizado guardado', saved['http_status'] == 201 and saved['body'].get('status') == 'saved', f'lead_request_id={lead_id}; video_call.')
        check('Guardado repetido sin duplicado', repeated['http_status'] == 201 and repeated['body'].get('status') == 'saved')
        final_state = api.request()['body'].get('state', {})
        check('Cuotas conservadas tras el contacto', final_state.get('completed_rounds') == 10 and final_state.get('provider_attempts') == 11 and not final_state.get('capturing'))
        record['status'] = 'COMPLETADO CON INCIDENCIA DE PERSISTENCIA Y RECUPERACION EXPLICITA'
        return 0
    except Exception as error:
        record['status'] = 'RECUPERACION INTERRUMPIDA'
        record['error'] = str(error)
        print(str(error), flush=True)
        return 1
    finally:
        record['finished_at'] = datetime.now(timezone.utc).isoformat()
        persist()


if __name__ == '__main__':
    raise SystemExit(resume_high())
