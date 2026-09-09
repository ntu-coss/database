import assert from 'node:assert/strict';
import test from 'node:test';
import { courseIdentity } from '../lib/courseIdentity.mjs';

test('keeps legacy two-digit economics routes stable', () => {
    assert.deepEqual(courseIdentity({ id: 'drive-1', name: '27分析導論' }), {
        code: '27', title: '分析導論',
    });
});

test('uses and hides Coursemap codes when present', () => {
    assert.deepEqual(courseIdentity({ id: 'drive-2', name: '[303+10110] 經濟學一' }), {
        code: '303_10110', title: '經濟學一',
    });
});

test('plain folders use their stable Drive ID without truncating the title', () => {
    assert.deepEqual(courseIdentity({ id: '1Ab_C-d', name: '社會學' }), {
        code: '1Ab_C-d', title: '社會學',
    });
});
