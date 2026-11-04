import copy
import json
import posixpath
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'

with zipfile.ZipFile(ROOT / 'source-prices.xlsx') as archive:
    workbook = ET.fromstring(archive.read('xl/workbook.xml'))
    sheet = next(s for s in workbook.find('s:sheets', NS) if s.attrib['name'] == 'Harga Jual')
    relationships = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
    target = next(r.attrib['Target'] for r in relationships if r.attrib['Id'] == sheet.attrib[REL])
    sheet_path = posixpath.normpath(posixpath.join('xl', target))
    shared = ET.fromstring(archive.read('xl/sharedStrings.xml'))
    strings = [''.join(si.itertext()) for si in shared]
    sheet_xml = ET.fromstring(archive.read(sheet_path))
    rows = []
    for row in sheet_xml.findall('s:sheetData/s:row', NS):
        values = {}
        for cell in row.findall('s:c', NS):
            ref = cell.attrib['r']
            column = ''.join(c for c in ref if c.isalpha())
            val = cell.find('s:v', NS)
            raw = val.text if val is not None else None
            if cell.attrib.get('t') == 's':
                value = strings[int(raw)]
            elif cell.attrib.get('t') == 'inlineStr':
                value = ''.join(cell.find('s:is', NS).itertext())
            elif raw is not None and cell.attrib.get('t') not in ('str', 'e', 'b'):
                value = float(raw)
                if value.is_integer():
                    value = int(value)
            else:
                value = raw
            values[column] = value
        rows.append({'row': int(row.attrib['r']), 'values': values})

header = next(row for row in rows if row['values'].get('A') == 'SKU')
assert header['values']['B'] == 'Nama produk / pilihan pembelian'
assert header['values']['C'] == 'Isi unit jual'
assert header['values']['J'] == 'Harga jual usulan'
source = []
for row in rows:
    values = row['values']
    if row['row'] > header['row'] and isinstance(values.get('A'), str) and isinstance(values.get('C'), (int, float)) and isinstance(values.get('J'), (int, float)):
        source.append({'row': row['row'], 'sku': values['A'], 'name': values.get('B'), 'sellUnitQty': values['C'], 'price': values['J']})

prices = {}
for row in source:
    key = (row['sku'], row['sellUnitQty'])
    assert key not in prices, f'Duplicate SKU/unit: {key}'
    assert isinstance(row['price'], int) and row['price'] > 0, row
    prices[key] = row

original = json.loads((ROOT / 'database-original.json').read_text(encoding='utf-8-sig'))
updated = copy.deepcopy(original)
matched = []
for product in updated['catalog']:
    if product.get('type') != 'robotika':
        continue
    # Existing catalog descriptions identify all entries as unit sales.
    # Case-sensitive SKU distinguishes MOTOR (motor) from Motor (motor + wheel).
    key = (product['sku'], 1)
    assert key in prices, f'Unmatched catalog product: {product["id"]} {key}'
    row = prices[key]
    matched.append({'id': product['id'], 'sku': product['sku'], 'catalogName': product['name'], 'sourceName': row['name'], 'sourceRow': row['row'], 'oldPrice': product['price'], 'newPrice': row['price']})
    product['price'] = row['price']
    product['suggested_price'] = row['price']

assert len(matched) == 68
assert len(updated['catalog']) == len(original['catalog']) == 69
for key in original:
    if key != 'catalog':
        assert updated[key] == original[key], f'Unexpected root change: {key}'
for before, after in zip(original['catalog'], updated['catalog']):
    assert before.keys() == after.keys()
    for key in before:
        if before.get('type') == 'robotika' and key in ('price', 'suggested_price'):
            assert after[key] == prices[(before['sku'], 1)]['price']
        else:
            assert before[key] == after[key], f'Unexpected change {before["id"]}.{key}'

output = ROOT / 'database-harga-robotika-terbaru.json'
output.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
assert json.loads(output.read_text(encoding='utf-8')) == updated
report = {'sheet': 'Harga Jual', 'priceColumn': 'J', 'priceHeader': header['values']['J'], 'headerRow': header['row'], 'sourceRows': source, 'matchedProducts': matched, 'changedCount': sum(row['oldPrice'] != row['newPrice'] for row in matched)}
(ROOT / 'price-change-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'output': str(output), 'sourceRows': len(source), 'matchedProducts': len(matched), 'changedCount': report['changedCount'], 'changes': [row for row in matched if row['oldPrice'] != row['newPrice']]}, ensure_ascii=False, indent=2))
