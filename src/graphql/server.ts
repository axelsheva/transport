import { ApolloServer } from 'apollo-server';
import { IConsumer } from '../transport/types';

export class GraphQLServer {
    constructor(
        private readonly consumer: IConsumer,
        private readonly server: ApolloServer,
    ) {
        this.consumer.consume(async (message) => {
            const request = JSON.parse(message);
            const response = await this.server.executeOperation(request);

            // console.log('response', response);

            return JSON.stringify(response);
        });
    }
}
