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
