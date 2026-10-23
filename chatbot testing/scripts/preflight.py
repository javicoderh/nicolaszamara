"""Read model availability and FX metadata. Does not create model responses."""
import json
import os
from pathlib import Path
import sys
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from backend.local_environment import load_local_environment

load_local_environment(ROOT)
evidence = ROOT / 'chatbot testing' / 'evidence'
evidence.mkdir(exist_ok=True)
model_request = Request('https://api.openai.com/v1/models/gpt-6-luna',
                        headers={'Authorization': 'Bearer ' + os.environ['OPENAI_API_KEY']})
try:
    with urlopen(model_request, timeout=30) as response:
        model = json.load(response)
    availability = {'available': True, 'id': model.get('id')}
except HTTPError as error:
    try:
        detail = json.loads(error.read()).get('error', {})
    except (ValueError, AttributeError):
        detail = {}
    availability = {'available': False, 'http_status': error.code, 'code': detail.get('code'), 'type': detail.get('type')}
(evidence / 'model_availability.json').write_text(json.dumps(availability, ensure_ascii=False, indent=2), encoding='utf-8')
print('Model metadata: ' + json.dumps(availability), flush=True)

fx_url = 'https://mindicador.cl/api/dolar/23-10-2026'
try:
    with urlopen(Request(fx_url, headers={'User-Agent': 'NicolasZamara-ChatbotTesting/1.0'}), timeout=30) as response:
        fx = json.load(response)
    (evidence / 'fx_response.json').write_text(json.dumps({'source_url': fx_url, 'response': fx}, ensure_ascii=False, indent=2), encoding='utf-8')
    print('FX: ' + json.dumps({'date': (fx.get('serie') or [{}])[0].get('fecha'), 'value': (fx.get('serie') or [{}])[0].get('valor')}))
except Exception as error:
    (evidence / 'fx_response.json').write_text(json.dumps({'source_url': fx_url, 'error_type': type(error).__name__}), encoding='utf-8')
    print('FX unavailable: ' + type(error).__name__)
