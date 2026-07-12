// Must match `basePath` in next.config.ts (imported there directly). Also
// needed in application code because next/image with images.unoptimized
// renders a raw <img src> without basePath rewriting -- unlike _next/*
// build assets, which Next prefixes automatically -- so any public/ asset
// referenced by a literal path (e.g. next/image src, plain <img>) needs
// this prepended manually or it 404s once deployed under the base path.
export const basePath = '/res-gen-3';
