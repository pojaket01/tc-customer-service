import * as API from "./test";

const routes = [
    {
        method: 'get',
        path: '/test',
        handler: API.test,
    }
]

export default routes;