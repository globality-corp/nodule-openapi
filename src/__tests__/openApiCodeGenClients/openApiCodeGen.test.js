import axios from 'axios';

import { clearBinding, Nodule } from '@globality/nodule-config/lib';
import { OpenAPIClient } from '../../openApiCodeGenClients';
import exampleV3Spec from './exampleSpec.v3.json';
import { mockResponse } from '../../testing';

const exampleOptions = {
    baseUrl: 'localhost:5000',
    timeout: 5000,
};
const serviceName = 'myNewService';
// this is an example of what the code generated openapi client ResourceApi look like
class PublicV1Api {
    // eslint-disable-next-line class-methods-use-this
    cheesyPizzaRetrieve(pizzaId, axiosRequestConfig) {
        return axios.request(axiosRequestConfig);
    }
}
const resourceApis = {
    publicV1Api: PublicV1Api,
};


describe('OpenAPIClient', () => {
    const req = {};

    const PIZZAS = [{
        id: '1',
        name: 'Cheesy Pizza',
    }];

    beforeEach(() => {
        clearBinding('config');
    });

    it('correctly generates openapi client', async () => {
        const client = OpenAPIClient(exampleOptions, serviceName, resourceApis, exampleV3Spec);
        expect(typeof client.publicV1Api.cheesyPizzaRetrieve).toBe('function');
    });

    it('supports mocking response', async () => {
        const config = await Nodule.testing().fromObject(
            mockResponse('myNewService', 'publicV1Api.cheesyPizzaRetrieve', {
                items: [
                    PIZZAS,
                ],
            }),
        ).load();

        const client = OpenAPIClient(exampleOptions, serviceName, resourceApis, exampleV3Spec);

        const pizzaId = undefined;
        const args = [pizzaId];
        const result = await client.publicV1Api.cheesyPizzaRetrieve(req, args);
        expect(result).toEqual({
            items: [
                PIZZAS,
            ],
        });

        const myNewServiceMock = config.clients.mock.myNewService.publicV1Api.cheesyPizzaRetrieve;
        expect(myNewServiceMock)
            .toHaveBeenCalledTimes(1);
        expect(myNewServiceMock.mock.calls[0][0].headers)
            .toMatchObject({
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json; charset=utf-8',
                'X-Request-Service': 'test',
            });
    });
});
