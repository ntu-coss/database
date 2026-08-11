import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect } from 'react';
import Navbar from './navbar';
import { GoogleAnalytics } from 'nextjs-google-analytics';

// Applies the given theme ('light' | 'dark') to <html data-bs-theme>.
export function applyTheme(theme) {
    document.documentElement.setAttribute('data-bs-theme', theme);
}

// Resolves the theme to use on load: stored user choice wins, else system.
export function getInitialTheme() {
    const stored = window.localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
        return stored;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Layout({ children }) {
    useEffect(() => {
        applyTheme(getInitialTheme());

        // Only follow system changes when the user hasn't made an explicit choice.
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e) => {
            if (!window.localStorage.getItem('theme')) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        };
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, []);

    // GA4 為本站專屬的一組，未設定 NEXT_PUBLIC_GA_ID 就不掛追蹤。
    const gaId = process.env.NEXT_PUBLIC_GA_ID;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            {gaId && <GoogleAnalytics gaMeasurementId={gaId} />}
            <div style={{ flex: '1' }}>
                {children}
            </div>
            <footer className="footer mt-auto py-3 bg-body-tertiary">
                <div className="container" style={{ fontSize: '0.9rem' }}>
                    <h5 style={{ fontSize: '1rem' }}>台大社科院資料庫 | NTU COSS Database</h5>
                    <p className="text-muted">
                        本網站由臺大社會科學院學生會架設及維護，各系資料由該系學會提供。所有資料的著作權為各課程授課老師及檔案提供者所有，請勿將資料用於學習以外的用途。
                    </p>
                </div>
                <div className="container d-flex justify-content-between" style={{ fontSize: '0.9rem' }}>
                    <div>
                        <span className="text-muted">© 2026 臺大社會科學院學生會</span>
                        <br />
                        <span className="text-muted">Ver: 1.0(20260812)</span>
                    </div>
                    <div>
                        <span className="text-muted">
                            網頁設計：
                            <a href="https://github.com/MorganLee0906">ChengYu Lee</a>
                        </span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
