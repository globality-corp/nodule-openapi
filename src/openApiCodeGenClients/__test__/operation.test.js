
import { clearBinding, Nodule } from '@globality/nodule-config';

import spec from '../../testing/petstore.json';
import { createOpenAPIClientV2 } from '../../index';


class PetApi {
    search(args, axiosRequestConfig) { // eslint-disable-line class-methods-use-this, no-unused-vars
        return { data: { items: [{ id: '1', name: 'Rex' }] } };
    }
}


describe('createOpenAPIClient', () => {
    const req = {
        id: 'request-id',
    };

    const REX = {
        id: '1',
        name: 'Rex',
    };

    beforeEach(() => {
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
        expect(spy.mock.calls[0][1].headers['X-Request-Id']).toBe('request-id');
    });
});
