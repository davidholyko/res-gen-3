// Must match `basePath` in next.config.ts (imported there directly). Also
// needed in application code because next/image with images.unoptimized
// renders a raw <img src> without basePath rewriting -- unlike _next/*
// build assets, which Next prefixes automatically -- so any public/ asset
// referenced by a literal path (e.g. next/image src, plain <img>) needs
// this prepended manually or it 404s once deployed under the base path.
//
// NOTE: GitHub Pages project-page URLs are determined by the repository
// name, not this constant -- as long as the repo is named `res-gen-3`,
// production will still be served at davidholyko.github.io/res-gen-3
// regardless of this value. For '/app' to actually be the production
// path, the repo itself needs to be renamed to `app` to match.
export const basePath = '/app';
