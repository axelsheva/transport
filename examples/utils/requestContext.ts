import { AsyncLocalStorage } from 'async_hooks';
import { createParamDecorator } from 'type-graphql';

export type User = {
    id: string;
};

export type RequestContextType = {
    user?: User;
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

export function UserContext() {
    return createParamDecorator<{ requestContextStorage: RequestContextStorage }>(
        async ({ context }) => {
            const store = context.requestContextStorage.getStore();
            if (!store || !store.user) {
                return undefined;
            }

            return store.user;
        },
    );
}
