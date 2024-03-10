import { ApolloServer } from 'apollo-server';
import { AsyncLocalStorage } from 'async_hooks';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { GraphQLClient, GraphQLServer } from '../../src';
import { TcpProducer } from '../../src/tcp/client';
import { TcpConsumer } from '../../src/tcp/server';
import { BookResolver } from '../utils/bookResolver';
import { MOCK_REQUEST_CONTEXT } from '../utils/data';
import { delay } from '../utils/delay';
import { RequestContextStorage, RequestContextType } from '../utils/requestContext';

const makeProducer = async (requestContextStorage: AsyncLocalStorage<RequestContextType>) => {
    const producer = new TcpProducer('localhost', 3000);

    await producer.connect();

    const graphQLClient = new GraphQLClient(producer, true, requestContextStorage);

    return { graphQLClient };
};

const makeConsumer = async (requestContextStorage: AsyncLocalStorage<RequestContextType>) => {
    const consumer = new TcpConsumer(3000);

    await consumer.connect();

    const schema = await buildSchema({
        resolvers: [BookResolver],
    });

    const server = new ApolloServer({
        schema,
        context: () => {
            return { requestContextStorage };
        },
    });

    const graphQLServer = new GraphQLServer(
        consumer,
        server,
        { name: 'Book', version: '0.0.1' },
        requestContextStorage,
    );

    return { graphQLServer };
};

(async () => {
    const requestContextStorage = new RequestContextStorage();

    const consumer = await makeConsumer(requestContextStorage);
    const producer = await makeProducer(requestContextStorage);

    await requestContextStorage.run(MOCK_REQUEST_CONTEXT, async () => {
        while (1) {
            try {
                const res = await producer.graphQLClient.send({
                    query: `{
                    books {
                        title
                        author
                    }
                }`,
                });

                console.log('response', res);
            } catch (error) {
                console.error('Something went wrong!', error);
            }

            await delay(1000);
        }
    });
})();
