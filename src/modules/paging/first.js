import { NoResults } from '../../error';

export default async function first(req, { searchRequest, args = {}, returnNullOnEmpty = false }) {
    const page = await searchRequest(req, args);
    if (page.items.length) {
        return page.items[0];
    }
    if (returnNullOnEmpty) {
        return null;
    }
    throw new NoResults('No results found for search');
}
