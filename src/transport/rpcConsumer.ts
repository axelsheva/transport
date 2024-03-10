import { Channel } from 'amqplib';
import { IConsumer } from './types';

export class RpcConsumer implements IConsumer {
    constructor(
        private readonly channel: Channel,
        private readonly listenQueue: string,
    ) {}

    async connect(): Promise<void> {}

    async consume(onMessage: (message: string) => Promise<any>): Promise<void> {
        await this.channel.consume(
            this.listenQueue,
            async (msg) => {
                if (!msg) {
                    return;
                }

                try {
                    const res = await onMessage(msg.content.toString());

                    this.channel.sendToQueue(msg.properties.replyTo, Buffer.from(res), {
                        correlationId: msg.properties.correlationId,
                    });
                } catch (error) {
                    console.error('Error handling message:', error);
                } finally {
                    this.channel.ack(msg);
                }
            },
            {
                noAck: false,
            },
        );
    }
}
