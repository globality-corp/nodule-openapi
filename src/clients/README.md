# createOpenAPIClient

The `nodule-openapi` includes a function (`createOpenAPIClient`) that allows the wrapping of the OpenAPI
swagger client into callable functions.

## Usage

Given a swagger definition `spec`:

    import { createOpenAPIClient } from '@globality/nodule-openapi';

    const client = createOpenAPIClient('name', spec);
    const result = await client.foo.search(req, args);

## Headers

The `createOpenAPIClient` allows for custom headers to be attached to the request. Bind a function to `extendHeaders`
to add information to the headers object.

    bind('extendHeaders', () => extendHeaderFunc)

The function receives the request and basic headers and should return an extended list of headers.

If a given function is not specified, the code defaults to the following set of headers:

* X-Request-Service: Taken from `getMetadata().name`
* X-Request-Id: Taken from `req.id`
* X-Request-Started-At: Taken from `req._startTime` or the current datetime
* X-Request-User: Taken from `req.locals.user.id`
* X-Request-Client: Taken from `req.locals.client.id`
* Jwt: A JSON stringifed representation of `req.locals.jwt`

## Logging

The `createOpenAPIClient` supports custom logging during run time. There are 3 places where we can inject custom logic.

### buildRequestLogs

Prior to the client request being sent out, we can build a set of request log information. The function is called:

    buildRequestLogs(req, serviceName, operationName, request)

The service name, operation name, original req, and the OpenAPI request can be used to build logs.

### logSuccess

If the call succeeds the logSuccess function is called:

    logSuccess(req, request, response, requestLogs, executeStartTime)

The original req, the Open API request and response, the returned value from buildRequestLogs and the execution start
time are passed to this function which can call any logging service.

### logFailure

If the call fails, the logFailure function is called:

    logFailure(req, request, error, requestLogs)

The original req, the Open API request, the error thrown, the returned value from buildRequestLogs and the execution
start time are passed to this function which can call any logging service.

### Usage

To use any of the above functionality, bind a function to the appropriate field:

    bind('logging.buildRequestLogs', () => buildFoo);
    bind('logging.logSuccess', () => successFoo);
    bind('logging.logFailure', () => failureFoo);
