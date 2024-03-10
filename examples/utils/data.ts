import { randomUUID } from 'crypto';
import { RequestContext } from './userContext';

export const BOOKS = [
    { title: 'Harry Potter and the Chamber of Secrets', author: 'J.K. Rowling' },
    { title: 'Jurassic Park', author: 'Michael Crichton' },
];

export const MOCK_REQUEST_CONTEXT: RequestContext = {
    user: {
        id: '1',
    },
    traceId: randomUUID(),
};
