import * as net from 'net';
import { IConsumer } from '../transport';

export class TcpConsumer implements IConsumer {
    private readonly server: net.Server;

    constructor(private readonly port: number) {
        this.port = port;
        this.server = new net.Server();
    }
    async connect(): Promise<void> {
        this.server.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}`);
        });
    }

    async consume(onMessage: (message: string) => Promise<any>): Promise<void> {
        this.server.on('connection', (socket) => {
            console.log('Client connected');

            let accumulatedData = Buffer.alloc(0);
            let messageLength: number | null = null;

            socket.on('data', async (data) => {
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
                        // console.log('Received message:', message);

                        const res = await onMessage(json.message);

                        this.sendMessage(socket, JSON.stringify({ id: json.id, message: res }));

                        accumulatedData = accumulatedData.subarray(messageLength);
                        messageLength = null;
                    } else {
                        break;
                    }
                }
            });

            socket.on('close', () => {
                console.log('Connection closed');
            });

            socket.on('error', (err) => {
                console.error('An error occurred:', err.message);
            });
        });
    }

    private sendMessage(socket: net.Socket, message: string): void {
        const buffer = Buffer.from(message, 'utf-8');
        const header = Buffer.alloc(4);
        header.writeUInt32BE(buffer.length, 0);
        const data = Buffer.concat([header, buffer]);

        socket.write(data, (err) => {
            if (err) {
                console.error('Failed to send message:', err);
            } else {
                // console.log('Message sent back to client', message);
            }
        });
    }
}
