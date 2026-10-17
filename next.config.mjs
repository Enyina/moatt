/** @type {import('next').NextConfig} */
const pages=process.env.GITHUB_PAGES==='1';
const nextConfig={
 output:'export',
 images:{unoptimized:true},
 basePath:pages?'/moatt':'',
 trailingSlash:true,
};
export default nextConfig;
