'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const serverPath = path.join(__dirname, '..', 'server.js');
const serverSource = fs.readFileSync(serverPath, 'utf8');

function quotedStringAt(source, start) {
  assert.equal(source[start], '"', 'Expected a quoted string');
  let escaped = false;
  for (let i = start + 1; i < source.length; i += 1) {
    const char = source[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      const raw = source.slice(start, i + 1);
      return { raw, end: i + 1 };
    }
  }
  throw new Error('Unterminated JavaScript string');
}

function readEmbeddedScript(assetPath) {
  const marker = JSON.stringify(assetPath) + ':[';
  const start = serverSource.indexOf(marker);
  assert.ok(start >= 0, 'Embedded asset not found: ' + assetPath);
  let i = start + marker.length;
  const mime = quotedStringAt(serverSource, i);
  i = mime.end;
  assert.equal(serverSource[i], ',', 'Expected asset content after MIME type');
  i += 1;
  const encodedContent = quotedStringAt(serverSource, i);
  return JSON.parse(encodedContent.raw);
}

test('server.js parses without syntax errors', () => {
  assert.doesNotThrow(() => new vm.Script(serverSource, { filename: 'server.js' }));
});

for (const assetPath of [
  '/assets/admin.js',
  '/assets/member.js',
  '/assets/common.js',
  '/member/sw.js'
]) {
  test(assetPath + ' parses without syntax errors', () => {
    const script = readEmbeddedScript(assetPath);
    assert.doesNotThrow(() => new vm.Script(script, { filename: assetPath }));
  });
}
