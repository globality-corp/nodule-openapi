import { getConfig } from '@globality/nodule-config';
import axios from 'axios';
import { get } from 'lodash';

import CallableOperationWrapper from './operation';

export const convertResourceNameToBaseTag = (ResourceApi) => {
    // e.g ResourceApi = PublicV1Api
    // associated tag could be `/public/v1` or `public/v1`
    // so we convert to a "baseTag" which can then be used in a matching process later on
    const resourceName = ResourceApi.name;
    console.log(resourceName);

    const baseResourceName = resourceName.replace('Api', ''); // PublicV1
    const names = baseResourceName.split(/(?=[A-Z])/); // ['Public', 'V1']
    const lowerCasedNames = names.map(name => name.toLowerCase()); // ['public', 'v1']
    return lowerCasedNames.join('/'); // public/v1
};

const doesBaseTagMatch = (baseTag, tags) => {
    // e.g baseTag = `public/v1`
    // e.g tags = `['/landing_page', 'public/v1']`
    return;
};

export const findAllOperationIdsUsingBaseTag = (baseTag, spec) => {
    // tag is at paths.`path`.`operation`.tags
    const { paths } = spec;
    Object.keys(paths).forEach((path) => {
        const operations = paths[path];
        Object.keys(operations).forEach((operation) => {
            const { tags, operationId } = operations[operation];
            if (doesBaseTagMatch(baseTag, tags)) {
                // return
            }
        });
    };


    export const OpenAPIClient = (options, serviceName, resourceApis, spec) => {
        // This is where we create the ApiClient
        let openApiClient = {};
        const axiosInstance = axios.create({
            baseURL: options.baseUrl,
            timeout: options.timeout,
        });

        const basePath = get(spec, 'basePath', '');
        Object.keys(resourceApis).forEach((resourceApiLabel) => {
            // const { operations, resourceApi: ResourceApi } = resourceApis[resourceApiLabel];
            console.log(resourceApis);
            const ResourceApi = resourceApis[resourceApiLabel];
            const operations = [];
            const baseTag = convertResourceNameToBaseTag(ResourceApi);
            console.log(baseTag);
            // We need to get the operations

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

        return OpenAPIClient(options, name, resourceApis, spec);
    }
