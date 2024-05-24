/* eslint-disable import/prefer-default-export */
// @ts-check
import { Ok, Err } from 'ts-results';
import { TooManyResults, NoResults } from '../../error';

/**
 * @typedef {(req: any, args: any, options: any) => Promise<{items: any[]}>} SearchRequest
 */

/**
 * @param {any} req
 * @param {{searchRequest: SearchRequest, args: any, options: any}} args
 * @returns {Promise<import('ts-results').Result<any, import('../../error').OpenAPIError>>}
 */
export async function oneSafe(req, { searchRequest, args = {}, options = {} }) {
    const page = await searchRequest(req, args, options);

    if (page.items.length === 1) {
        return Ok(page.items[0]);
    }

    if (page.items.length > 1) {
        return Err(new TooManyResults(`Too many results found for search: ${page.items.length}`));
    }

    return Err(new NoResults('No results found for search'));
}
