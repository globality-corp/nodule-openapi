export default async function any(req, { searchRequest, args = {}, options = {} }) {
    const page = await searchRequest(req, args, options);
    return page.items.length > 0;
}
