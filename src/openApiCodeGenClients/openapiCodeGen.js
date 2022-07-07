import { getConfig } from '@globality/nodule-config';
import CallableOperationWrapper from './operation';

import axios from 'axios';
import { get } from 'lodash';

export const OpenAPIClient = (options, serviceName, resourceApis, spec) => {
    // This is where we create the ApiClient
    let openApiClient = {};
    const axiosInstance = axios.create({
        baseURL: options.baseUrl,
        timeout: options.timeout,
    });

    const basePath = get(spec, 'basePath', '');
    Object.keys(resourceApis).forEach((resourceApiLabel) => {
        const { operations, resourceApi: ResourceApi } = resourceApis[resourceApiLabel];
        for (let i = 0; i < operations.length; i++) {
            const operationName = operations[i];

            const context = {};
            openApiClient = {
                ...openApiClient,
                [resourceApiLabel]: {
                    ...openApiClient[resourceApiLabel],
                    [operationName]: CallableOperationWrapper(
                        axiosInstance,
                        ResourceApi,
                        options,
                        context,
                        resourceApiLabel,
                        operationName,
                        serviceName,
                        basePath,
                    ),
                },
            };
        }
    });
    return openApiClient;
};

// eslint-disable-line import/prefer-default-export
export function createOpenAPIClientV2(name, resourceApis, spec) {

    const config = getConfig(`clients.${name}`) || {};
    const { baseUrl, timeout } = config;

    const options = {
        baseUrl,
        timeout,
        // retries, TODO: Need to implement
    };

    const result = OpenAPIClient(options, name, resourceApis, spec);
    console.log(result);
    return result;
}
