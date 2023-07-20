/* Callable operations.
 */
import { assign, get, includes, lowerCase } from 'lodash';
import { getContainer } from '@globality/nodule-config';
import axios from 'axios';

import buildError, { normalizeError } from './error';
import buildRequest from './request';
import buildResponse from './response';
import Validator from './validation';


function sleep(time) {
    return new Promise(resolve => setTimeout(resolve, time));
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

/* Create a new callable operation that return a Promise.
 */
export default (context, name, operationName) => async (req, args, options) => {
    // validate inputs
    Validator(context)(req, operationName, args);

    // allow overriding the http implementation
    const http = get(context, 'options.http', () => axios)(req, name, operationName);

    // enhance the context with service and operation name
    const requestContext = assign({}, context, {
        name,
        operationName,
    });

    const request = buildRequest(
        requestContext,
        req,
        args,
        options,
    );

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
    const requestLogs = buildRequestLogs ?
        buildRequestLogs(req, name, operationName, request) :
        null;

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
