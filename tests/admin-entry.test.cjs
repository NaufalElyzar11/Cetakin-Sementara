'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Script } = require('node:vm');

const adminPath = path.join(__dirname, '../admin.js');
const adminSource = fs.readFileSync(adminPath, 'utf8');

test('Entire admin browser script compiles before any login handler can run', () => {
  assert.doesNotThrow(() => new Script(adminSource, { filename: adminPath }));
});

test('Admin startup installs the login submit handler without a saved session', () => {
  const listeners = new Map();
  const loginForm = {
    addEventListener(event, handler) {
      listeners.set(event, handler);
    }
  };
  const context = {
    document: {
      querySelector(selector) {
        return selector === '#login-form' ? loginForm : null;
      },
      querySelectorAll() {
        return [];
      }
    },
    localStorage: {
      getItem() {
        return null;
      }
    },
    fetch() {
      assert.fail('Opening the login screen must not request authenticated data');
    }
  };

  new Script(adminSource, { filename: adminPath }).runInNewContext(context);

  assert.equal(typeof listeners.get('submit'), 'function');
});

test('3D print calculator shows batch costs and copies the estimated wage to the order form', () => {
  const values = {
    '#cj-name': 'Among Us', '#cj-units': '3', '#cj-layer': '0.16', '#cj-petg': '85.64',
    '#cj-support': '0', '#cj-hours': '5', '#cj-active-hours': '0.5', '#cj-packaging': '0',
    '#cj-other': '1500', '#cj-discount': '0', '#cj-sell-unit': '15000'
  };
  const expectedCosts = {
    '#cj-res-fil': 12846, '#cj-res-elec': 1200, '#cj-res-mach': 11300,
    '#cj-res-labor': 5000, '#cj-res-fail': 3185, '#cj-res-hpp-batch': 35031
  };
  const selectors = [
    ...Object.keys(expectedCosts), '#cj-res-suggested-unit', '#cj-res-batch-total',
    '#cj-res-hpp-unit', '#cj-res-breakeven', '#cj-res-grams', '#cj-res-base-tariff',
    '#cj-res-profit', '#cj-res-margin', '#cj-res-status', '#active-unit-pill',
    '#active-unit-title', '#calc-box-jasa-3d', '#calc-box-clicker', '#calc-box-robotika', '#ord-wage'
  ];
  const elements = new Map(selectors.map((selector) => [selector, {}]));
  for (const [selector, value] of Object.entries(values)) elements.set(selector, { value });

  const listeners = new Map();
  for (const selector of ['#calc-jasa-form', '#cj-save-order-btn']) {
    elements.set(selector, {
      addEventListener(event, handler) { listeners.set(`${selector}:${event}`, handler); }
    });
  }
  new Script(adminSource, { filename: adminPath }).runInNewContext({
    document: {
      querySelector: (selector) => elements.get(selector) ?? null,
      querySelectorAll: () => []
    },
    localStorage: { getItem: () => null },
    window: { CetakinFinance: require('../finance-core.js'), scrollTo() {} }
  });

  listeners.get('#calc-jasa-form:input')();
  const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  for (const [selector, amount] of Object.entries(expectedCosts)) {
    assert.equal(elements.get(selector).textContent, rupiah.format(amount), selector);
  }

  listeners.get('#cj-save-order-btn:click')();
  assert.equal(Number(elements.get('#ord-wage').value), 5000);
});
