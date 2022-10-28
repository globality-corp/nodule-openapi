import { camelCase, includes, isNil, lowerCase } from 'lodash';


export function isMutationOperation(requestMethod) {
    return includes(
        [
            'post',
            'patch',
            'put',
            'delete',
        ],
        lowerCase(requestMethod),
    );
}


export function convertResourceNameToBaseTags(ResourceApi) {
    // e.g ResourceApi = PublicV1Api
    // associated tag could be `/public/v1` or `public/v1`
    // so we convert to a "baseTag" which can then be used in a matching process later on
    const resourceName = ResourceApi.name;

    const baseResourceName = resourceName.replace('Api', ''); // PublicV1
    const names = baseResourceName.split(/(?=[A-Z])/); // ['Public', 'V1']
    return names.map(name => name.toLowerCase()); // ['public', 'v1']
}

export function doTagsMatch(baseTags, tags) {
    // e.g baseTag = `['public', 'v1']`
    // e.g tags = `['/landing_page', 'public/v1']`
    const matchedTags = tags.filter((tag) => {
        let noMatch = true;
        baseTags.forEach((baseTag) => {
            if (!tag.toLowerCase().includes(baseTag)) {
                noMatch = false;
            }
        });
        return noMatch;
    });
    return matchedTags.length > 0;
}

export function findAllOperationIdsUsingBaseTag(baseTags, spec) {
    // tags -> paths.`path`.`operation`.tags
    const { paths } = spec;
    if (!paths) {
        throw new Error('OpenAPI spec must define paths');
    }

    const operationData = [];
    Object.keys(paths).forEach((path) => {
        const operations = paths[path];
        Object.keys(operations).forEach((operation) => {
            const { tags, operationId } = operations[operation];
            if (!isNil(tags) && doTagsMatch(baseTags, tags)) {
                operationData.push({ operationId, requestMethod: operation, path });
            }
        });
    });
    return operationData;
}

export function findAllOperationIds(ResourceApi, spec) {
    const baseTags = convertResourceNameToBaseTags(ResourceApi);
    return findAllOperationIdsUsingBaseTag(baseTags, spec);
}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function convertOperationIdToOperationName(operationId) {
    // e.g operationId = partial_api_public_v1_cheesy_pizza_get
    // associated operation would then be: partialApiPublicV1CheesyPizzaGet

    // e.g operationId = downloadLink
    // associated operation name would be: downloadLink
    return camelCase(operationId);
}
