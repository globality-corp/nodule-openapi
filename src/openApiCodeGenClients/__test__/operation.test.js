import { clearBinding, Nodule } from '@globality/nodule-config';
import { jest } from '@jest/globals';

import spec from '../../testing/petstore.json';
import { createOpenAPIClientV2 } from '../../index.js';

class PetApi {
    search(args, axiosRequestConfig) { // eslint-disable-line class-methods-use-this, no-unused-vars
        return { data: { items: [{ id: '1', name: 'Rex' }] } };
    }
}

describe('createOpenAPIClient', () => {
    const req = {
        id: 'request-id',
        locals: {
            client: {
                id: 'client-id-123',
            },
        },
    };

    const REX = {
        id: '1',
        name: 'Rex',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        clearBinding('config');
    });

    it('passes proper x-request-id in header based on req.id', async () => {
        await Nodule.testing().load();

        const spy = jest.spyOn(PetApi.prototype, 'search');

        const client = createOpenAPIClientV2('petstore', { petApi: PetApi }, spec);
        const result = await client.petApi.search(req);

        expect(result).toEqual({
            items: [
                REX,
            ],
        });
        expect(spy).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(spy.mock.calls[0][1].headers['X-Request-Id']).toBe('request-id');
    });

    it('passes proper x-request-client in header based on req data', async () => {
        await Nodule.testing().load();

        // First we need to reset spy
        const spy = jest.spyOn(PetApi.prototype, 'search');
        // spy.mockClear();

        const client = createOpenAPIClientV2('petstore', { petApi: PetApi }, spec);
        const result = await client.petApi.search(req);

        expect(result).toEqual({
            items: [
                REX,
            ],
        });
        expect(spy).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(spy.mock.calls[0][1].headers['X-Request-Client']).toBe('client-id-123');
    });

    it('if no client id found then x-request-client header is not included', async () => {
        await Nodule.testing().load();

        const spy = jest.spyOn(PetApi.prototype, 'search');

        const client = createOpenAPIClientV2('petstore', { petApi: PetApi }, spec);
        const reqWithNoClientData = {
            id: 'request-id',
            locals: {
                user: {},
            },
        };
        const result = await client.petApi.search(reqWithNoClientData);

        expect(result).toEqual({
            items: [
                REX,
            ],
        });
        expect(spy).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(spy.mock.calls[0][1].headers['X-Request-Client']).toBe(undefined);
    });

    it('includes additional headers from options', async () => {
        await Nodule.testing().load();

        const spy = jest.spyOn(PetApi.prototype, 'search');

        const client = createOpenAPIClientV2('petstore', { petApi: PetApi }, spec);
        const reqWithNoClientData = {
            id: 'request-id',
            locals: {
                user: {},
            },
        };
        const result = await client.petApi.search(reqWithNoClientData, null, {
            additionalHeaders: {
                'X-Request-Test-Header': 'test',
            },
        });

        expect(result).toEqual({
            items: [
                REX,
            ],
        });
        expect(spy).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(spy.mock.calls[0][1].headers['X-Request-Client']).toBe(undefined);
        // @ts-ignore
        expect(spy.mock.calls[0][1].headers['X-Request-Test-Header']).toBe('test');
    });

    it('timeout', async () => {
        await Nodule.testing().load();

        const spy = jest.spyOn(PetApi.prototype, 'search');

        const client = createOpenAPIClientV2('petstore', { petApi: PetApi }, spec);
        const reqTimeout = {
            id: 'request-id',
            locals: {
                user: {},
                startTime: process.hrtime.bigint(),
                requestTotalMaxTimeInMillis: 100,
            },
        };
        const result = await client.petApi.search(reqTimeout, null, {
            additionalHeaders: {
                'X-Request-Test-Header': 'test',
            },
        });

        expect(result).toEqual({
            items: [
                REX,
            ],
        });
        expect(spy).toHaveBeenCalledTimes(1);
        // @ts-ignore
        expect(spy.mock.calls[0][1].headers['X-Request-Client']).toBe(undefined);
        // @ts-ignore
        expect(spy.mock.calls[0][1].headers['X-Request-Test-Header']).toBe('test');

        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 101));

        await expect(client.petApi.search(reqTimeout, null, {
            additionalHeaders: {
                'X-Request-Test-Header': 'test',
            },
        })).rejects.toThrow(
            'Request took longer than allowed',
        );

        expect(spy).toHaveBeenCalledTimes(1);
    });
});
