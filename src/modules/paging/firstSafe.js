/* eslint-disable import/prefer-default-export */
import { ResultAsync, errAsync, okAsync } from 'neverthrow';
import { NoResults, OpenAPIError } from '../../error.js';

/**
 * @param {unknown} req
 * @param {{
 *  searchRequest: (req: any, args: any, options: any) => Promise<{items: any[]}>,
 *  args: Record<string, unknown>,
 *  options?: Record<string, unknown>
 *  returnNullOnEmpty?: boolean
 * }} args
 */
export function firstSafe(
    req, { searchRequest, args = {}, options = {}, returnNullOnEmpty = false },
) {
    const search = ResultAsync.fromThrowable(searchRequest, err => new OpenAPIError(`Search error: ${err}`));

    return search(req, args, options).andThen((page) => {
        if (page.items.length === 0) {
            if (!returnNullOnEmpty) {
                return errAsync(new NoResults('No results found for search'));
            }

            return okAsync(null);
        }

        return okAsync(page.items[0]);
    });
}
