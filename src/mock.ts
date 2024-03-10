import { randomUUID } from 'crypto';
import { RequestContext } from './userContext';

export const MOCK_REQUEST_CONTEXT: RequestContext = {
    user: {
        id: '1',
    },
    traceId: randomUUID(),
};
