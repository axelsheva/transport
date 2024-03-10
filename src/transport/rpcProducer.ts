import { ConfirmChannel } from 'amqplib';
import { randomUUID } from 'crypto';
import { TransportError, TransportProduceRequestTimeoutError } from '../errors';
import { IProducer } from './types';

export class RpcProducer implements IProducer {
    private readonly pendingRequests: { [correlationId: string]: (reply: string) => void };

    constructor(
        private readonly channel: ConfirmChannel,
        private readonly sendQueue: string,
        private readonly replyQueue: string,
    ) {
        this.pendingRequests = {};
    }

    async connect(): Promise<void> {
        await this.channel.assertQueue(this.sendQueue, { durable: false });
        await this.channel.assertQueue(this.replyQueue, { durable: false });

        this.listenForReplies();
    }

    private handleReply(correlationId: string, replyContent: string): void {
        const resolve = this.pendingRequests[correlationId];
        if (resolve) {
            resolve(replyContent);
            delete this.pendingRequests[correlationId];
        } else {
            throw new TransportError(`Pending request ${correlationId} not found`);
        }
    }

    private listenForReplies(): void {
        this.channel.consume(
            this.replyQueue,
            (msg) => {
                if (!msg) {
                    return;
                }

                const correlationId = msg.properties.correlationId;
                const replyContent = msg.content.toString();
                this.handleReply(correlationId, replyContent);

                this.channel.ack(msg);
            },
            { noAck: false },
        );
    }

    async produce(message: string, timeout: number = 5000): Promise<string> {
        const correlationId = randomUUID();

        return new Promise<string>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                delete this.pendingRequests[correlationId];
                reject(new TransportProduceRequestTimeoutError('RPC request timed out'));
            }, timeout);

            this.pendingRequests[correlationId] = (reply) => {
                clearTimeout(timeoutId);
                resolve(reply);
            };

            this.channel.sendToQueue(
                this.sendQueue,
                Buffer.from(message),
                {
                    correlationId: correlationId,
                    replyTo: this.replyQueue,
                },
                (err, ok) => {
                    if (err !== null) {
                        clearTimeout(timeoutId);
                        delete this.pendingRequests[correlationId];
                        reject(err);
                    }
                },
            );
        });
    }
}
