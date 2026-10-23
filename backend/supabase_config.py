"""Public project configuration. This key grants insert-only access via RLS.

The original public forms need no privileged key. The setter uses a separate
SUPABASE_SECRET_KEY environment variable in its server-only RPC adapter.
Optional SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY override these public values.
"""
PROJECT_URL = "https://vsbolndzzkrhadprdlto.supabase.co"
PUBLISHABLE_KEY = "sb_publishable_Xy6M7bnKUS5FOfL4yLHA-w_4OgENEGD"
