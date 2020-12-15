import { range } from 'lodash';
import { allForBodySearchRequest } from '../paging';

const items = range(100).map((id) => ({ id }));
const req = {};
let searchRequest;

describe('Pagination', () => {

    beforeEach(() => {
        searchRequest = jest.fn(async (_, { body: { limit = 20, offset = 0 } }) => ({
            count: items.length,
            items: items.slice(offset, offset + limit),
            limit,
            offset,
        }));
    });

    it('test search all items', async () => {
        const res = await allForBodySearchRequest(req, { searchRequest, body: { limit: 40 } });
        expect(res).toEqual(items);

        expect(searchRequest).toHaveBeenCalledTimes(3);
        expect(searchRequest).toHaveBeenCalledWith(req, {
            body: {
                offset: 0,
                limit: 40,
            },
        });
        expect(searchRequest).toHaveBeenCalledWith(req, {
            body: {
                offset: 40,
                limit: 40,
            },
        });
        expect(searchRequest).toHaveBeenCalledWith(req, {
            body: {
                offset: 80,
                limit: 40,
            },
        });
    });

    it('test search items passes params', async () => {
        const res = await allForBodySearchRequest(req, { searchRequest, body: { limit: 200, param: 'eter' } });
        expect(res).toEqual(items);

        expect(searchRequest).toHaveBeenCalledTimes(1);
        expect(searchRequest).toHaveBeenCalledWith(req, {
            body: {
                offset: 0,
                limit: 200,
                param: 'eter',
            },
        });
    });
});
