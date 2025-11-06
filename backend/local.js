import './env.js'; // for loading .env file

import { app } from "./app";

const PORT = process.env.POSTBASE_BACKEND_HTTP_PORT || 8081;
app.listen(PORT, () => console.log(`Postbase backend listening on http://0.0.0.0:${PORT}`));
