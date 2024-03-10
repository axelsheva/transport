import { Channel } from 'amqplib';
import { IConsumer } from './types';

export class EventConsumer implements IConsumer {
    constructor(
        private readonly channel: Channel,
        private readonly queue: string,
    ) {}

    async connect(): Promise<void> {
        await this.channel.assertQueue(this.queue, {
            durable: true,
        });
    }

    async consume(onMessage: (message: string) => Promise<any>): Promise<void> {
        await this.channel.consume(
            this.queue,
            async (msg) => {
                if (!msg) {
                    return;
                }

                try {
                    await onMessage(msg.content.toString());
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
