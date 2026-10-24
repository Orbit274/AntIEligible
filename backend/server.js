// Imports the app and lets it run locally, should be auto redirected here
// The frontend dev server forwards /api/ requests to this part, proxy set in frontend/vite.config.js

import app from "./app.js";

app.listen(3001, () => {
    console.log("Backend running at http://localhost:3001");
});
