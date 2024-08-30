import { err, ok } from 'neverthrow';

import { firstSafe, oneSafe } from '../paging';
import { NoResults, TooManyResults } from '../../error';

const mockWarning = jest.fn();
jest.mock('@globality/nodule-config', () => ({
    getMetadata: () => ({
        testing: false,
    }),
    bind: () => { },
    setDefaults: () => { },
    getConfig: () => null,
    getContainer: () => ({
        logger: {
            warning: mockWarning,
        },
    }),
}));
describe('safe paging functions', () => {
    const req = {};
    let searchRequestNone;
    let searchRequestOne;
    let searchRequestTwo;

    beforeEach(() => {
        searchRequestNone = jest.fn(async () => ({
            count: 0,
            items: [],
        }));
        searchRequestOne = jest.fn(async () => ({
            count: 1,
            items: [{ id: 1 }],
        }));
        searchRequestTwo = jest.fn(async () => ({
            count: 2,
            items: [{ id: 1 }, { id: 2 }],
        }));
    });

    describe('one', () => {
        it('success', async () => {
            const res = await oneSafe(req, { searchRequest: searchRequestOne, args: { param: 'eter' } });

            expect(res).toEqual(ok({ id: 1 }));

            expect(searchRequestOne).toHaveBeenCalledTimes(1);
            expect(searchRequestOne).toHaveBeenCalledWith(req, {
                param: 'eter',
            }, {});
        });

        it('no results', async () => {
            const res = await oneSafe(req, { searchRequest: searchRequestNone, args: { param: 'eter' } });

            expect(res).toEqual(err(new NoResults()));

            expect(searchRequestNone).toHaveBeenCalledTimes(1);
            expect(searchRequestNone).toHaveBeenCalledWith(req, {
                param: 'eter',
            }, {});
        });

        it('too many results', async () => {
            const res = await oneSafe(req, { searchRequest: searchRequestTwo, args: { param: 'eter' } });

            expect(res).toEqual(err(new TooManyResults()));

            expect(searchRequestTwo).toHaveBeenCalledTimes(1);
            expect(searchRequestTwo).toHaveBeenCalledWith(req, {
                param: 'eter',
            }, {});
        });
    });

    describe('first', () => {
        test('some results', async () => {
            const res = await firstSafe(req, { searchRequest: searchRequestTwo, args: { param: 'eter' } });

            expect(res).toEqual(ok({ id: 1 }));
            expect(searchRequestTwo).toHaveBeenCalledTimes(1);
            expect(searchRequestTwo).toHaveBeenCalledWith(req, {
                param: 'eter',
            }, {});
        });

        test('no results', async () => {
            const res = await firstSafe(req, { searchRequest: searchRequestNone, args: { param: 'eter' } });

            expect(res).toEqual(err(new NoResults('No results found for search')));
            expect(searchRequestNone).toHaveBeenCalledTimes(1);
            expect(searchRequestNone).toHaveBeenCalledWith(req, {
                param: 'eter',
            }, {});
        });
    });
});
