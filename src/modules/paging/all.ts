import { flatten, range, isNil } from 'lodash';
import { getConfig, getContainer } from '@globality/nodule-config';
import { MaxLimitReached } from '../../error';
import concurrentPaginate from '../concurrency';
import { Config } from '../../types/config';

const DEFAULT_LIMIT = 20;
const DEFAULT_PAGING_UPPER_BOUND = 200;

type BaseRequestArgs = {
    limit?: number;
    offset?: number;
}

type Page<Item> = { items: Item[]; offset?: number; limit?: number; count: number };

type BaseRequestFunc<Context, Args, Result> = (context: Context, args: Args) => Promise<Page<Result>>

/**
 * Pagination for search requests that expect parameters to be passed in the body.
 * For example:
 * GET https://service.env.globality.io/api/resource/batch
 * Content-Type: application/json; charset=UTF-8
 * {
 *     "identifiers": ["ID1", "ID2"... "ID1000"],
 *     "limit": 20,
 *     "offset": 0
 * }
 * A typical use case is for batch requests that send a long list of identifiers as a parameter
 * In this case searching via URL query is not possible because of URL length limit
 * @body search requests args. Can optionally contain initial 'limit' and 'offset' values
 */
export async function allForBodySearchRequest<Context, Args extends BaseRequestArgs, Result>(
    req: Context,
    { searchRequest, body = {}, maxLimit = null, concurrencyLimit = 1 }: {
        searchRequest: BaseRequestFunc<Context, { body: Args }, Result>,
        body: Args | Partial<Args>,
        maxLimit: number | null,
        concurrencyLimit: number
    },
) {
    const { limit, offset, ...searchArgs } = body;

    const defaultLimit = getConfig<Config, "defaultLmit">('defaultLmit') ?? DEFAULT_LIMIT;

    let params = {
        body: {
            ...searchArgs,
            limit: limit || defaultLimit,
            offset: offset || 0,
        } as Args,
    };
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
            params = {
                body: {
                    ...searchArgs,
                    limit: limit || defaultLimit,
                    offset: pageOffset,
                } as Args,
            };
            return searchRequest(req, params);
        }),
        concurrencyLimit,
    );
    return flatten([firstPage, ...nextPages].map(page => page.items));
}

/**
 * Pagination for search requests that takes parameters in url query
 * @args search requests args. Can optionally contain initial 'limit' and 'offset' values
 */
export default async function all<Context, Args extends BaseRequestArgs, Result>(
    req: Context,
    { searchRequest, args = {}, maxLimit = null, concurrencyLimit = 1 }: {
        searchRequest: BaseRequestFunc<Context, Args, Result>,
        args: Args | Partial<Args>,
        maxLimit: number | null,
        concurrencyLimit: number
    },
) {
    const { limit, offset, ...searchArgs } = args;

    const defaultLimit = getConfig<Config, "defaultLmit">('defaultLmit') || DEFAULT_LIMIT;

    const params = {
        ...searchArgs,
        limit: limit || defaultLimit,
        offset: offset || 0,
    } as Args;
    const firstPage = await searchRequest(req, params);

    if (limit === defaultLimit && firstPage.count > DEFAULT_PAGING_UPPER_BOUND) {
        const { logger } = getContainer();
        logger.warning(
            req,
            'A large dataset requested with default limit set.',
            {
                searchRequest,
                numResults: firstPage.count,
                searchParam: searchArgs,
            },
        );
    }

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
        offsets.map(pageOffset => searchRequest(req, { ...params, offset: pageOffset })),
        concurrencyLimit,
    );
    return flatten([firstPage, ...nextPages].map(page => page.items));
}
