import { TRoute } from "../../types/common";
import * as API from "./test";

const routes: TRoute[] = [
    {
        method: 'get',
        path: '/test',
        handler: API.test,
    }
]

export default routes;