# nodule-openapi

Opinionated OpenAPI 2.0 (Swagger) Client


## Conventions

 -  Client code should be lightweight (e.g. few dependencies) and initialize quickly (read: synchronously)

    As such, OpenAPI specs are expected to be available locally (e.g. commited to version control) and
    loaded statically (i.e. without requiring promise resolution).

 -  Client interfaces should use fluent JavaScript.

    As of this writing, OpenAPI operations are exposed as functions named after `operationId`, scoped to an
    an object named after the operation's first `tag`. (Both operation fields are thus mandatory).

 -  HTTP requests are assumed to use camelCase for body parameters and snake_case for path and query string
    parameters; parameter names should be automatically converted from camelCase accordingly.

 -  Extensible most default: most internal behaviors should be overridable via options.


## Usage

In pseudo-code:

    const OpenAPI = require('./lib').default;
    const spec = require('./example/petstore-minimal.json');

    const client = OpenAPI(spec, 'petstore');
    client.pet.search().then(...).catch(...);

## createOpenAPIClient

The `nodule-openapi` includes a function (createOpenAPIClient) that allows the wrapping of the OpenAPI
swagger client into callable functions. See the README in the src/clients for more information.

## Retries

Clients can additionally be configured to automatically retry failed requests, after having met some criteria to qualify
it as retryable:

* The raised error is retryable (e.g. 50x response codes, client exceptions)
* The operation itself is retryable. As of this writing, this will only include read operations

By default, retries are not enabled.
