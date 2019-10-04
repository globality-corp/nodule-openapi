/* Callable operations.
 */
import { assign, get, includes, lowerCase } from 'lodash';
import { getContainer } from '@globality/nodule-config';
import axios from 'axios';

import buildError from './error';
import buildRequest from './request';
import buildResponse from './response';
import Validator from './validation';


function getRetries(request) {
    if (
        includes(
            [
                'post',
                'patch',
                'put',
                'delete',
            ],
            lowerCase(request.method),
        )
    ) {
        // Mutations will be retried on explicit initiation,
        // instead of implicitly retried
        return 0;
    }

    return get(request, 'retries', 0);
}

function getErrorResponseCode(error) {
    if (get(error, 'data.code')) {
        // Case: error directly from the service
        return error.data.code;
    }
    if (get(error, 'response.status')) {
        // Case: error from the a proxy service
        return error.response.status;
    }

    return null;
}

function isErrorRetryable(error) {
    if (
        includes(
            [
                'econnaborted',
                'econnreset',
            ],
            lowerCase(error.code),
        )
    ) {
        // Client timeout/error, retry
        return true;
    }

    const errorCode = getErrorResponseCode(error);

    if (
        includes(
            [
                502,
                503,
                504,
            ],
            errorCode,
        )
    ) {
        // 50x responses are retryable
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
    const retries = getRetries(request);
    const attempts = retries + 1;

    const { logger } = getContainer();
    let errorResponse;
    for (let attempt = 0; attempt < attempts; attempt++) {
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

            if (!isErrorRetryable(error)) {
                break;
            }

            if (logger) {
                logger.warning(
                    req,
                    `API request failed; attempt ${attempt + 1}`,
                    { method: request.method, url: request.url },
                );
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
