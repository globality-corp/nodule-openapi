
export default async function any<Item, RequestFunc extends (...args: any) => Promise<{ items: Item[] }>>(
    req: Parameters<RequestFunc>[0],
    {
        searchRequest,
        args = {}
    }:
    {
        searchRequest: RequestFunc,
        args: Parameters<RequestFunc>[1],
    }
): Promise<boolean> {
    const page = await searchRequest(req, args);
    return page.items.length > 0;
}
