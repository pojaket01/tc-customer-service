// dynamic register api route watch *.route.ts file in api folder
import { Express, Request, RequestHandler, Response } from 'express';
import fs from 'fs';
import path from 'path';

interface RouteConfig {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  path: string;
  handler: (req: Request, res: Response) => void | Promise<void>;
  middleware?: RequestHandler | RequestHandler[];
}

function scanRoutes(dir: string): string[] {
  const routeFiles: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursively scan subdirectories
      const subRoutes = scanRoutes(fullPath);
      routeFiles.push(...subRoutes);
    } else if (file.endsWith('.route.ts') || file.endsWith('.route.js')) {
      routeFiles.push(fullPath);
    }
  }

  return routeFiles;
}

export function registerApiRoutes(app: Express) {
  const apiDir = __dirname;
  console.log("🚀 ~ registerApiRoutes ~ apiDir:", apiDir);

  try {
    const routeFiles = scanRoutes(apiDir);
    console.log("🚀 ~ Found route files:", routeFiles);

    for (const routePath of routeFiles) {
      try {
        // Use require for CommonJS compatibility
        const module = require(routePath);
        
        if (module && module.default) {
          const routes: RouteConfig[] = module.default;
          
          if (Array.isArray(routes)) {
            routes.forEach((route) => {
              const fullPath = `/api${route.path}`;
              
              // Register route with middleware if provided
              if (route.middleware) {
                const middlewares = Array.isArray(route.middleware) ? route.middleware : [route.middleware];
                app[route.method](fullPath, ...middlewares, route.handler);
              } else {
                app[route.method](fullPath, route.handler);
              }
              
              console.log(`✅ Registered ${route.method.toUpperCase()} ${fullPath}`);
            });
          } else {
            console.warn(`⚠️  ${routePath} does not export an array of routes`);
          }
        } else {
          console.warn(`⚠️  No default export found in ${routePath}`);
        }
      } catch (err) {
        console.error(`❌ Error loading route from ${routePath}:`, err);
      }
    }

    console.log("✅ API routes registration completed");
  } catch (err) {
    console.error("❌ Error scanning routes:", err);
  }
}