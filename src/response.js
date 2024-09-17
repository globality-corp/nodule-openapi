/* Response handling.
 */
import { get } from 'lodash-es';

/* Build JSON from response data.
 */
export default (context) => get(
    context,
    'options.buildResponse',
    (response) => get(response, 'data'),
);
