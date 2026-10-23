"""Bounded relative paths only: never store query strings or URL fragments."""
import re


def source_path(value):
    if not isinstance(value, str) or not re.fullmatch(r'/[A-Za-z0-9/_-]{0,119}', value) or '//' in value:
        raise ValueError('Invalid source path')
    return value.rstrip('/') or '/'
