import { useEffect, useState } from 'react';
import Script from 'next/script';
import { applyTheme, getInitialTheme } from './layout';
import { matchesSearchEntry } from '../lib/search.mjs';

const SEARCH_RESULT_LIMIT = 50;

// Inline Bootstrap Icons path data (bi-sun-fill / bi-moon-fill) so no emoji
// and no external icon font is required.
function SunIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707L4.464 3.757a.5.5 0 0 1 0 .708" />
        </svg>
    );
}

function MoonIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M6 .278a.768.768 0 0 1 .08.858 7.2 7.2 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.79.79 0 0 1 .81.316.73.73 0 0 1-.031.893A8.35 8.35 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.75.75 0 0 1 6 .278" />
        </svg>
    );
}

export default function Navbar() {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH;

    // Default matches the server-rendered markup exactly; corrected client-side
    // after mount so there is no hydration mismatch.
    const [theme, setTheme] = useState('light');
    useEffect(() => {
        setTheme(getInitialTheme());
    }, []);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        window.localStorage.setItem('theme', next);
        applyTheme(next);
        setTheme(next);
    };

    const [query, setQuery] = useState('');
    const [searchIndex, setSearchIndex] = useState(null);
    const [loadingIndex, setLoadingIndex] = useState(false);
    const [resultsOpen, setResultsOpen] = useState(false);

    const handleQueryChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        setResultsOpen(value.trim().length > 0);
        if (searchIndex === null && !loadingIndex) {
            setLoadingIndex(true);
            fetch(`${basePath}/search-index.json`)
                .then((res) => res.json())
                .then((data) => setSearchIndex(data))
                .catch((err) => {
                    console.error('Failed to load search index:', err);
                    setSearchIndex([]);
                })
                .finally(() => setLoadingIndex(false));
        }
    };

    const handleFocus = () => {
        if (query.trim().length > 0) {
            setResultsOpen(true);
        }
    };

    const handleBlur = () => {
        // Delay so a click on a result link can still register before the
        // panel unmounts.
        setTimeout(() => setResultsOpen(false), 150);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setResultsOpen(false);
            e.currentTarget.blur();
        }
    };

    const trimmedQuery = query.trim();
    const isSearching = trimmedQuery.length > 0;

    let matches = [];
    if (isSearching && searchIndex) {
        matches = searchIndex
            .filter((entry) => matchesSearchEntry(entry, trimmedQuery))
            .sort((a, b) => {
                const kindOrder = (a.k === 'course' ? 0 : 1) - (b.k === 'course' ? 0 : 1);
                return kindOrder || String(a.n).localeCompare(String(b.n), 'zh-Hant');
            });
    }
    const truncated = matches.length > SEARCH_RESULT_LIMIT;
    const visibleMatches = truncated ? matches.slice(0, SEARCH_RESULT_LIMIT) : matches;

    const renderSearch = (mobile) => (
        <div
            className={`position-relative w-100 ${mobile ? 'd-xl-none mt-2' : 'd-none d-xl-block me-xl-2'}`}
            style={mobile ? undefined : { maxWidth: '24rem' }}
        >
            <form className="d-flex" role="search" onSubmit={(e) => e.preventDefault()}>
                <input
                    type="search"
                    className="form-control"
                    placeholder="搜尋課程或檔案…"
                    value={query}
                    onChange={handleQueryChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    aria-label="搜尋課程或檔案"
                />
            </form>
            {resultsOpen && isSearching && (
                <div
                    className="dropdown-menu show w-100 p-0 shadow-sm"
                    style={{ maxHeight: '60vh', overflow: 'auto', zIndex: 1050 }}
                >
                    {!searchIndex ? (
                        <span className="dropdown-item-text text-muted">搜尋中…</span>
                    ) : visibleMatches.length === 0 ? (
                        <span className="dropdown-item-text text-muted">找不到符合的課程或檔案</span>
                    ) : (
                        <>
                            {visibleMatches.map((entry, idx) => {
                                const isCourse = entry.k === 'course';
                                const href = isCourse ? `${basePath}${entry.u}` : `${basePath}/file?id=${entry.i}`;
                                return (
                                    <a
                                        key={`${isCourse ? entry.u : entry.i}-${idx}`}
                                        href={href}
                                        className="dropdown-item py-2"
                                        style={{ whiteSpace: 'normal' }}
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <span className={`badge ${isCourse ? 'text-bg-success' : 'text-bg-secondary'}`}>
                                                {isCourse ? '課程' : '檔案'}
                                            </span>
                                            <span>{entry.n}</span>
                                        </div>
                                        <small className="text-muted d-block mt-1">{entry.r}</small>
                                    </a>
                                );
                            })}
                            {truncated && (
                                <span className="dropdown-item-text text-muted small">顯示前 50 筆…</span>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div>
            <nav className="navbar navbar-expand-xl bg-body-tertiary">
                <div className="container-fluid flex-wrap">
                    <a className="navbar-brand" href={`${basePath}`}>
                        臺大社科資料庫
                    </a>
                    <Script
                        src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
                        strategy="afterInteractive"
                    />
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarSupportedContent"
                        aria-controls="navbarSupportedContent"
                        aria-expanded="false"
                        aria-label="Toggle navigation"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    {renderSearch(true)}
                    <div className="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul className="navbar-nav me-auto mb-2 mb-xl-0">
                            <li className="nav-item">
                                <a className="nav-link active text-nowrap" aria-current="page" href={`${basePath}/curriculum`}>
                                    課程
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link active text-nowrap" aria-current="page" href="https://ntu-coss.github.io/">
                                    學生會首頁
                                </a>
                            </li>
                        </ul>
                        <hr className="d-xl-none my-2" />
                        {renderSearch(false)}
                        {/* 上傳鈕跟著「目前看的是哪個系」，所以放在課程頁的系所切換旁邊 */}
                        <div className="d-flex align-items-center ms-xl-2">
                            <span className="d-xl-none text-muted small me-2">深色模式</span>
                            <div className="form-check form-switch d-flex align-items-center mb-0">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    id="themeSwitch"
                                    checked={theme === 'dark'}
                                    onChange={toggleTheme}
                                    aria-label={theme === 'dark' ? '切換至淺色模式' : '切換至深色模式'}
                                />
                                <label
                                    className="form-check-label ms-1"
                                    htmlFor="themeSwitch"
                                    title={theme === 'dark' ? '切換至淺色模式' : '切換至深色模式'}
                                >
                                    {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

            </nav >
        </div >
    )
}
