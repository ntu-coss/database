import Head from 'next/head';
import Layout from '../components/layout';
import { useRouter } from 'next/router';

export default function File() {
    const router = useRouter();
    const { id } = router.query;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
    const fileId = typeof id === 'string' && /^[A-Za-z0-9_-]+$/.test(id) ? id : '';
    const invalidId = router.isReady && !fileId;
    return (
        <div>
            <Head>
                <title>檔案預覽 | 台大社科院資料庫</title>
                <meta name="robots" content="noindex,follow" />
                <link rel="icon" href={`${basePath}/favicon.ico`} />
                <style>
                    {`
                    .iframe-container {
                        position: relative;
                        width: 80%;
                        padding-bottom: 100%;
                        margin: 0 auto;
                    }
                    .responsive-iframe {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                    }

                    `}
                </style>
            </Head>
            <Layout>
                <div className="title-container" style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100px',
                }}>
                    <h2>檔案</h2>
                </div>
                <div className="container text-center">
                    {!router.isReady ? (
                        <p className="text-muted">載入中…</p>
                    ) : invalidId ? (
                        <p className="alert alert-warning">檔案連結無效，請回到課程頁重新選擇。</p>
                    ) : (
                        <div className="iframe-container">
                            <iframe className="responsive-iframe" title="Google Drive 檔案預覽" src={`https://drive.google.com/file/d/${fileId}/preview`} allow="autoplay"></iframe>
                        </div>
                    )}
                </div>
                <div className="container text-center">
                    {fileId && <h6>若文件預覽未正常顯示<a href={`https://drive.google.com/file/d/${fileId}`} target="_blank" rel="noreferrer">請點擊此處</a></h6>}
                </div>
            </Layout >
        </div >
    );
}
