/* Callable operations.
 */
import { assign, get, includes, lowerCase } from 'lodash';
import { getContainer } from '@globality/nodule-config';
import axios from 'axios';

import buildError, { normalizeError } from './error';
import buildRequest from './request';
import buildResponse from './response';
import Validator from './validation';


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

function shouldRetryError(request, error, attempt) {
    const openApiError = normalizeError(error);
    const maxAttempts = get(request, 'retries', 0) + 1;
    const maxProxyAttempts = get(request, 'proxyRetries', 0) + 1;

    if (isProxyError(openApiError)) {
        if (attempt >= Math.max(maxAttempts, maxProxyAttempts)) {
            return false;
        }

        // We always want to retry 501 and 503 errors returned by HAProxy
        return true;
    }

    if (attempt >= maxAttempts || isMutationOperation(request)) {
        // Mutations will be retried on explicit initiation,
        // instead of implicitly retried
        return false;
    }

    if (
        includes(
            [
                // Client timeout/error, retry
                'econnaborted',
                'econnreset',
                // 50x responses are retryable
                '502',
                '504',
            ],
            lowerCase(openApiError.code),
        )
    ) {
        return true;
    }

    return false;
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
    let attempt = 1;
    let errorResponse;

    while (true) {
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

            if (!shouldRetryError(request, error, attempt)) {
                break;
            }

            if (logger) {
                logger.warning(
                    req,
                    `API request failed; attempt ${attempt}`,
                    { method: request.method, url: request.url },
                );
            }

            attempt += 1;
        }
    }

    return buildError(requestContext)(
        errorResponse,
        requestContext,
        req,
        options,
    );
};
