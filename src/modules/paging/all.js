import { flatten, range, isNil } from 'lodash';
import { getConfig } from '@globality/nodule-config';
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
    if (maxLimit && firstPage.items.length >= maxLimit) {
        return firstPage.items.slice(0, maxLimit);
    }

    let rangeEnd = firstPage.count;
    if (maxLimit) {
        rangeEnd = Math.min(firstPage.count, maxLimit);
    }
    const offsets = range(firstPage.offset + firstPage.limit, rangeEnd, firstPage.limit);
    const nextPages = await concurrentPaginate(
        offsets.map(pageOffset => searchRequest(req, { ...params, offset: pageOffset })),
        concurrencyLimit,
    );

    const items = flatten([firstPage, ...nextPages].map(page => page.items));
    if (maxLimit) {
        return items.slice(0, maxLimit);
    }
    return items;
}
