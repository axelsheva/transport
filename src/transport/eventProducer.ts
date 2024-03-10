import { Channel } from 'amqplib';
import { IProducer } from './types';

export class EventProducer implements IProducer {
    constructor(
        private readonly channel: Channel,
        private readonly queue: string,
    ) {}

    async connect(): Promise<void> {
        await this.channel.assertQueue(this.queue, {
            durable: true,
        });
    }

    async produce(message: string): Promise<any> {
        this.channel.sendToQueue(this.queue, Buffer.from(message), {
            persistent: true,
        });
    }
}
