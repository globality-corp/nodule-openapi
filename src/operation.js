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
            501, // Service unable to handle request due to wong routing
            503, // Service instance does not exist.
        ],
        openApiError.code,
    );
}

function isRetryableOperation(openApiError) {
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

    const { logger } = getContainer();
    let errorResponse;

    let proxyErrorsCount = 0;
    let serviceErrorsCount = 0;
    let attempt = 0;
    const proxyRetriesCount = get(request, 'proxyRetries', 0);
    const proxyRetriesDelayTime = get(request, 'proxyRetriesDelay', 0);
    const retriesCount = isMutationOperation(request) ? 0 : get(request, 'retries', 0);

    while (proxyErrorsCount <= proxyRetriesCount && serviceErrorsCount <= retriesCount) {
        try {
            /* eslint-disable no-await-in-loop */
            const response = await http(request);
            return buildResponse(requestContext)(
                response,
                requestContext,
                req,
                options,
            );
        } catch (error) {
            errorResponse = error;
            attempt += 1;
            const openApiError = normalizeError(error);

            if (isProxyError(openApiError)) {
                proxyErrorsCount += 1;

                if (logger) {
                    logger.warning(
                        req,
                        `API request failed; proxy error; attempt ${attempt}`,
                        { method: request.method, url: request.url, code: openApiError.code },
                    );
                }

                await sleep(proxyRetriesDelayTime); // Delay next request
            } else {
                if (!isRetryableOperation(openApiError)) break;

                serviceErrorsCount += 1;

                if (logger) {
                    logger.warning(
                        req,
                        `API request failed; attempt ${attempt}`,
                        { method: request.method, url: request.url },
                    );
                }
            }
        }
    }

    return buildError(requestContext)(
        errorResponse,
        requestContext,
        req,
        options,
    );
};
