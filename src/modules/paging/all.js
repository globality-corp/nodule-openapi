import { flatten, range, isNil } from 'lodash';
import { getConfig } from '@globality/nodule-config';
import { MaxLimitReached } from '../../error';
import concurrentPaginate from '../concurrency';

const DEFAULT_LIMIT = 20;
function buildSearchRequestParams(searchArgs, limit, offset, sendBodyToSearchRequest) {
    // Deliver params according to target search request - in args or in body
    const paramsValues = {
        ...searchArgs,
        limit,
        offset,
    };
    const paramsWrapper = (sendBodyToSearchRequest) ? { body: paramsValues } : paramsValues;
    return paramsWrapper;
}

async function all(
    req,
    { searchRequest, args = {}, body = null, maxLimit = null, concurrencyLimit = 1 },
) {
    if (!isEmpty(args) && !isEmpty(body)) {
        throw new BadRequest('all() function handles either args or body, no support for both yet');
    }
    const sendBodyToSearchRequest = body != null;
    const paramsSource = sendBodyToSearchRequest ? body : args;
    const { limit, offset, ...searchArgs } = paramsSource;
    const defaultLimit = getConfig('defaultLmit') || DEFAULT_LIMIT;

    let params = buildSearchRequestParams(
        searchArgs,
        limit || defaultLimit,
        offset || 0,
        sendBodyToSearchRequest,
    );
    const firstPage = await searchRequest(req, params);

    if (isNil(firstPage.offset) || isNil(firstPage.limit) || isNil(firstPage.count)) {
        return firstPage.items;
    }
    if (firstPage.offset + firstPage.limit >= firstPage.count) {
        return firstPage.items;
    }
    if (maxLimit && firstPage.count > maxLimit) {
        throw new MaxLimitReached('Count of items exceeds maximum limit');
    }
    const offsets = range(firstPage.offset + firstPage.limit, firstPage.count, firstPage.limit);
    const nextPages = await concurrentPaginate(
        offsets.map(async (pageOffset) => {
            params = buildSearchRequestParams(
                searchArgs,
                limit || defaultLimit,
                pageOffset,
                sendBodyToSearchRequest,
            );
            return searchRequest(req, params);
        }),
        concurrencyLimit,
    );
    return flatten([firstPage, ...nextPages].map(page => page.items));
}
