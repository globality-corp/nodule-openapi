import { getConfig } from '@globality/nodule-config';
import axios from 'axios';
import { get } from 'lodash-es';

import CallableOperationWrapper from './operation.js';
import { convertOperationIdToOperationName, findAllOperationIds, isMutationOperation } from './utils.js';


export const OpenAPIClient = (options, serviceName, resourceApis, spec) => {
    let openApiClient = {};
    const axiosInstance = axios.create({
        baseURL: options.baseUrl,
        timeout: options.timeout,
        httpAgent: options.httpAgent,
        httpsAgent: options.httpsAgent,
    });

    const basePath = get(spec, 'basePath', '');
    Object.keys(resourceApis).forEach((resourceApiLabel) => {
        const ResourceApi = resourceApis[resourceApiLabel];
        const operationData = findAllOperationIds(ResourceApi, spec);

        for (let i = 0; i < operationData.length; i++) {
            const { operationId, requestMethod, path } = operationData[i];
            const operationName = convertOperationIdToOperationName(operationId);
            const isMutation = isMutationOperation(requestMethod);

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
                        isMutation,
                        requestMethod,
                        path,
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
    const { baseUrl, timeout, retries } = config;

    const options = {
        baseUrl,
        timeout,
        retries,
    };

    return OpenAPIClient(options, name, resourceApis, spec);
}
