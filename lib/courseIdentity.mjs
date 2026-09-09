// Preserve legacy two-digit economics URLs while giving Coursemap-created and
// plain Drive folders stable, collision-free identifiers.
export function courseIdentity(course) {
    const name = String(course && course.name || '').trim();
    const folderId = String(course && course.id || '').trim();
    const catalog = name.match(/^\[([A-Za-z0-9_+.-]+)\]\s*(.+)$/);
    if (catalog) {
        return {
            code: catalog[1].replace(/[^A-Za-z0-9_-]/g, '_'),
            title: catalog[2].trim(),
        };
    }

    const legacy = name.match(/^(\d{2})(.+)$/);
    if (legacy) return { code: legacy[1], title: legacy[2].trim() };

    return { code: folderId, title: name };
}
