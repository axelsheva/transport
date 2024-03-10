import { connect } from 'amqplib';
import { ApolloServer } from 'apollo-server';
import { AsyncLocalStorage } from 'async_hooks';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { GraphQLClient, GraphQLServer, RpcConsumer, RpcProducer } from '../../src';
import { BookResolver } from '../utils/bookResolver';
import { MOCK_REQUEST_CONTEXT } from '../utils/data';
import { RequestContextStorage, RequestContextType } from '../utils/requestContext';
import { CONFIG } from '../config';

const INTERNAL_QUEUE = 'sender_queue';
const EXTERNAL_QUEUE = 'processor_queue';

const makeProducer = async (requestContextStorage: AsyncLocalStorage<RequestContextType>) => {
    const connection = await connect(CONFIG.amqp.url);
    const channel = await connection.createConfirmChannel();

    const producer = new RpcProducer(channel, EXTERNAL_QUEUE, INTERNAL_QUEUE);

    await producer.connect();

    const graphQLClient = new GraphQLClient(producer, true, requestContextStorage);

    return { connection, channel, graphQLClient };
};

const makeConsumer = async (requestContextStorage: AsyncLocalStorage<RequestContextType>) => {
    const connection = await connect(CONFIG.amqp.url);
    const channel = await connection.createConfirmChannel();

    const consumer = new RpcConsumer(channel, EXTERNAL_QUEUE);

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

    return { connection, channel, graphQLServer };
};

(async () => {
    const requestContextStorage = new RequestContextStorage();

    const producer = await makeProducer(requestContextStorage);
    const consumer = await makeConsumer(requestContextStorage);

    await requestContextStorage.run(MOCK_REQUEST_CONTEXT, async () => {
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
        } finally {
            await producer.channel.close();
            await producer.connection.close();
            await consumer.channel.close();
            await consumer.connection.close();
        }
    });
})();
