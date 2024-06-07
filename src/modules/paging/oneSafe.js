/* eslint-disable import/prefer-default-export */
// @ts-check
import { okAsync, errAsync, ResultAsync } from 'neverthrow';
import { NoResults, OpenAPIError, TooManyResults } from '../../error';

/**
 * @param {any} req
 * @param {{
 *  searchRequest: (req: any, args: any, options: any) => Promise<{items: any[]}>,
 *  args: Record<string, unknown>,
 *  options?: Record<string, unknown>
 * }} args
 * @returns {ResultAsync<any, NoResults | TooManyResults>}
 */
export function oneSafe(req, { searchRequest, args = {}, options = {} }) {
    return ResultAsync.fromPromise(
        searchRequest(req, args, options),
        err => new OpenAPIError(`calling searchRequest threw an error: ${err}`),
    ).andThen((page) => {
        if (page.items.length === 1) {
            return okAsync(page.items[0]);
        }

        if (page.items.length > 1) {
            return errAsync(new TooManyResults());
        }

        return errAsync(new NoResults());
    });
}
