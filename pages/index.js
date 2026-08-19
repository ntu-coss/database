import Head from 'next/head';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Layout from '../components/layout';
import { getPublicDepts } from '../lib/depts';
import { rememberDept } from '../lib/deptSelection';

export async function getStaticProps() {
  return { props: { depts: getPublicDepts() } };
}

// 公告存在社科院學生會官網後台，前台開站時即時取得（改公告不必重建網站）。
function useAnnouncements() {
  const [state, setState] = useState({ status: 'loading', items: [] });
  useEffect(() => {
    let alive = true;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/db/announcements`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!alive) return;
        setState({ status: 'ok', items: Array.isArray(data.items) ? data.items : [] });
      })
      .catch(() => alive && setState({ status: 'error', items: [] }));
    return () => { alive = false; };
  }, []);
  return state;
}

export default function Home({ depts }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
  const { status, items } = useAnnouncements();

  return (
    <div>
      <Head>
        <title>台大社科院資料庫 | NTU COSS Database</title>
        <meta
          name="description"
          content="台大社科院資料庫：臺大社會科學院學生會建置，整合經濟、政治、社會、社工等系所的考古題、講義與課程資源。"
        />
        <link rel="icon" href={`${basePath}/favicon.ico`} />
      </Head>
      <Layout>
        <div className="container text-center py-5">
          <h1>台大社科院資料庫</h1>
          <p className="text-muted mb-0">整合社科院各系考古題與課程資源</p>
        </div>

        <div className="container mb-5">
          <div className="row g-3">
            {depts.length === 0 && (
              <p className="text-muted text-center">尚未設定任何系所。</p>
            )}
            {depts.map((d) => (
              <div className="col-12 col-sm-6 col-lg-3" key={d.code}>
                <a
                  className="card h-100 text-decoration-none text-body"
                  href={`${basePath}/curriculum?dept=${encodeURIComponent(d.code)}`}
                  onClick={() => rememberDept(d.code)}
                >
                  <div className="card-body text-center">
                    <h5 className="card-title mb-0">{d.name}</h5>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="container mb-5">
          <h2 className="h4 text-center mb-3">網頁公告</h2>
          {status === 'loading' ? (
            <p className="text-muted text-center">載入中…</p>
          ) : items.length === 0 ? (
            <p className="text-muted text-center">目前沒有公告。</p>
          ) : (
            <div className="list-group">
              {items.map((post) => (
                <div className="list-group-item" key={post.id}>
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">
                      {String(post.pinned) === 'true' && (
                        <span className="badge bg-danger me-2">置頂</span>
                      )}
                      {post.title}
                    </h5>
                    <small className="text-muted text-nowrap ms-2">{post.publishFrom || post.createdAt}</small>
                  </div>
                  <div className="mt-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ''}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </div>
  );
}
