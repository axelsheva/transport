import { ConfirmChannel } from 'amqplib';
import { TransportProduceRequestTimeoutError } from '../errors';
import { IProducer } from './types';

export class EventProducer implements IProducer {
    constructor(
        private readonly channel: ConfirmChannel,
        private readonly queue: string,
    ) {}

    async connect(): Promise<void> {
        await this.channel.assertQueue(this.queue, {
            durable: true,
        });
    }

    async produce(message: string, timeout: number = 5000): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new TransportProduceRequestTimeoutError('RPC request timed out'));
            }, timeout);

            this.channel.sendToQueue(
                this.queue,
                Buffer.from(message),
                {
                    persistent: true,
                },
                (err, ok) => {
                    clearTimeout(timeoutId);
                    if (err !== null) {
                        reject(err);
                    } else {
                        resolve();
                    }
                },
            );
        });
    }
}
