import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesSearchEntry } from '../lib/search.mjs';
import { displayName, displayRoute } from '../lib/displayName.mjs';

const course = { k: 'course', n: '經濟學原理', r: '經濟學系 › 課程' };

test('course names support common non-contiguous abbreviations', () => {
    assert.equal(matchesSearchEntry(course, '經原'), true);
});

test('file names keep precise substring matching', () => {
    assert.equal(matchesSearchEntry({ k: 'file', n: '經濟學原理期中考.pdf', r: '經濟學系' }, '經原'), false);
});

test('routes and normalized latin text remain searchable', () => {
    assert.equal(matchesSearchEntry({ k: 'file', n: 'MIDTERM.PDF', r: '經濟學系 › 經濟學原理' }, 'midterm'), true);
    assert.equal(matchesSearchEntry(course, '經濟學系'), true);
});

test('blank queries do not match', () => {
    assert.equal(matchesSearchEntry(course, '  '), false);
});

test('hides economics sorting codes without changing other departments', () => {
    assert.equal(displayName('27-03_王振男', 'econ'), '王振男');
    assert.equal(displayName('27分析導論（高等微積分）', 'econ'), '分析導論（高等微積分）');
    assert.equal(displayName('2.04.2傅斯緯', 'econ'), '傅斯緯');
    assert.equal(displayName('[303+10110] 經濟學一', 'econ'), '經濟學一');
    assert.equal(displayName('[305+10010] 社會學', 'soc'), '社會學');
    assert.equal(displayName('302政治學', 'ps'), '302政治學');
    assert.equal(displayRoute('27分析導論/27-03_王振男/期中考', 'econ'), '分析導論 / 王振男 / 期中考');
});
