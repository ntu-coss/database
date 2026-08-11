import Head from 'next/head';
import Layout from '../components/layout';
import { useRouter } from 'next/router';

export default function File() {
    const router = useRouter();
    const { id } = router.query;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
    return (
        <div>
            <Head>
                <title>
                    檔案
                </title>
                <link rel="icon" href={`${basePath}/favicon.ico`} />
                <style>
                    {`
                    .iframe-container {
                        position: relative;
                        width: 80%;
                        padding-bottom: 100%;
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
                <div class="container">
                    <center>
                        <div class="iframe-container">
                            <iframe class="responsive-iframe" src={`https://drive.google.com/file/d/${id}/preview`} allow="autoplay"></iframe>
                        </div>
                    </center>
                </div>
                <div class="container">
                    <center>
                        <h6>若文件預覽未正常顯示<a href={`https://drive.google.com/file/d/${id}`}>請點擊此處</a></h6>
                    </center>
                </div>
            </Layout >
        </div >
    );
}
