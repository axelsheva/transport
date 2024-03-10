import { AsyncLocalStorage } from 'async_hooks';

export type RequestContext = {
    user: {
        id: string;
    };
    traceId: string;
};

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();
