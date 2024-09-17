import { NoResults } from '../../error.js';

export default async function first(
    req, { searchRequest, args = {}, returnNullOnEmpty = false, options = {} },
) {
    const page = await searchRequest(req, args, options);
    if (page.items.length) {
        return page.items[0];
    }
    if (returnNullOnEmpty) {
        return null;
    }
    throw new NoResults('No results found for search');
}
