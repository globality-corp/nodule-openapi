import { TooManyResults } from '../../error';

export default async function none(req, { searchRequest, args = {} }) {
    const page = await searchRequest(req, args);
    if (page.items.length) {
        throw new TooManyResults(`Too many results found for search: ${page.items.length}`);
    }
    return null;
}
