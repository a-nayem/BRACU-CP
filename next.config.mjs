// Static export for GitHub Pages. Set NEXT_PUBLIC_REPO_NAME (e.g. bracu-cse-planner) in CI.
const repo = process.env.NEXT_PUBLIC_REPO_NAME || "";
export default {
  output: "export",
  images: { unoptimized: true },
  basePath: repo ? `/${repo}` : "",
  assetPrefix: repo ? `/${repo}/` : "",
  trailingSlash: true,
  transpilePackages: ["three"],
};
