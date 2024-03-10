import { Channel } from 'amqplib';
import { randomUUID } from 'crypto';
import { IQueue } from './types';

export class RequestQueueSender implements IQueue {
    private readonly pendingRequests: { [correlationId: string]: (reply: string) => void };

    constructor(
        private readonly channel: Channel,
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
            // Удаление использованной функции resolve из хранилища
            delete this.pendingRequests[correlationId];
        }
    }

    private listenForReplies(): void {
        this.channel.consume(
            this.replyQueue,
            (msg) => {
                if (!msg) {
                    return;
                }

                // Обработка полученного сообщения
                const correlationId = msg.properties.correlationId;
                const replyContent = msg.content.toString();
                this.handleReply(correlationId, replyContent);

                // Подтверждение обработки сообщения
                this.channel.ack(msg);
            },
            { noAck: false },
        );
    }

    async send(message: string): Promise<any> {
        const correlationId = randomUUID();

        return new Promise<any>((resolve, reject) => {
            this.pendingRequests[correlationId] = resolve;

            this.channel.sendToQueue(this.sendQueue, Buffer.from(message), {
                correlationId: correlationId,
                replyTo: this.replyQueue,
            });
        });
    }

    receive(onMessage: (message: string) => Promise<any>): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
