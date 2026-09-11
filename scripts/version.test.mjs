import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('database site uses an explicit major.minor.patch release number', async () => {
  const version = (await readFile(new URL('../VERSION', import.meta.url), 'utf8')).trim();
  assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  const writer = await readFile(new URL('./write-version.sh', import.meta.url), 'utf8');
  assert.doesNotMatch(writer, /rev-list\s+--count/);
});
