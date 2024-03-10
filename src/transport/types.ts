export interface IProducer {
    connect(): Promise<void>;
    produce(message: string, timeout: number): Promise<string | void>;
}

export interface IConsumer {
    connect(): Promise<void>;
    consume(onMessage: (message: string) => Promise<any>): Promise<void>;
}
