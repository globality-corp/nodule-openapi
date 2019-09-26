/* Callable operations.
 */
import { assign, get } from 'lodash';
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
    const retries = get(request, 'retries');

    let errorResponse;
    for (let attempts = 0; attempts < retries; attempts++) {
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
        }
    }

    return buildError(requestContext)(
        errorResponse,
        requestContext,
        req,
        options,
    );
};
