/* Callable operations.
 */
import { assign, get, includes, lowerCase } from 'lodash-es';
import { getContainer } from '@globality/nodule-config';
import axios from 'axios';

import buildError, { normalizeError } from './error.js';
import buildRequest from './request.js';
import buildResponse from './response.js';
import Validator from './validation.js';
import { checkTimeout } from './openApiCodeGenClients/utils.js';

function sleep(time) {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setTimeout(resolve, time));
}

function isMutationOperation(request) {
    return includes(
        [
            'post',
            'patch',
            'put',
            'delete',
        ],
        lowerCase(request.method),
    );
}

function isProxyError(openApiError) {
    return includes(
        [
            501, // Service unable to handle request due to wrong routing
            503, // Service instance does not exist.
        ],
        openApiError.code,
    );
}

export function isRetryableOperation(openApiError) {
    return includes(
        [
            // Client timeout/error, retry
            'econnaborted',
            'econnreset',
            // 50x responses are retryable
            '502',
            '504',
        ],
        lowerCase(openApiError.code),
    );
}

export function extendHeadersFromOptions(request, options) {
    /**
     * Extend request headers based on the addtional headers
     * passed in via the options object
     */
    if (options && options.additionalHeaders) {
        return {
            ...request,
            headers: {
                ...request.headers,
                ...options.additionalHeaders,
            },
        };
    }
    return request;
}

/* Create a new callable operation that return a Promise.
 */
export default (context, name, operationName) => async (req, args, options) => {
    checkTimeout(req);

    // validate inputs
    Validator(context)(req, operationName, args);

    // allow overriding the http implementation
    const http = get(context, 'options.http', () => axios)(req, name, operationName);

    // enhance the context with service and operation name
    const requestContext = assign({}, context, {
        name,
        operationName,
    });

    let request = buildRequest(
        requestContext,
        req,
        args,
        options,
    );

    // Extend headers from options
    // Allows for passing in specific headers for a given request
    request = extendHeadersFromOptions(request, options);

    const { buildRequestLogs, logSuccess, logFailure } = getContainer('logging') || {};

    let rawResponse;
    let successResponse;
    let errorResponse;
    let proxyErrorsCount = 0;
    let serviceErrorsCount = 0;
    let attempt = 0;
    let openApiError;

    const retryMessages = [];
    const proxyRetriesCount = get(request, 'proxyRetries', 0);
    const proxyRetriesDelayTime = get(request, 'proxyRetriesDelay', 0);
    const retriesCount = isMutationOperation(request) ? 0 : get(request, 'retries', 0);
    const executeStartTime = process.hrtime();
    const requestLogs = buildRequestLogs
        ? buildRequestLogs(req, name, operationName, request)
        : null;

    while (proxyErrorsCount <= proxyRetriesCount && serviceErrorsCount <= retriesCount) {
        try {
            /* eslint-disable no-await-in-loop */
            rawResponse = await http(request);
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

            if (isProxyError(openApiError)) {
                proxyErrorsCount += 1;
                retryMessages.push(`Proxy error; code: ${openApiError.code}, attempt: ${attempt}`);
                await sleep(proxyRetriesDelayTime); // Delay next request
            } else {
                serviceErrorsCount += 1;
                if (!isRetryableOperation(openApiError)) {
                    break;
                }
                retryMessages.push(`API request failed; code: ${openApiError.code}, attempt: ${attempt}`);
            }
        }
    }

    if (requestLogs) {
        requestLogs.failureMessages = retryMessages;
        requestLogs.proxyErrorsCount = proxyErrorsCount;
        requestLogs.serviceErrorsCount = serviceErrorsCount;
    }

    if (successResponse !== undefined) {
        if (logSuccess) {
            logSuccess(req, request, rawResponse, requestLogs, executeStartTime);
        }
        return successResponse;
    }
    if (logFailure) {
        logFailure(req, request, openApiError, requestLogs);
    }
    return buildError(requestContext)(
        errorResponse,
        requestContext,
        req,
        options,
    );
};
