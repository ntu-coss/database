export function normalizeCoursePolicy(dept = {}) {
    const rawIds = Array.isArray(dept.courseAllowlist) ? dept.courseAllowlist : [];
    return {
        courseMode: dept.courseMode === 'allowlist' ? 'allowlist' : 'all',
        courseAllowlist: [...new Set(rawIds
            .map((id) => String(id || '').trim())
            .filter((id) => /^[A-Za-z0-9_-]+$/.test(id)))],
    };
}

export function filterCoursesByPolicy(courses, dept) {
    const list = Array.isArray(courses) ? courses : [];
    const policy = normalizeCoursePolicy(dept);
    if (policy.courseMode !== 'allowlist') return list;
    const allowed = new Set(policy.courseAllowlist);
    return list.filter((course) => course && allowed.has(String(course.id || '')));
}
