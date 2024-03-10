import { ApolloServer } from 'apollo-server';
import { GraphQLRequest } from 'apollo-server-types';
import { AsyncLocalStorage } from 'async_hooks';
import { IConsumer } from '../transport/types';
import { ServiceInfo } from '../types';

export class GraphQLServer {
    constructor(
        private readonly consumer: IConsumer,
        private readonly server: ApolloServer,
        private readonly serviceInfo: ServiceInfo,
        private readonly requestContextStorage?: AsyncLocalStorage<Record<string, any>>,
    ) {
        this.consumer.consume(this.handleMessage);
    }

    private async execute(request: GraphQLRequest) {
        const startAt = performance.now();

        const response = await this.server.executeOperation(request);

        response.extensions = request.extensions || {};

        const endAt = performance.now();
        const executionTime = Math.round(endAt - startAt);

        Object.assign(response.extensions, {
            service: this.serviceInfo,
            execution: { duration: executionTime },
        });

        return JSON.stringify(response);
    }

    private handleMessage = async (message: string): Promise<string> => {
        const request: GraphQLRequest = JSON.parse(message);

        if (this.requestContextStorage) {
            return this.requestContextStorage.run(request.extensions, () => this.execute(request));
        }

        return this.execute(request);
    };
}
