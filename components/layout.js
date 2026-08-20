import 'bootstrap/dist/css/bootstrap.min.css';
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from './navbar';
import { GoogleAnalytics } from 'nextjs-google-analytics';
import buildInfo from '../public/version.json';

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
    const router = useRouter();
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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const path = (router.asPath || '/').split('?')[0].split('#')[0];
    const canonical = `${siteUrl}${path === '/' ? '/' : path}`;
    const title = '台大社科院資料庫 | NTU COSS Database';
    const description = '臺大社會科學院學生會建置，整合社科院各系考古題、講義與課程資源。';
    const image = `${siteUrl}/og-image.png`;
    const websiteJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '台大社科院資料庫',
        alternateName: 'NTU COSS Database',
        url: `${siteUrl}/`,
        publisher: {
            '@type': 'Organization',
            name: '國立臺灣大學社會科學院學生會',
            url: 'https://ntu-coss.github.io/',
        },
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Head>
                <meta name="description" content={description} />
                <link rel="canonical" href={canonical} />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content={title} />
                <meta property="og:title" content={title} />
                <meta property="og:description" content={description} />
                <meta property="og:url" content={canonical} />
                <meta property="og:image" content={image} />
                <meta property="og:locale" content="zh_TW" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={title} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content={image} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
                />
            </Head>
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
                        <span className="text-muted" title={`Commit ${buildInfo.commit}`}>Ver: {buildInfo.display}</span>
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
