/* Callable operations.
 */
import { assign, get } from 'lodash';
import { getContainer } from '@globality/nodule-config';
import axios from 'axios';

import buildError from './error';
import buildRequest from './request';
import buildResponse from './response';
import Validator from './validation';


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
    const retries = get(request, 'retries', 0);
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
            if (logger) {
                logger.warning(req, `API request failed; attempt ${attempt + 1}`);
            }
            errorResponse = error;
        }
    }

    return buildError(requestContext)(
        errorResponse,
        requestContext,
        req,
        options,
    );
};
