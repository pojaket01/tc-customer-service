// dynamic register api route watch *.route.ts file in api folder
import { Express } from 'express';
import fs from 'fs';
import path from 'path';

export function registerApiRoutes(app: Express) {
  const apiDir = path.join(__dirname, 'api');
    fs.readdirSync(apiDir).forEach((file) => {
        if (file.endsWith('.route.ts') || file.endsWith('.route.js')) {
            const routePath = path.join(apiDir, file);
            import(routePath).then((module) => {
                if (module && module.default) {
                    const router = module.default;
                    app.use('/api', router);
                    console.log(`Registered API route from ${file}`);
                } else {
                    console.warn(`No default export found in ${file}, skipping route registration.`);
                }
            }).catch((err) => {
                console.error(`Error loading route from ${file}:`, err);
            });
        }
    });
}