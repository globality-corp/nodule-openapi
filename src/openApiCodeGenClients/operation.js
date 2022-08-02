/* Callable operations.
 */
import { getContainer } from '@globality/nodule-config/lib';
import { assign, get } from 'lodash';
import { buildAdapter, buildHeaders } from '../clients/openapi';
import buildError, { normalizeError } from '../error';
import { isRetryableOperation } from '../operation';
import buildResponse from '../response';

function createParamsWrapper(args) {
    let paramsWrapper;
    if (Array.isArray(args)) {
        // Whilst args is an array we need to convert it to an object
        paramsWrapper = {
            params: args.reduce((a, v) => ({ ...a, [v]: v }), {}),
        };
    } else {
        // assuming args is an object (i.e next gen typescript api client generation)
        paramsWrapper = {
            params: args,
        };
    }
    return paramsWrapper;
}

/* Create a new callable operation that return a Promise.
 */
export default (
    axiosInstance,
    ResourceApi, // The actual resource API class
    config, // Config including things like baseUrl, timeout, retries etc.
    context, // Extra context for the operation
    resourceName, // Name of the resource API
    operation, // Operation the method on the resource API which is going to be called
    serviceName, // Name of the service which is being called
    basePath,
    isMutation, // flag which describes if the operation is a mutation or not
    requestMethod, // e.g get, post, put etc.
    path, // This is the path defined on the spec for the given operation
) => async (req, args, options) => {
    const operationName = `${resourceName}.${operation}`;
    const axiosRequestConfig = {
        adapter: buildAdapter({
            name: serviceName,
            operationName,
        }),
        headers: buildHeaders({
            context,
            req,
        }),
    };

    const { buildRequestLogs, logSuccess, logFailure } = getContainer('logging') || {};

    let rawResponse;
    let successResponse;
    let attempt = 0;
    let openApiError;

    let errorResponse;
    const retryMessages = [];

    const retriesCount = isMutation ? 0 : get(config, 'retries', 0);
    const executeStartTime = process.hrtime();

    const paramsWrapper = createParamsWrapper(args);
    const requestLogs = buildRequestLogs ?
        buildRequestLogs(req, serviceName, operationName, paramsWrapper) :
        null;

    // enhance the context with service and operation name
    const requestContext = assign({}, context, {
        operation,
        resourceName,
    });

    const methodAndUrl = {
        method: requestMethod,
        url: path,
    };

    const fixedBaseUrl = `${config.baseUrl}${basePath}`;
    const resourceApiObj = new ResourceApi({}, fixedBaseUrl, axiosInstance);

    while (attempt <= retriesCount) {
        try {
            /* eslint-disable no-await-in-loop */
            if (Array.isArray(args)) {
                // args can be passed in as an array of a single object
                // determined by the `useSingleRequestParameter` typescript-axios
                // api client config setting
                rawResponse = await resourceApiObj[operation](...args, axiosRequestConfig);
            } else {
                rawResponse = await resourceApiObj[operation](args, axiosRequestConfig);
            }


            successResponse = buildResponse(requestContext)(
                rawResponse,
                requestContext,
                req,
                options,
            );
            break;

        } catch (error) {
            errorResponse = error;
            attempt += 1;
            openApiError = normalizeError(error);

            if (!isRetryableOperation(openApiError)) {
                break;
            }
            retryMessages.push(`API request failed; code: ${openApiError.code}, attempt: ${attempt}`);
        }
    }

    if (requestLogs) {
        requestLogs.failureMessages = retryMessages;
    }
    if (successResponse) {
        if (logSuccess) {
            logSuccess(req, methodAndUrl, rawResponse, requestLogs, executeStartTime);
        }
        return successResponse;
    }

    if (logFailure) {
        logFailure(req, methodAndUrl, openApiError, requestLogs);
    }

    return buildError(requestContext)(
        errorResponse,
        requestContext,
        req,
        options,
    );
};
