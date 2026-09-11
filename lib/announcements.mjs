export async function fetchAnnouncements(endpoint) {
  const response = await fetch(endpoint + '/api/db/announcements');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.items) ? data.items : [];
}

export function announcementTitle(post) {
  return String(post && (post.title || post.titleEn) || '');
}

export function announcementContent(post) {
  return String(post && (post.content || post.contentEn) || '');
}

export function announcementPreview(post, length = 120) {
  const plain = announcementContent(post)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`#>*_~|=-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > length ? plain.slice(0, length).trimEnd() + '…' : plain;
}
