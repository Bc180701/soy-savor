"""Run the actual PHP ticket renderers against isolated fictitious queues, never live ones."""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


class TicketSlotTests(unittest.TestCase):
    def test_every_template_preserves_1145_in_winter_summer_and_legacy_local_format(self):
        templates = [
            ('Test_print_chateaurenard.php', 'print-queue-chateaurenard'),
            ('Test_print_st_martin.php', 'print-queue-st-martin'),
            ('Test_print.php', 'print-queue'),
        ]
        slots = [
            ('2026-11-24T10:45:00.000Z', '24/11/2026 11:45'),
            ('2026-07-24T09:45:00.000Z', '24/07/2026 11:45'),
            ('2026-11-24T11:45:00', '24/11/2026 11:45'),
            ('2026-07-24T11:45:00', '24/07/2026 11:45'),
        ]
        for template, queue in templates:
            for slot, expected in slots:
                with self.subTest(template=template, slot=slot), tempfile.TemporaryDirectory() as tmp:
                    directory = Path(tmp)
                    shutil.copy(ROOT / 'server-files' / template, directory / template)
                    shutil.copy(ROOT / 'server-files/order-time.php', directory / 'order-time.php')
                    (directory / queue).mkdir()
                    order = dict(id='isolated-clock-test', scheduledFor=slot, orderType='pickup',
                                 clientName='TEST', clientPhone='', items=[], subtotal=0, tax=0, total=0)
                    (directory / queue / 'test.json').write_text(json.dumps(order))
                    xml = subprocess.run(['php', '-d', 'date.timezone=Pacific/Honolulu', template],
                                         cwd=directory, capture_output=True, text=True, check=True)
                    self.assertEqual(xml.stderr, '')
                    root = ET.fromstring(xml.stdout)
                    texts = [element.text for element in root.iter()
                             if element.tag.endswith('text')]
                    self.assertIn(expected, texts)


if __name__ == '__main__':
    unittest.main()