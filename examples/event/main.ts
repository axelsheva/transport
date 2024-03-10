import { connect } from 'amqplib';
import { ApolloServer } from 'apollo-server';
import { AsyncLocalStorage } from 'async_hooks';
import { printSchema } from 'graphql';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { EventConsumer, EventProducer, GraphQLClient, GraphQLServer } from '../../src';
import { BookResolver } from '../utils/bookResolver';
import { MOCK_REQUEST_CONTEXT } from '../utils/data';
import { RequestContext } from '../utils/userContext';

const EXTERNAL_QUEUE = 'persistent_queue';

const makeProducer = async (requestContextStorage: AsyncLocalStorage<RequestContext>) => {
    const connection = await connect('amqp://localhost');
    const channel = await connection.createChannel();

    const producer = new EventProducer(channel, EXTERNAL_QUEUE);

    await producer.connect();

    const graphQLClient = new GraphQLClient(producer, true, requestContextStorage);

    return graphQLClient;
};

const makeConsumer = async () => {
    const connection = await connect('amqp://localhost');
    const channel = await connection.createChannel();

    const consumer = new EventConsumer(channel, EXTERNAL_QUEUE);

    await consumer.connect();

    const schema = await buildSchema({
        resolvers: [BookResolver],
    });

    const sdl = printSchema(schema);
    console.log(sdl);

    const server = new ApolloServer({ schema });

    const graphQLServer = new GraphQLServer(consumer, server);

    return graphQLServer;
};

(async () => {
    const requestContextStorage = new AsyncLocalStorage<RequestContext>();

    const producer = await makeProducer(requestContextStorage);
    await makeConsumer();

    await requestContextStorage.run(MOCK_REQUEST_CONTEXT, async () => {
        await producer.send({
            query: `mutation CreateBook($title: String!, $author: String!) {
                book(title: $title, author: $author) {
                    title
                    author
                }
            }`,
            variables: {
                title: 'The Great Gatsby',
                author: 'F. Scott Fitzgerald',
            },
        });
    });
})();
