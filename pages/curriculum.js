import Head from 'next/head';
import { useEffect, useState } from 'react';
import Layout from '../components/layout';
import { getSortedPostsData } from '../lib/curriculum';
import { getPublicDepts } from '../lib/depts';
import { rememberDept, resolveDept } from '../lib/deptSelection';
import { displayName } from '../lib/displayName.mjs';

export async function getStaticProps() {
    return {
        props: {
            depts: getPublicDepts(),
            courses: getSortedPostsData(),
        },
    };
}

export default function Curriculum({ depts, courses }) {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
    const codes = depts.map((d) => d.code);

    // 初始值必須與伺服器端算出來的一致，否則會 hydration mismatch；
    // 真正想看的系（網址 ?dept= 或上次選擇）在掛載後才套用。
    const [dept, setDept] = useState(codes[0] || null);
    useEffect(() => { setDept(resolveDept(codes)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const pick = (code) => {
        setDept(code);
        rememberDept(code);
        const url = new URL(window.location.href);
        url.searchParams.set('dept', code);
        window.history.replaceState(null, '', url);
    };

    const currentDept = depts.find((d) => d.code === dept);
    const list = courses.filter((c) => c.dept === dept);
    const uploadOpen = list.some((c) => c.uploadEnabled === true || String(c.uploadEnabled) === 'true');

    return (
        <div>
            <Head>
                <title>{currentDept ? `${currentDept.name}課程` : '課程'} | 台大社科院資料庫</title>
                <link rel="icon" href={`${basePath}/favicon.ico`} />
            </Head>
            <Layout>
                <div className="container mt-4">
                    <h2 className="text-center">課程</h2>
                    <ul className="nav nav-pills justify-content-center flex-wrap my-3">
                        {depts.map((d) => (
                            <li className="nav-item" key={d.code}>
                                <button
                                    className={`nav-link${d.code === dept ? ' active' : ''}`}
                                    onClick={() => pick(d.code)}
                                >
                                    {d.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                    {/* 四系可共用同一份表單網址；未設定或沒有開放上傳課程就不顯示。 */}
                    {currentDept && currentDept.uploadUrl && uploadOpen && (
                        <p className="text-center">
                            <a className="btn btn-outline-success btn-sm" href={currentDept.uploadUrl} target="_blank" rel="noreferrer">
                                上傳{currentDept.name}檔案
                            </a>
                        </p>
                    )}
                </div>
                <div className="container">
                    {depts.length === 0 ? (
                        <p className="text-muted text-center py-4">尚未設定任何系所。</p>
                    ) : list.length === 0 ? (
                        <p className="text-muted text-center py-4">
                            {currentDept ? `${currentDept.name}尚未開放，請稍候。` : '尚未設定任何系所。'}
                        </p>
                    ) : (
                        <div className="list-group">
                            {list.map(({ id, fcnt, title, fid, updated, uploadEnabled }) => {
                                const hasFiles = fcnt > 0;
                                const linkProps = hasFiles
                                    ? { href: `${basePath}/folder/${id}/${fid}`, className: "list-group-item list-group-item-action" }
                                    : {
                                        className: "list-group-item list-group-item-action disabled text-muted",
                                        title: "此資料夾無檔案"
                                    };
                                return (
                                    <a key={id} {...linkProps}>
                                        <div className="d-flex w-100 justify-content-begin">
                                            <h5 className="mb-1">{displayName(title, dept)}</h5>
                                        </div>
                                        <div className="d-flex flex-column align-items-end">
                                            {(uploadEnabled === true || String(uploadEnabled) === 'true') && (
                                                <span className="badge bg-success me-2 mb-1">開放上傳</span>
                                            )}
                                            {updated && (
                                                <small className="text-muted me-2">{updated}</small>
                                            )}
                                            {hasFiles ? (
                                                <span className="badge bg-primary me-2 align-items-center">
                                                    共有{fcnt}個檔案
                                                </span>
                                            ) : (
                                                <span className="badge bg-secondary me-2 align-items-center">
                                                    本課程暫無檔案
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Layout>
        </div>
    );
}
