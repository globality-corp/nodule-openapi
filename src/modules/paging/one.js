import { TooManyResults, NoResults } from '../../error';

export default async function one(req, { searchRequest, args = {}, returnNullOnEmpty = false }) {
    const page = await searchRequest(req, args);
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
