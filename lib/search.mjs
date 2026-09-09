export function normalizeSearchText(value) {
    return String(value || '').normalize('NFKC').trim().toLowerCase();
}

export function isSubsequence(needle, haystack) {
    let index = 0;
    for (const character of haystack) {
        if (character === needle[index]) index += 1;
        if (index === needle.length) return true;
    }
    return false;
}

export function matchesSearchEntry(entry, rawQuery) {
    const needle = normalizeSearchText(rawQuery);
    if (!needle) return false;

    const name = normalizeSearchText(entry && entry.n);
    const route = normalizeSearchText(entry && entry.r);
    if (name.includes(needle) || route.includes(needle)) return true;

    // 課程常以「經原」等縮寫搜尋；只對課程名稱啟用依序字元比對，
    // 避免一般檔案搜尋因模糊比對產生過多不相關結果。
    return entry && entry.k === 'course' && needle.length >= 2 && isSubsequence(needle, name);
}
