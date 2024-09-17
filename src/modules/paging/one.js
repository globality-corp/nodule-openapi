import { TooManyResults, NoResults } from '../../error.js';

export default async function one(req,
    { searchRequest, args = {}, returnNullOnEmpty = false, options = {} }) {
    const page = await searchRequest(req, args, options);
    if (page.items.length === 1) {
        return page.items[0];
    }
    if (page.items.length > 1) {
        throw new TooManyResults(`Too many results found for search: ${page.items.length}`);
    }
    if (returnNullOnEmpty) {
        return null;
    }
    throw new NoResults('No results found for search');
}
