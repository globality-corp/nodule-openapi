/* Callable operations.
 */
import { assign, get, includes, lowerCase } from 'lodash';
import axios from 'axios';
import { getConfig, getMetadata } from '@globality/nodule-config/lib';
// import { getContainer } from '@globality/nodule-config';
// import axios from 'axios';


// TODO - move this function elsewhere / use the existing function
function buildAdapter(context) {
    console.log(context);
    console.log('running build adapter1234');
    const { name, operationName } = context;
    const metadata = getMetadata();
    if (!metadata.testing) {
        return null;
    }

    const key = `clients.mock.${name}.${operationName}`;
    const mock = getConfig(key);

    if (mock) {
        return mock;
    }

    return () => {
        throw new Error(`OpenAPI operation ${name}.${operationName} is not mocked`);
    };
}

/* Create a new callable operation that return a Promise.
 */
export default (axiosInstance, ResourceApi, config, context, resourceName, operation, serviceName, basePath) => async (req, args, options) => {
    // validate inputs
    // Validator(context)(req, operationName, args);

    // allow overriding the http implementation
    // const http = get(context, 'options.http', () => axios)(req, name, operationName);
    console.log(`${resourceName}.${operation}`);
    const axiosRequestConfig = {
        adapter: buildAdapter({
            name: serviceName,
            operationName: `${resourceName}.${operation}`,
        }),
    };

    // enhance the context with service and operation name
    const requestContext = assign({}, context, {
        operation,
        resourceName,
    });

    const fixedBaseUrl = `${config.baseUrl}${basePath}`;
    console.log(fixedBaseUrl);

    const resourceApiObj = new ResourceApi({}, fixedBaseUrl, axiosInstance);

    console.log('Im about to execute...');
    console.log(args);
    const { body } = args;

    // Next thing - the body only works for create operations - doesn't work for search operations
    return resourceApiObj[operation](...args, axiosRequestConfig);

    // const request = buildRequest(
    //     requestContext,
    //     req,
    //     args,
    //     options,
    // );
    // const retries = getRetries(request);
    // const attempts = retries + 1;

    // const { logger } = getContainer();
    // let errorResponse;
    // for (let attempt = 0; attempt < attempts; attempt++) {
    //     try {
    //         /* eslint-disable no-await-in-loop */
    //         const response = await http(request);
    //         return buildResponse(requestContext)(
    //             response,
    //             requestContext,
    //             req,
    //             options,
    //         );
    //     } catch (error) {
    //         errorResponse = error;

    //         if (!isErrorRetryable(error)) {
    //             break;
    //         }

    //         if (logger) {
    //             logger.warning(
    //                 req,
    //                 `API request failed; attempt ${attempt + 1}`,
    //                 { method: request.method, url: request.url },
    //             );
    //         }
    //     }
    // }

    // return buildError(requestContext)(
    //     errorResponse,
    //     requestContext,
    //     req,
    //     options,
    // );
};
