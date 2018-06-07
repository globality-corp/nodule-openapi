import { flatten, range, isNil } from 'lodash';
import { getConfig } from '@globality/nodule-config';
import { MaxLimitReached } from '../../error';
import concurrentPaginate from '../concurrency';

const DEFAULT_LIMIT = 20;

export default async function all(
    req,
    { searchRequest, args = {}, maxLimit = null, concurrencyLimit = 1 },
) {
    const { limit, offset, ...searchArgs } = args;

    const defaultLimit = getConfig('defaultLmit') || DEFAULT_LIMIT;

    const params = {
        ...searchArgs,
        limit: limit || defaultLimit,
        offset: offset || 0,
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
        offsets.map(pageOffset => searchRequest(req, { ...params, offset: pageOffset })),
        concurrencyLimit,
    );
    return flatten([firstPage, ...nextPages].map(page => page.items));
}
