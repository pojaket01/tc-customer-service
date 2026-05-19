import { TRoute } from "../../../types"
import * as API from "./invoice.service"


const Routes: TRoute[] = [
    {
        method: 'post',
        path: '/invoice/list',
        handler: API.GetInvoiceList
    },
    {
        method: 'post',
        path: '/invoice/create',
        handler: API.CreateInvoice
    },
    {
        method: 'put',
        path: '/invoice/update/:id',
        handler: API.UpdateInvoice
    },
    {
        method: 'delete',
        path: '/invoice/delete/:id',
        handler: API.DeleteInvoice
    }
]

export default Routes;