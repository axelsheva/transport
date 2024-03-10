export interface IQueue {
    connect(): Promise<void>;
    send(message: string): Promise<any>;
    receive(onMessage: (message: string) => Promise<any>): Promise<void>;
}
