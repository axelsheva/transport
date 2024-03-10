import { connect } from 'amqplib';
import { ApolloServer } from 'apollo-server';
import { AsyncLocalStorage } from 'async_hooks';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { GraphQLClient, GraphQLServer, RpcConsumer, RpcProducer } from '../../src';
import { BookResolver } from '../utils/bookResolver';
import { MOCK_REQUEST_CONTEXT } from '../utils/data';
import { RequestContext } from '../utils/userContext';

const INTERNAL_QUEUE = 'sender_queue';
const EXTERNAL_QUEUE = 'processor_queue';

const makeProducer = async (requestContextStorage: AsyncLocalStorage<RequestContext>) => {
    const connection = await connect('amqp://localhost');
    const channel = await connection.createChannel();

    const producer = new RpcProducer(channel, EXTERNAL_QUEUE, INTERNAL_QUEUE);

    await producer.connect();

    const graphQLClient = new GraphQLClient(producer, true, requestContextStorage);

    return graphQLClient;
};

const makeConsumer = async () => {
    const connection = await connect('amqp://localhost');
    const channel = await connection.createChannel();

    const consumer = new RpcConsumer(channel, EXTERNAL_QUEUE);

    await consumer.connect();

    const schema = await buildSchema({
        resolvers: [BookResolver],
    });

    const server = new ApolloServer({ schema });

    const graphQLServer = new GraphQLServer(consumer, server);

    return graphQLServer;
};

(async () => {
    const requestContextStorage = new AsyncLocalStorage<RequestContext>();

    const producer = await makeProducer(requestContextStorage);
    await makeConsumer();

    await requestContextStorage.run(MOCK_REQUEST_CONTEXT, async () => {
        const res = await producer.send({
            query: `{
                    books {
                        title
                        author
                    }
                }`,
        });

        console.log('response', res);
    });
})();
