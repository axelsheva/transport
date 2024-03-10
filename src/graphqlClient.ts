import { GraphQLRequest } from 'apollo-server-types';
import { IQueue } from './queue/types';
import { requestContextStorage } from './userContext';
import { minimizeSpaces } from './utils';

export class GraphQLClient {
    constructor(private readonly transport: IQueue) {}

    async send(request: GraphQLRequest) {
        if (!request.query) {
            throw new Error('Query is missing');
        }

        const requestContext = requestContextStorage.getStore();
        if (requestContext) {
            request.extensions = Object.assign(request.extensions || {}, requestContext);
        }

        request.query = minimizeSpaces(request.query);

        const res = await this.transport.send(JSON.stringify(request));
        if (!res) {
            return res;
        }

        // TODO: check for error

        return JSON.parse(res).data;
    }
}
