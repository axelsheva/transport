export interface IProducer {
    connect(): Promise<void>;
    produce(message: string): Promise<any>;
}

export interface IConsumer {
    connect(): Promise<void>;
    consume(onMessage: (message: string) => Promise<any>): Promise<void>;
}
