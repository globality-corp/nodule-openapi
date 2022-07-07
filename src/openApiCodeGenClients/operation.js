/* Callable operations.
 */
import { assign } from 'lodash';
import { getConfig, getMetadata } from '@globality/nodule-config/lib';
import { buildHeaders } from '../clients/openapi';
import buildError from '../error';


// TODO - move this function elsewhere / use the existing function
function buildAdapter(context) {
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
export default (
    axiosInstance,
    ResourceApi,
    config,
    context,
    resourceName,
    operation,
    serviceName,
    basePath,
) => async (req, args, options) => {
    // TODO - allow options to be passed in to merge with and override
    // the requestConfig that gets created here
    const axiosRequestConfig = {
        adapter: buildAdapter({
            name: serviceName,
            operationName: `${resourceName}.${operation}`,
        }),
        headers: buildHeaders({
            context,
            req,
        }),
    };

    // enhance the context with service and operation name
    const requestContext = assign({}, context, {
        operation,
        resourceName,
    });

    const fixedBaseUrl = `${config.baseUrl}${basePath}`;
    const resourceApiObj = new ResourceApi({}, fixedBaseUrl, axiosInstance);

    let errorResponse;
    try {
        /* eslint-disable no-await-in-loop */
        const response = await resourceApiObj[operation](...args, axiosRequestConfig);

        // TODO - add in a build response
        return response.data;
    } catch (error) {
        errorResponse = error;
    }

    return buildError(requestContext)(
        errorResponse,
        requestContext,
        req,
        options,
    );
};
