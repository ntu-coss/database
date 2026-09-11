import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from '../components/layout';
import { announcementContent, announcementTitle, fetchAnnouncements } from '../lib/announcements.mjs';

export default function Announcement() {
  const router = useRouter();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const [item, setItem] = useState(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    let alive = true;
    setItem(undefined);
    setError(false);
    fetchAnnouncements(process.env.NEXT_PUBLIC_API_BASE)
      .then((items) => {
        if (!alive) return;
        const found = items.find((post) => String(post.id) === String(router.query.id));
        setItem(found || null);
      })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [router.isReady, router.query.id]);

  const title = item ? announcementTitle(item) : '資料庫公告';
  return (
    <Layout>
      <Head><title>{title} | 台大社科院資料庫</title></Head>
      <div className="container my-4" style={{ maxWidth: 800 }}>
        <a href={`${basePath}/`} className="btn btn-sm btn-outline-secondary mb-3">返回資料庫首頁</a>
        {error && <div className="alert alert-warning">公告載入失敗，請稍後再試。</div>}
        {item === undefined && !error && (
          <div className="text-center text-muted py-5">
            <div className="spinner-border text-secondary" role="status" aria-label="載入中"></div>
          </div>
        )}
        {item === null && !error && <div className="alert alert-secondary">找不到這則公告。</div>}
        {item && (
          <article>
            <h2 className="mb-1">
              {item.pinned && <span className="badge bg-danger me-2 align-middle">置頂</span>}
              {announcementTitle(item)}
            </h2>
            {(item.publishFrom || item.createdAt) && <p className="text-muted mb-1">{item.publishFrom || item.createdAt}</p>}
            <hr />
            <div style={{ fontSize: '1.05rem', lineHeight: 1.8 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{announcementContent(item)}</ReactMarkdown>
            </div>
          </article>
        )}
      </div>
    </Layout>
  );
}
