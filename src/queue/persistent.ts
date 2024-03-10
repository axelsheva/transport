import { Channel } from 'amqplib';
import { IQueue } from './types';

export class PersistentQueue implements IQueue {
    constructor(private readonly channel: Channel, private readonly queue: string) {}

    async connect(): Promise<void> {
        await this.channel.assertQueue(this.queue, {
            durable: true, // делаем очередь персистентной
        });
    }

    async send(message: string): Promise<any> {
        this.channel.sendToQueue(this.queue, Buffer.from(message), {
            persistent: true, // делаем сообщения персистентными
        });
    }

    async receive(onMessage: (message: string) => Promise<any>): Promise<void> {
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
