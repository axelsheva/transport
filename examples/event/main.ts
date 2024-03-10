import { connect } from 'amqplib';
import { ApolloServer } from 'apollo-server';
import { AsyncLocalStorage } from 'async_hooks';
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { EventConsumer, EventProducer, GraphQLClient, GraphQLServer } from '../../src';
import { BookResolver } from '../utils/bookResolver';
import { MOCK_REQUEST_CONTEXT } from '../utils/data';
import { RequestContextStorage, RequestContextType } from '../utils/requestContext';

const EXTERNAL_QUEUE = 'persistent_queue';

const makeProducer = async (requestContextStorage: RequestContextStorage) => {
    const connection = await connect('amqp://localhost');
    const channel = await connection.createConfirmChannel();

    const producer = new EventProducer(channel, EXTERNAL_QUEUE);

    await producer.connect();

    const graphQLClient = new GraphQLClient(producer, true, requestContextStorage);

    return { connection, channel, graphQLClient };
};

const makeConsumer = async (requestContextStorage: RequestContextStorage) => {
    const connection = await connect('amqp://localhost');
    const channel = await connection.createConfirmChannel();

    const consumer = new EventConsumer(channel, EXTERNAL_QUEUE);

    await consumer.connect();

    const schema = await buildSchema({
        resolvers: [BookResolver],
    });

    // const sdl = printSchema(schema);
    // console.log(sdl);

    const server = new ApolloServer({
        schema,
        context: () => {
            return { requestContextStorage };
        },
    });

    const graphQLServer = new GraphQLServer(consumer, server, { name: 'Book', version: '0.0.1' });

    return { connection, channel, graphQLServer };
};

(async () => {
    const requestContextStorage = new AsyncLocalStorage<RequestContextType>();

    const producer = await makeProducer(requestContextStorage);
    const consumer = await makeConsumer(requestContextStorage);

    await requestContextStorage.run(MOCK_REQUEST_CONTEXT, async () => {
        await producer.graphQLClient.send({
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

        await producer.channel.close();
        await producer.connection.close();
        await consumer.channel.close();
        await consumer.connection.close();
    });
})();
