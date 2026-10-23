"""Apply an explicit editorial decision using the server-only Supabase key."""
import argparse
import json
from pathlib import Path
import sys
from uuid import UUID

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.local_environment import load_local_environment
from backend.chat_store import rpc, StoreUnavailable


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--id', required=True, type=UUID)
    parser.add_argument('--reviewer', required=True)
    decision = parser.add_mutually_exclusive_group(required=True)
    decision.add_argument('--approve-file', type=Path, help='Reviewed JSON with question, answer and topic')
    decision.add_argument('--reject', action='store_true')
    args = parser.parse_args()
    values = {'p_id': str(args.id), 'p_approve': bool(args.approve_file), 'p_reviewer': args.reviewer.strip()}
    if not values['p_reviewer']:
        parser.error('Reviewer must not be empty')
    if args.approve_file:
        reviewed = json.loads(args.approve_file.read_text(encoding='utf-8-sig'))
        if set(reviewed) != {'question', 'answer', 'topic'}:
            parser.error('Expected exactly question, answer and topic')
        for key, minimum, maximum in (('question', 5, 500), ('answer', 10, 1000)):
            if not isinstance(reviewed[key], str) or not minimum <= len(reviewed[key].strip()) <= maximum:
                parser.error('Invalid ' + key)
        if reviewed['topic'] not in ('consultation', 'therapies', 'course', 'online', 'nature', 'unknown'):
            parser.error('Invalid topic')
        values.update({f'p_{key}': value for key, value in reviewed.items()})
    load_local_environment()
    try:
        result = rpc('setter_feedback_review', values)
    except StoreUnavailable:
        raise SystemExit('No se pudo confirmar la revisión; comprueba la conexión y la configuración.') from None
    print(json.dumps({'status': result.get('status')}, ensure_ascii=False))
    if result.get('status') not in ('approved', 'rejected'):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
