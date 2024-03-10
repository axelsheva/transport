import { randomUUID } from 'crypto';
import { RequestContextType } from './requestContext';

export const BOOKS = [
    { title: 'Harry Potter and the Chamber of Secrets', author: 'J.K. Rowling' },
    { title: 'Jurassic Park', author: 'Michael Crichton' },
];

export const MOCK_REQUEST_CONTEXT: RequestContextType = {
    user: {
        id: '1',
    },
    traceId: randomUUID(),
};
