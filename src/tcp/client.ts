import { randomUUID } from 'crypto';
import * as net from 'net';
import { IProducer } from '../transport';

export class TcpProducer implements IProducer {
    private readonly socket: net.Socket;
    private readonly pendingRequests: { [correlationId: string]: (reply: string) => void };

    constructor(
        private readonly host: string,
        private readonly port: number,
    ) {
        this.socket = new net.Socket();
        this.pendingRequests = {};
    }

    async connect(): Promise<void> {
        this.socket.connect(this.port, this.host, () => {
            console.log('Connected to server!');
        });

        let accumulatedData = Buffer.alloc(0);
        let messageLength: number | null = null;

        this.socket.on('data', (data) => {
            accumulatedData = Buffer.concat([accumulatedData, data]);

            while (true) {
                if (messageLength === null) {
                    if (accumulatedData.length >= 4) {
                        messageLength = accumulatedData.readUInt32BE(0);
                        accumulatedData = accumulatedData.subarray(4);
                    } else {
                        break;
                    }
                }

                if (messageLength !== null && accumulatedData.length >= messageLength) {
                    const message = accumulatedData.subarray(0, messageLength).toString();
                    const json = JSON.parse(message);

                    // console.log('Received message:', json);

                    const resolve = this.pendingRequests[json.id];

                    if (resolve) {
                        resolve(json.message);
                    }

                    accumulatedData = accumulatedData.subarray(messageLength);
                    messageLength = null;
                } else {
                    break;
                }
            }
        });

        this.socket.on('close', () => {
            console.log('Connection closed');
        });
    }

    async produce(message: string, timeout: number = 5000): Promise<string> {
        const requestId = randomUUID();
        message = JSON.stringify({ id: requestId, message });

        const buffer = Buffer.from(message, 'utf-8');
        const header = Buffer.alloc(4);
        header.writeUInt32BE(buffer.length, 0);
        const data = Buffer.concat([header, buffer]);

        return new Promise((resolve) => {
            this.pendingRequests[requestId] = (reply: string) => {
                delete this.pendingRequests[requestId];
                return resolve(reply);
            };

            this.socket.write(data, (err) => {
                if (err) {
                    console.error('Failed to send message:', err);
                } else {
                    // console.log('Message sent:', message);
                }
            });
        });
    }
}
