"""Shared contact validation for public interests and setter capture."""
import json
import re
from pathlib import Path

CONTACT_CONFIG = json.loads((Path(__file__).resolve().parents[1] / 'config/interests/contact.config.json').read_text(encoding='utf-8'))
PRIVACY_VERSION = CONTACT_CONFIG['privacy_version']
PREFERENCES = {option['value'] for option in CONTACT_CONFIG['preferences']}


def normalize_contact(values):
    preference, phone, email = values.get('contactPreference'), values.get('phone'), values.get('email', '')
    if not isinstance(preference, str) or preference not in PREFERENCES:
        raise ValueError('Choose a contact preference')
    if not isinstance(phone, str) or len(phone) > 30:
        raise ValueError('Invalid phone')
    phone = re.sub(r'[ ()-]', '', phone.strip())
    if not re.fullmatch(r'\+[1-9][0-9]{6,14}', phone):
        raise ValueError('Use an international phone number')
    if not isinstance(email, str):
        raise ValueError('Invalid email')
    email = email.strip().lower()
    if len(email) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
        raise ValueError('Invalid email')
    return {'phone': phone, 'email': email, 'contact_preference': preference}
