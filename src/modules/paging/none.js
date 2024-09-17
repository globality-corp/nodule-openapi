import { TooManyResults } from '../../error.js';

export default async function none(req, { searchRequest, args = {}, options = {} }) {
    const page = await searchRequest(req, args, options);
    if (page.items.length) {
        throw new TooManyResults(`Too many results found for search: ${page.items.length}`);
    }
    return null;
}
