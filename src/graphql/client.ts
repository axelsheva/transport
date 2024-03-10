import { GraphQLRequest, GraphQLResponse } from 'apollo-server-types';
import { AsyncLocalStorage } from 'async_hooks';
import { IProducer } from '../transport/types';
import { minimizeSpaces } from '../utils';

export class GraphQLClient {
    constructor(
        private readonly producer: IProducer,
        private readonly minimizeSpaces: boolean = true,
        private readonly requestContextStorage?: AsyncLocalStorage<Record<string, any>>,
    ) {}

    async send(request: GraphQLRequest) {
        if (!request.query) {
            throw new Error('Query is missing');
        }
        if (this.requestContextStorage) {
            const requestContext = this.requestContextStorage.getStore();
            if (requestContext) {
                request.extensions = Object.assign(request.extensions || {}, requestContext);
            }
        }
        if (this.minimizeSpaces) {
            request.query = minimizeSpaces(request.query);
        }

        const res = await this.producer.produce(JSON.stringify(request));
        if (!res) {
            return res;
        }

        const schema: GraphQLResponse = JSON.parse(res);

        return schema.data;
    }
}
