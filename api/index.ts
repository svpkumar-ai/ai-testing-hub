// Pre-built CJS bundle — avoids TypeScript source compilation issues
// eslint-disable-next-line @typescript-eslint/no-require-imports
const app = require("../artifacts/api-server/dist/vercel.cjs");
module.exports = app.default ?? app;
