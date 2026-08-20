import assert from 'node:assert/strict';
import test from 'node:test';
import { filterCoursesByPolicy, normalizeCoursePolicy } from './courseVisibility.mjs';

const courses = [
    { id: 'course-a', name: '課程 A' },
    { id: 'course-b', name: '課程 B' },
];

test('defaults to showing every discovered course', () => {
    assert.deepEqual(filterCoursesByPolicy(courses, {}), courses);
    assert.deepEqual(filterCoursesByPolicy(courses, {
        courseMode: 'all',
        courseAllowlist: ['course-a'],
    }), courses);
});

test('allowlist mode only keeps matching Drive folder IDs', () => {
    assert.deepEqual(filterCoursesByPolicy(courses, {
        courseMode: 'allowlist',
        courseAllowlist: ['course-b', 'folder-no-longer-present'],
    }), [courses[1]]);
});

test('an empty allowlist intentionally hides every course', () => {
    assert.deepEqual(filterCoursesByPolicy(courses, {
        courseMode: 'allowlist',
        courseAllowlist: [],
    }), []);
});

test('normalization trims, deduplicates and rejects invalid IDs', () => {
    assert.deepEqual(normalizeCoursePolicy({
        courseMode: 'allowlist',
        courseAllowlist: [' course-a ', 'course-a', '', "bad'id", null],
    }), {
        courseMode: 'allowlist',
        courseAllowlist: ['course-a'],
    });
});
