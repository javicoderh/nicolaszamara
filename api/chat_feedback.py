"""Retired feedback endpoint. Historical records remain private."""
from api.interests import handler as InterestHandler


class handler(InterestHandler):
    def do_POST(self):
        self.reply(410, {'status': 'retired'})
