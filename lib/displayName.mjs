// The economics Drive keeps stable numeric prefixes in folder names for
// sorting (for example "27分析導論" and "27-03_王振男"). Keep those
// names and IDs untouched in Drive/routes, but omit the prefixes in the UI.
export function displayName(value, deptCode) {
    const original = String(value || '');
    // Folders created from Coursemap keep an official code in brackets for
    // stable identity, but no department should expose that implementation
    // detail in navigation or search results.
    const catalogCleaned = original.replace(/^\s*\[[^\]]+\][-_.\s]*/, '');
    if (catalogCleaned !== original) return catalogCleaned || original;
    if (deptCode !== 'econ') return original;

    // Codes can be hierarchical (for example "2.04.2傅斯緯"), so consume
    // every numeric component rather than stopping after the second one.
    const cleaned = original.replace(/^\s*\d{1,3}(?:(?:[-_.])\d{1,3})*[-_.\s]*/, '');
    return cleaned || original;
}

export function displayRoute(value, deptCode) {
    return String(value || '').split('/').map((part) => displayName(part, deptCode)).join(' / ');
}
