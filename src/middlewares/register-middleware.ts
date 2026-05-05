// register middleware from src/middlewares
import { responseMiddleware } from './response-middleware';

export function registerMiddleware(app: any) {
    app.use(responseMiddleware);
}