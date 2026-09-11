import assert from 'node:assert/strict';
import test from 'node:test';
import { announcementContent, announcementPreview, announcementTitle } from '../lib/announcements.mjs';

test('database announcement helpers provide readable titles and summaries', () => {
  const post = { title: '課程資料更新', content: '## 內容\n請查看[課程說明](https://example.com)。' };
  assert.equal(announcementTitle(post), '課程資料更新');
  assert.equal(announcementContent(post), post.content);
  assert.equal(announcementPreview(post), '內容 請查看課程說明。');
});

test('database announcements fall back to English when Chinese is blank', () => {
  const post = { title: '', titleEn: 'Update', content: '', contentEn: 'Details' };
  assert.equal(announcementTitle(post), 'Update');
  assert.equal(announcementContent(post), 'Details');
});
