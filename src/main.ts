import { connect } from 'amqplib';
import { GraphQLClient } from './graphqlClient';
import { GraphQLServer } from './graphqlServer';
import { MOCK_REQUEST_CONTEXT } from './mock';
import { RequestQueueListener } from './queue/requestListener';
import { RequestQueueSender } from './queue/requestSender';
import { requestContextStorage } from './userContext';

const SENDER_QUEUE = 'sender_queue';
const PROCESSOR_QUEUE = 'processor_queue';

const makeSender = async () => {
    const connection = await connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = new RequestQueueSender(channel, PROCESSOR_QUEUE, SENDER_QUEUE);

    await queue.connect();

    const graphQLClient = new GraphQLClient(queue);

    return graphQLClient;
};

const makeProcessor = async () => {
    const connection = await connect('amqp://localhost');
    const channel = await connection.createChannel();

    const queue = new RequestQueueListener(channel, PROCESSOR_QUEUE);

    await queue.connect();

    const graphQLServer = new GraphQLServer(queue);

    return graphQLServer;
};

(async () => {
    const client = await makeSender();
    const server = await makeProcessor();

    await requestContextStorage.run(MOCK_REQUEST_CONTEXT, async () => {
        const res = await client.send({
            query: `{
                    books {
                        title
                        author
                    }
                }`,
        });

        console.log('response', res);
    });

    // await channel.close();
    // await connection.close();
})();
