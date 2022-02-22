/* Callable operations.
 */
import { assign, get, includes, lowerCase } from 'lodash';
// import { getContainer } from '@globality/nodule-config';
// import axios from 'axios';


/* Create a new callable operation that return a Promise.
 */
export default (ApiClient, ResourceApi, config, context, name, operationName) => async (req, args, options) => {
    // validate inputs
    // Validator(context)(req, operationName, args);

    // allow overriding the http implementation
    // const http = get(context, 'options.http', () => axios)(req, name, operationName);

    // enhance the context with service and operation name
    const requestContext = assign({}, context, {
        name,
        operationName,
    });
    const version = '/api/v2'; // we might be able to grab this from the apiClient...
    const fixedBaseUrl = `${config.baseUrl}${version}`;
    console.log(fixedBaseUrl);

    const apiClient = new ApiClient(fixedBaseUrl, config.timeout);
    const resourceApiObj = new ResourceApi(apiClient);
    const resourceApiFn = resourceApiObj[operationName];

    console.log('Im about to execute...');
    console.log(resourceApiFn);
    console.log(args);

    return resourceApiObj[operationName](args);

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
