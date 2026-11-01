"""Server-only adapter. Its RPC must be deployed and reviewed before enabling."""
import os
from backend.chat_store import rpc, StoreUnavailable


class MarketingStore:
    def apply_batch(self, batch):
        if os.environ.get('MARKETING_LEDGER_ENABLED') != 'true':
            raise StoreUnavailable('marketing_ledger_disabled')
        result = rpc('marketing_import_batch', {'p_batch': batch})
        if result.get('status') != 'applied':
            raise StoreUnavailable('marketing_batch_not_applied')
        return result
