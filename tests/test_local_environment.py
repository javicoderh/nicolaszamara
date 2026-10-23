import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from backend.local_environment import load_local_environment


class LocalEnvironmentTests(unittest.TestCase):
    def test_loads_server_settings_without_overriding_process_or_executing_values(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {'OPENAI_MODEL': 'process-model'}, clear=True):
            root = Path(directory)
            (root / '.env.local').write_text('OPENAI_API_KEY="unit-key"\nOPENAI_MODEL=file-model\nVERCEL_OIDC_TOKEN=ignored\nCHAT_COOKIE_SECRET=$(literal)\n', encoding='utf-8')
            (root / '.env').write_text('OPENAI_API_KEY=fallback\nAPP_ENV=development\n', encoding='utf-8')
            load_local_environment(root)
            self.assertEqual(os.environ['OPENAI_API_KEY'], 'unit-key')
            self.assertEqual(os.environ['OPENAI_MODEL'], 'process-model')
            self.assertEqual(os.environ['CHAT_COOKIE_SECRET'], '$(literal)')
            self.assertEqual(os.environ['APP_ENV'], 'development')
            self.assertNotIn('VERCEL_OIDC_TOKEN', os.environ)

    def test_missing_local_files_do_not_create_settings(self):
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {}, clear=True):
            load_local_environment(directory)
            self.assertNotIn('OPENAI_API_KEY', os.environ)
