// Prefix for files in /public when the site is served from a GitHub Pages sub-path.
export const asset = (p) => `${process.env.NEXT_PUBLIC_REPO_NAME ? "/" + process.env.NEXT_PUBLIC_REPO_NAME : ""}${p}`;
