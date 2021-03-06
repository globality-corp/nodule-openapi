import { clearBinding, Nodule } from '@globality/nodule-config';

import spec from '../../testing/petstore.json';
import { createOpenAPIClient, mockError, mockResponse } from '../../index';


describe('createOpenAPIClient', () => {
    const req = {};

    const REX = {
        id: '1',
        name: 'Rex',
    };

    beforeEach(() => {
        clearBinding('config');
    });

    it('supports mocking response', async () => {
        const config = await Nodule.testing().fromObject(
            mockResponse('petstore', 'pet.search', {
                items: [
                    REX,
                ],
            }),
        ).load();

        const client = createOpenAPIClient('petstore', spec);

        const result = await client.pet.search(req);
        expect(result).toEqual({
            items: [
                REX,
            ],
        });

        expect(config.clients.mock.petstore.pet.search).toHaveBeenCalledTimes(1);
        expect(config.clients.mock.petstore.pet.search.mock.calls[0][0].headers).toMatchObject({
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json; charset=utf-8',
            'X-Request-Service': 'test',
        });
    });

    it('supports mocking a response with a function based on params', async () => {
        const config = await Nodule.testing().fromObject(
            mockResponse('petstore', 'pet.search', params => ({ items: [params.name] })),
        ).load();

        const client = createOpenAPIClient('petstore', spec);

        const result = await client.pet.search(req, { name: 'abc' });
        expect(result).toEqual({
            items: ['abc'],
        });

        expect(config.clients.mock.petstore.pet.search).toHaveBeenCalledTimes(1);
        expect(config.clients.mock.petstore.pet.search.mock.calls[0][0].headers).toMatchObject({
            Accept: 'application/json, text/plain, */*',
            'Content-Type': 'application/json; charset=utf-8',
            'X-Request-Service': 'test',
        });
    });

    it('supports mocking a response with a function based on url', async () => {
        const config = await Nodule.testing().fromObject(
            mockResponse('petstore', 'pet.retrieve', (_, url) => ({ id: url.split('pet/')[1] })),
        ).load();

        const client = createOpenAPIClient('petstore', spec);

        const result = await client.pet.retrieve(req, { petId: 'pet-id' });
        expect(result).toEqual({
            id: 'pet-id',
        });

        expect(config.clients.mock.petstore.pet.retrieve).toHaveBeenCalledTimes(1);
    });

    it('supports mocking a post response with a function', async () => {
        const config = await Nodule.testing().fromObject(
            mockResponse('petstore', 'pet.create', body => ({
                items: [body.name],
            })),
        ).load();

        const client = createOpenAPIClient('petstore', spec);

        const result = await client.pet.create(req, { body: { name: 'abc' } });
        expect(result).toEqual({
            items: ['abc'],
        });

        expect(config.clients.mock.petstore.pet.create).toHaveBeenCalledTimes(1);
    });

    it('supports mocking errors', async () => {
        const config = await Nodule.testing().fromObject(
            mockError('petstore', 'pet.search', 'Not Found', 404),
        ).load();

        const client = createOpenAPIClient('petstore', spec);

        await expect(client.pet.search(req)).rejects.toThrow(
            'Not Found',
        );

        expect(config.clients.mock.petstore.pet.search).toHaveBeenCalledTimes(1);
    });

    it('raises an error if not mocked', async () => {
        const client = createOpenAPIClient('petstore', spec);

        await expect(client.pet.search(req)).rejects.toThrow(
            'OpenAPI operation petstore.pet.search is not mocked',
        );
    });

    it('raises an error if invalid argument is passed', async () => {
        const config = await Nodule.testing().fromObject(
            mockResponse('petstore', 'pet.search', {
                items: [
                    REX,
                ],
            }),
        ).load();

        const client = createOpenAPIClient('petstore', spec);

        await expect(client.pet.search(req, { foo: 'bar' })).rejects.toThrow(
            'Unsupported argument: "foo" passed to: "pet.search"',
        );

        expect(config.clients.mock.petstore.pet.search).toHaveBeenCalledTimes(0);
    });

    it('raises an error if an invalid response content-type header is returned', async () => {
        const config = await Nodule.testing().fromObject(
            mockResponse('petstore', 'pet.search', '', {
                'content-type': 'text/html',
            }),
        ).load();

        const client = createOpenAPIClient('petstore', spec);

        await expect(client.pet.search(req)).rejects.toThrow(
            'text/html is not a valid response content-type',
        );

        expect(config.clients.mock.petstore.pet.search).toHaveBeenCalledTimes(1);
    });

    it('retries read operations on error', async () => {
        const config = await Nodule.testing().fromObject(
            mockError('petstore', 'pet.search', 'Timeout', 504),
        ).fromObject({
            defaultRetries: 2,
        }).load();

        const client = createOpenAPIClient('petstore', spec);

        await expect(client.pet.search(req)).rejects.toThrow(
            'Timeout',
        );

        expect(config.clients.mock.petstore.pet.search).toHaveBeenCalledTimes(3);
    });

    it('does not attempt to retry on write operations', async () => {
        const config = await Nodule.testing().fromObject(
            mockError('petstore', 'pet.create', 'Not Found', 504),
        ).fromObject({
            defaultRetries: 2,
        }).load();

        const client = createOpenAPIClient('petstore', spec);

        await expect(client.pet.create(req)).rejects.toThrow(
            'Not Found',
        );

        expect(config.clients.mock.petstore.pet.create).toHaveBeenCalledTimes(1);
    });

    it('does not attempt to retry errors that shouldnt be retried', async () => {
        const config = await Nodule.testing().fromObject(
            mockError('petstore', 'pet.search', 'Not Found', 404),
        ).fromObject({
            defaultRetries: 2,
        }).load();

        const client = createOpenAPIClient('petstore', spec);

        await expect(client.pet.search(req)).rejects.toThrow(
            'Not Found',
        );

        expect(config.clients.mock.petstore.pet.search).toHaveBeenCalledTimes(1);
    });

    it('retries client-side errors', async () => {
        const config = await Nodule.testing().fromObject(
            mockError('petstore', 'pet.search', 'Connection aborted', 'ECONNABORTED'),
        ).fromObject({
            defaultRetries: 2,
        }).load();

        const client = createOpenAPIClient('petstore', spec);

        await expect(client.pet.search(req)).rejects.toThrow(
            'Connection aborted',
        );

        expect(config.clients.mock.petstore.pet.search).toHaveBeenCalledTimes(3);
    });
});
