import { getConfig, getContainer, getMetadata } from '@globality/nodule-config';
import ApiClient from './apiClient';
import CallableOperationWrapper from './operation';

export const OpenAPIClient = (options, name, resourceApis) => {
    // This is where we create the ApiClient
    let openApiClient = {};
    console.log('ApiClient123');
    const apiClient = new ApiClient(options.baseUrl, options.timeout);
    Object.keys(resourceApis).forEach((resourceApiLabel) => {
        console.log(`resourceApiLabel: ${resourceApiLabel}`);
        const { resourceApi: ResourceApi, operations } = resourceApis[resourceApiLabel];
        const resourceApiObj = new ResourceApi(apiClient);

        console.log('resourceApiObj');
        console.log(resourceApiObj);
        console.log(resourceApiObj.apiClient);
        for (let i = 0; i < operations.length; i++) {

            const operationName = operations[i];
            const resourceApiFn = resourceApiObj[operationName];

            console.log('resourceApiFn + operationName:');
            console.log(resourceApiFn);
            console.log(operationName);

            const context = {};
            openApiClient = {
                ...openApiClient,
                [resourceApiLabel]: {
                    ...openApiClient[resourceApiLabel],
                    [operationName]: CallableOperationWrapper(ApiClient, ResourceApi, options, context, resourceApiLabel, operationName),
                },
            };

            console.log('resulting openApiclient object is:');
            console.log(openApiClient);
        }
    });
    console.log('openApiClient being returned as:');
    console.log(openApiClient);
    return openApiClient;
};

// eslint-disable-line import/prefer-default-export
export function createOpenAPIClientV2(name, resourceApis) {
    console.log('createOpenAPIClientV2...');

    const config = getConfig(`clients.${name}`) || {};
    const { baseUrl, timeout, retries, namingOverride, namingPath, namingQuery } = config;

    const options = {
        baseUrl,
        timeout,
        // TODO - sort retries later
        // retries,
    };

    const result = OpenAPIClient(options, name, resourceApis);
    console.log(result);
    return result;
}
