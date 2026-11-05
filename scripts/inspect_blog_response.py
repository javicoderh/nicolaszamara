"""Inspect an existing provider response without submitting new inference."""
import argparse
import json
from backend.local_environment import load_local_environment
from backend.blog_provider import OpenAIArticleProvider, ProviderUnavailable, extract_output
from backend.blog_contract import brief, InvalidBlog


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('response_id')
    args = parser.parse_args(argv)
    load_local_environment()
    try:
        response = OpenAIArticleProvider().poll(args.response_id)
        if response.get('status') != 'completed':
            print(json.dumps({'status': 'pending', 'provider_status': response.get('status')}))
            return 1
        output = extract_output(response)
        validated = brief(output)
        print(json.dumps({'status': 'valid_brief', 'warnings':validated.get('editorialWarnings',[]), 'new_inference_requests': 0}))
        return 0
    except (InvalidBlog, ProviderUnavailable) as error:
        print(json.dumps({'status': 'invalid_or_unavailable', 'error': str(error), 'new_inference_requests': 0}))
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
