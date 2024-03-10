import { AsyncLocalStorage } from 'async_hooks';
import { createParamDecorator } from 'type-graphql';

export type RequestContextType = {
    user: {
        id: string;
    };
    traceId: string;
};

export class RequestContextStorage extends AsyncLocalStorage<RequestContextType> {}

export function RequestContext() {
    return createParamDecorator<{ requestContextStorage: RequestContextStorage }>(
        async ({ context }) => {
            return context.requestContextStorage.getStore();
        },
    );
}
