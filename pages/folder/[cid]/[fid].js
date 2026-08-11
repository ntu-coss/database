import Head from 'next/head';
import Layout from '../../../components/layout';
import { useRouter } from 'next/router';
import { getAllFolders, getFoldersData } from '../../../lib/folder';
import { getPublicDepts } from '../../../lib/depts';

export default function Folder({ folderData, deptCode, deptName }) {
    const childFolders = folderData["folder"].sort((a, b) => a.name.localeCompare(b.name));
    const files = folderData["file"].sort((a, b) => a.name.localeCompare(b.name));
    const router = useRouter();
    const { cid, fid } = router.query;
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
    return (
        <div>
            <Head>
                <title>{`${deptName || '課程'}課程資料 | 台大社科院資料庫`}</title>
                <link rel="icon" href={`${basePath}/favicon.ico`} />
            </Head>
            <Layout>
                <div class="container">
                    <center>
                        <h2>課程資料</h2>
                    </center>
                </div>
                <div class="container">
                    <h6>現在位置：
                        <a
                            className="badge bg-secondary me-2 align-items-center text-decoration-none"
                            href={`${basePath}/curriculum?dept=${encodeURIComponent(deptCode)}`}
                        >
                            {deptName}
                        </a>
                        {folderData["route"].split('/').map((c) => (
                            <span class="badge bg-primary me-2 align-items-center">{c}</span>

                        ))}
                    </h6>
                </div>
                <div class="container">
                    <ul class="list-group list-group-flush">
                        <div className="list-group">
                            {childFolders.map((folder) => {
                                const hasFiles = folder["file_count"] > 0;
                                const linkProps = hasFiles
                                    ? { href: `${basePath}/folder/${cid}/${folder["url"]}`, className: "list-group-item list-group-item-action" }
                                    : {
                                        className: "list-group-item list-group-item-action disabled text-muted",
                                        title: "此資料夾無檔案"
                                    };
                                return (
                                    <a key={folder["url"]} {...linkProps}>
                                        <div class="d-flex w-100 justify-content-begin">
                                            <h5 class="mb-1">{folder["name"]}</h5>
                                        </div>
                                        <div class="d-flex justify-content-end">
                                            {hasFiles ? (
                                                <span class="badge bg-primary me-2 align-items-center">
                                                    共有{folder["file_count"]}個檔案
                                                </span>
                                            ) : (
                                                <span class="badge bg-secondary me-2 align-items-center">
                                                    本資料夾暫無檔案
                                                </span>
                                            )}
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </ul>
                    {childFolders.length > 0 && files.length > 0 && <hr />}
                    <div className="list-group">
                        {files.map((file) => (
                            <a href={`${basePath}/file?id=${file["url"]}`} className="list-group-item list-group-item-action">{file["name"]}</a>
                        ))}
                    </div>
                    {childFolders.length === 0 && files.length === 0 && (
                        <p>抱歉，這裡沒有任何文件和資料夾:(</p>
                    )}
                </div>
            </Layout>
        </div>
    );
}



export async function getStaticPaths() {
    const paths = getAllFolders();
    //console.log(paths);
    return {
        paths,
        fallback: false,
    };
}

export async function getStaticProps({ params }) {
    const curriId = params.cid; // <系code>__<課程碼>
    const folderId = params.fid;
    const folderData = getFoldersData(curriId, folderId);
    const deptCode = curriId.split('__')[0];
    const dept = getPublicDepts().find((d) => d.code === deptCode);
    return {
        props: {
            folderData,
            deptCode,
            deptName: (dept && dept.name) || deptCode,
        },
    };
}
