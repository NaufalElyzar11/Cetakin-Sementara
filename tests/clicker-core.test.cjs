const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../clicker-core.js');
const letters = (count) => C.normalize({ ...C.defaults(), mode: 'solid', keys: [...'ABCDEFG'].slice(0, count).map(C.makeKey) });
const symbolIds = ['love', 'star', 'flower', 'cloud', 'moon', 'lightning', 'paw', 'cat', 'bear', 'pumpkin', 'ghost', 'robot'].map((id) => `symbol-${id}`);
const symbolKey = (value, cap = 'white', ink = 'black') => ({ type: 'emoji', value, cap, ink });
const sharePayload = (version, keys) => '#desain=' + encodeURIComponent(JSON.stringify([version, 'compact', 'flower', 'blue', 'bungee', 3, keys, 'Hadiah & bungkus terpisah']));

test('all seven tiers use the current catalog price and quantity multiplier', () => {
  const expected = [14000, 17000, 21000, 26000, 30000, 34000, 37000];
  expected.forEach((unit, i) => { const state = letters(i + 1); state.quantity = 3; assert.deepEqual(C.price(state), { unit, total: unit * 3 }); });
});
test('each two-color symbol occupies one priced slot, independent of font or base style', () => {
  const state = C.defaults();
  state.keys[0] = symbolKey('symbol-cat');
  assert.equal(C.price(state).unit, 26000);
  assert.deepEqual(C.validate(state), []);
});
test('one-key designs use solid; imported values remain inside the printable catalog', () => {
  const s = C.normalize({ ...letters(1), mode: 'flexi', base: 'purple', font: '__proto__', shape: 'missing', quantity: 2.5 });
  assert.equal(s.mode, 'solid'); assert.equal(s.base, 'blue'); assert.equal(s.font, 'nunito'); assert.equal(s.shape, 'round'); assert.equal(s.quantity, 1);
  assert.throws(() => C.normalize({ keys: [] })); assert.throws(() => C.normalize({ keys: Array(8).fill(C.makeKey('A')) }));
});
test('missing letters and unsupported zero cannot be ordered; single-color raised lettering remains printable', () => {
  for (const value of ['', '0', '☻', 'AA', '<script>']) { const s = letters(1); s.keys[0].value = value; assert.ok(C.validate(s).length); assert.throws(() => C.message(s)); }
  const s = letters(1); s.keys[0].ink = s.keys[0].cap; assert.deepEqual(C.validate(s), []); assert.ok(C.preview(s).includes('stroke-opacity=".2"'));
});
test('inset symbols fit beside one another on every base', () => {
  for (const shape of Object.keys(C.assets.bases)) for (const mode of Object.keys(C.MODES)) {
    const s = C.normalize({ ...letters(2), shape, mode, keys: ['symbol-paw', 'symbol-robot'].map((value) => symbolKey(value)) });
    assert.deepEqual(C.validate(s), [], `${shape}/${mode}`);
    assert.ok(C.layout(s).pitch + C.assets.keycap.bounds[1] - C.assets.keycap.bounds[3] >= 1);
  }
});
test('valid mixed designs beside a letter remain available on solid', () => {
  const s = letters(2); s.keys[1] = symbolKey('symbol-ghost'); assert.deepEqual(C.validate(s), []);
});
test('share link roundtrip preserves ordered keys, individual colors, font, quantity and notes', () => {
  const s = C.defaults(); s.quantity = 99; s.note = 'Untuk hadiah & warna sesuai preview'; s.keys[0].cap = 'orange'; s.keys[1].ink = 'blue';
  s.keys[3] = symbolKey('symbol-paw', 'black', 'blue');
  assert.equal(JSON.parse(decodeURIComponent(C.encode(s).slice(8)))[0], 2);
  assert.deepEqual(C.decode(C.encode(s)), s);
  const url = new URL(C.designUrl(s, 'https://example.com/shop/clicker.html?from=test#old'));
  assert.equal(url.pathname, '/shop/clicker.html'); assert.equal(url.search, ''); assert.deepEqual(C.decode(url.hash), s);
});
test('malformed or excessive share payloads fail without executable markup', () => {
  assert.equal(C.decode('#pesanan'), null);
  for (const hash of ['#desain=%', '#desain=null', '#desain=%5B9%5D', '#desain=' + 'x'.repeat(12001)]) assert.throws(() => C.decode(hash));
  const s = C.normalize({ ...letters(1), keys: [{ type: 'letter', value: '<script>', cap: '__proto__', ink: 'orange' }] });
  assert.equal(s.keys[0].value, ''); assert.equal(s.keys[0].cap, 'white');
});
test('WhatsApp text gives admin every production choice and does not imply a sent order', () => {
  const s = C.defaults(); s.quantity = 2; s.note = 'Bungkus terpisah';
  const text = C.message(s, 'https://example.com/clicker.html');
  const love = C.assets.emojis['symbol-love'].label;
  for (const phrase of ['4 (huruf/angka/simbol)', 'dekat lubang gantungan ke bawah', `A / N / A / ${love}`, 'Flexi compact', 'Silinder Beralur', 'Sky blue', 'DynaPuff Bold', `4. ${love} | keycap Putih | simbol Orange`, '2 pcs', 'Rp26.000', 'Rp52.000', 'belum termasuk ongkir', 'Bungkus terpisah', 'https://example.com/clicker.html#desain=']) assert.ok(text.includes(phrase), phrase);
  assert.ok(!text.includes('mengikuti contoh katalog'));
  assert.equal(new URL('https://wa.me/6285822801431?text=' + encodeURIComponent(text)).searchParams.get('text'), text);
  assert.ok(!C.message(s, 'file:///clicker.html').includes('file:///'));
});
test('all three fonts provide paths for every supported glyph; only the twelve current symbols are offered', () => {
  for (const font of Object.keys(C.FONTS)) for (const value of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789') assert.ok(C.assets.glyphs[font][value].path);
  assert.deepEqual(Object.keys(C.assets.emojis), symbolIds);
  for (const emoji of Object.values(C.assets.emojis)) assert.ok(emoji.label && emoji.slug && emoji.outline && emoji.bounds.length === 4);
});
test('preview scales from one to seven keys and includes the actual selected character paths', () => {
  for (let count = 1; count <= 7; count++) { const svg = C.preview(letters(count)); assert.equal((svg.match(/data-key-index=/g) || []).length, count); assert.ok(svg.includes('<svg')); }
  const s = C.defaults(); assert.ok(C.preview(s).includes(C.assets.emojis['symbol-love'].outline));
});

test('six base shapes use the spacing and profiles of their CAD models', () => {
  assert.deepEqual(Object.keys(C.assets.bases), ['round', 'hex', 'gear', 'feet', 'love', 'flower']);
  for (const [shape, base] of Object.entries(C.assets.bases)) {
    const expected = ['love', 'flower'].includes(shape) ? [44, 44, 32.5] : [24, 33, 26.5];
    assert.deepEqual(['solid', 'flexi', 'compact'].map((mode) => base.profiles[mode].pitch), expected, shape);
    for (const mode of Object.keys(C.MODES)) {
      const state = C.normalize({ ...letters(2), shape, mode });
      assert.equal(C.layout(state), base.profiles[mode]);
      assert.ok(C.preview(state).includes(`translate(0,${base.profiles[mode].pitch})`));
    }
  }
});

test('connected CAD eyelets and the metal ring fit the preview for every shape, mode and count', () => {
  for (const [shape, base] of Object.entries(C.assets.bases)) {
    for (const mode of Object.keys(C.MODES)) {
      for (let count = mode === 'solid' ? 1 : 2; count <= 7; count++) {
        const state = C.normalize({ ...letters(count), shape, mode });
        const profile = C.layout(state);
        assert.equal(profile.headComponents, 1, `${shape}/${mode}/${count}`);
        assert.ok(profile.eyeletOverlap > 0, `${shape}/${mode}/${count}`);
        assert.equal((profile.head.match(/ Z/g) || []).length, 2, 'one connected housing and one eyelet hole');
        assert.ok(profile.headBounds[3] >= -profile.eyelet[1] + 5.199);
        const svg = C.preview(state, 0);
        const [x, y, width, height] = svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
        const ringY = profile.eyelet[1] - 8;
        assert.ok(svg.includes(`d="${profile.head}"`));
        assert.ok(svg.includes(`cy="${ringY}" r="9"`));
        assert.ok(x < profile.bounds[0] && x + width > profile.bounds[2]);
        assert.ok(y < ringY - 9.8 && y < -profile.headBounds[3]);
        assert.ok(y + height > (count - 1) * profile.pitch - profile.bounds[1] + 1.8);
        assert.equal((svg.match(/data-key-index=/g) || []).length, count);
        assert.ok(!svg.includes('stroke-dasharray'), 'selection should not draw a dashed preview box');
      }
    }
  }
});

test('single Love uses the smaller CAD contour while repeated Love keeps its regular dimensions', () => {
  const single = C.normalize({ ...letters(1), shape: 'love' });
  const repeated = C.normalize({ ...letters(2), shape: 'love' });
  assert.deepEqual(C.layout(single).bounds, [-19, -17, 19, 17]);
  assert.deepEqual(C.layout(repeated).bounds, [-23, -24, 23, 22]);
  assert.equal(C.layout(single).eyelet[1], -14.5);
  assert.equal(C.layout(repeated).eyelet[1], -16.5);
  assert.ok(C.preview(single).includes(C.layout(single).head));
  assert.deepEqual(C.decode(C.encode(single)), single);
});

test('keycap dimensions, icons and all fitted glyphs follow the reference body', () => {
  assert.deepEqual(C.assets.keycap.size, [18.5, 18.51, 7]);
  assert.deepEqual(C.assets.keycap.bounds, [-9.25, -9.255, 9.25, 9.255]);
  assert.ok(C.keyGraphic(C.makeKey('A'), 'nunito').includes(C.assets.keycap.path));
  const face = C.assets.keycap.faceBounds;
  const contours = [...Object.values(C.assets.emojis), ...Object.values(C.assets.glyphs).flatMap(Object.values)];
  for (const contour of contours) {
    const b = contour.bounds;
    assert.ok(b[0] >= face[0] + .349 && b[1] >= face[1] + .349);
    assert.ok(b[2] <= face[2] - .349 && b[3] <= face[3] - .349);
  }
  for (const emoji of Object.values(C.assets.emojis)) {
    const [x0, y0, x1, y1] = emoji.bounds;
    assert.ok(Math.max(x1 - x0, y1 - y0) <= 11.40001);
    assert.ok(x0 >= face[0] + .999 && y0 >= face[1] + .999);
    assert.ok(x1 <= face[2] - .999 && y1 <= face[3] - .999);
  }
});

test('new base spacing accepts adjacent characters and survives sharing and WhatsApp', () => {
  for (const shape of ['love', 'flower']) for (const mode of Object.keys(C.MODES)) {
    const state = C.normalize({ ...letters(2), shape, mode, keys: ['symbol-ghost', 'symbol-robot'].map((value) => symbolKey(value)) });
    assert.deepEqual(C.validate(state), [], `${shape}/${mode}`);
    assert.deepEqual(C.decode(C.encode(state)), state);
    assert.ok(C.message(state).includes(`${C.MODES[mode].label} - ${C.assets.bases[shape].label}`));
  }
});

test('every symbol accepts all twenty distinct stock-color pairs in every font', () => {
  for (const value of symbolIds) for (const cap of Object.keys(C.COLORS)) for (const ink of Object.keys(C.COLORS)) {
    if (cap === ink) continue;
    for (const font of Object.keys(C.FONTS)) {
      const key = symbolKey(value, cap, ink);
      const state = C.normalize({ ...letters(1), font, keys: [key] });
      assert.deepEqual(C.validate(state), [], `${value}/${cap}/${ink}/${font}`);
      const graphic = C.keyGraphic(key, font);
      const paths = [...graphic.matchAll(/<path\b[^>]*>/g)].map((match) => match[0]);
      const body = paths.find((path) => path.includes(`d="${C.assets.keycap.path}"`) && path.includes(`fill="${C.COLORS[cap].hex}"`));
      const symbol = paths.find((path) => path.includes(`d="${C.assets.emojis[value].outline}"`));
      assert.ok(body, 'body uses the independently selected cap color');
      assert.ok(symbol && symbol.includes(`fill="${C.COLORS[ink].hex}"`), 'symbol uses the independently selected ink color');
      assert.ok(symbol.includes('fill-rule="evenodd"') || /<g\b[^>]*fill-rule="evenodd"/.test(graphic), 'holes expose the selected body color');
      assert.equal(paths.length, 4, 'symbols add one ink region, with no fixed-color facial decorations');
      assert.deepEqual(C.decode(C.encode(state)), state);
    }
  }
});

test('flush symbols require two different colors while raised letters can remain one color', () => {
  for (const value of symbolIds) for (const color of Object.keys(C.COLORS)) {
    const state = C.normalize({ ...letters(1), keys: [symbolKey(value, color, color)] });
    assert.ok(C.validate(state).length, `${value}/${color}`);
    assert.throws(() => C.message(state));
    assert.doesNotThrow(() => C.preview(state));
  }
  for (const color of Object.keys(C.COLORS)) {
    const state = letters(1); state.keys[0].cap = color; state.keys[0].ink = color;
    assert.deepEqual(C.validate(state), []);
  }
});

test('symbol contours retain separate paw pads and body-colored eye holes', () => {
  assert.equal((C.assets.emojis['symbol-paw'].outline.match(/M/g) || []).length, 5);
  for (const id of ['symbol-ghost', 'symbol-robot']) assert.equal((C.assets.emojis[id].outline.match(/M/g) || []).length, 3, id);
  for (const id of symbolIds) {
    const state = C.normalize({ ...letters(1), keys: [symbolKey(id)] });
    const svg = C.preview(state);
    assert.ok(svg.includes('fill-rule="evenodd"'));
    assert.equal(svg.match(/viewBox="([^"]+)"/)[1], C.preview(letters(1)).match(/viewBox="([^"]+)"/)[1], 'inset legends do not enlarge the keycap envelope');
  }
});

test('legacy symbol links require an explicit replacement instead of silently changing the order', () => {
  const retired = ['cat', 'penguin', 'bear', 'paw', 'cloud', 'pumpkin', 'robot'];
  for (const version of [1, 2]) for (const value of retired) {
    const state = C.decode(sharePayload(version, [['e', value, 'orange', 'blue'], ['l', 'N', 'black', 'white']]));
    assert.deepEqual(state.keys[0], symbolKey('', 'orange', 'blue'));
    assert.equal(C.describe(state.keys[0]), 'Pilih simbol');
    assert.ok(C.validate(state).length);
    assert.throws(() => C.message(state));
    assert.doesNotThrow(() => C.keyGraphic(state.keys[0], state.font));
    assert.doesNotThrow(() => C.preview(state));
    assert.equal(state.quantity, 3);
    assert.equal(state.note, 'Hadiah & bungkus terpisah');
  }
  const lettersOnly = C.decode(sharePayload(1, [['l', 'A', 'orange', 'blue'], ['l', 'N', 'black', 'white']]));
  assert.deepEqual(lettersOnly.keys, [{ type: 'letter', value: 'A', cap: 'orange', ink: 'blue' }, { type: 'letter', value: 'N', cap: 'black', ink: 'white' }]);
  assert.deepEqual(C.validate(lettersOnly), []);
});

test('missing and unknown symbol IDs cannot be ordered or crash previews', () => {
  for (const value of ['', 'symbol-missing', '__proto__', '<script>']) {
    for (const keys of [[symbolKey(value)], [symbolKey(value), C.makeKey('A')], [C.makeKey('A'), symbolKey(value)]]) {
      const state = C.normalize({ ...letters(keys.length), keys });
      assert.equal(state.keys.find((key) => key.type === 'emoji').value, '');
      assert.ok(C.validate(state).length);
      assert.throws(() => C.message(state));
      assert.doesNotThrow(() => C.preview(state));
    }
    const raw = { ...letters(1), keys: [symbolKey(value)] };
    assert.ok(C.validate(raw).length);
    assert.doesNotThrow(() => C.keyGraphic(raw.keys[0], raw.font));
    assert.doesNotThrow(() => C.preview(raw));
  }
});

test('WhatsApp states each symbol body and ink color without catalog-color ambiguity', () => {
  for (const id of symbolIds) {
    const state = C.normalize({ ...letters(2), keys: [symbolKey(id, 'black', 'blue'), { ...C.makeKey('N'), cap: 'orange', ink: 'white' }] });
    const text = C.message(state);
    assert.ok(text.includes(`1. ${C.assets.emojis[id].label} | keycap Hitam | simbol Sky blue`));
    assert.ok(text.includes('2. N | keycap Orange | huruf Putih'));
    assert.ok(!text.includes('mengikuti contoh katalog'));
  }
});

test('five stock colors include red; red works seamlessly across base, cap, ink, share link, and WhatsApp message', () => {
  assert.deepEqual(Object.keys(C.COLORS), ['white', 'black', 'blue', 'orange', 'red']);
  assert.deepEqual(C.COLORS.red, { label: 'Merah', hex: '#DE3636' });

  // Base red, Keycap red, and Ink red on separate keys
  const state = C.normalize({
    ...letters(3),
    base: 'red',
    keys: [
      { type: 'letter', value: 'R', cap: 'red', ink: 'white' },
      { type: 'letter', value: 'E', cap: 'white', ink: 'red' },
      symbolKey('symbol-love', 'black', 'red')
    ]
  });

  assert.equal(state.base, 'red');
  assert.equal(state.keys[0].cap, 'red');
  assert.equal(state.keys[1].ink, 'red');
  assert.equal(state.keys[2].ink, 'red');
  assert.deepEqual(C.validate(state), []);

  const encoded = C.encode(state);
  const decoded = C.decode(encoded);
  assert.deepEqual(decoded, state);

  const text = C.message(state, 'https://cetakin.id/clicker.html');
  assert.ok(text.includes('Warna base: Merah'));
  assert.ok(text.includes('1. R | keycap Merah | huruf Putih'));
  assert.ok(text.includes('2. E | keycap Putih | huruf Merah'));
  assert.ok(text.includes(`3. ${C.assets.emojis['symbol-love'].label} | keycap Hitam | simbol Merah`));

  const svg = C.preview(state);
  assert.ok(svg.includes('fill="#DE3636"'));
});
