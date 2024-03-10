import { ApolloServer, gql } from 'apollo-server';
import { IQueue } from './queue/types';

// Определение схемы GraphQL
const typeDefs = gql`
    type Book {
        title: String
        author: String
    }

    type Query {
        books: [Book]
    }
`;

// Mock данные
const books = [
    { title: 'Harry Potter and the Chamber of Secrets', author: 'J.K. Rowling' },
    { title: 'Jurassic Park', author: 'Michael Crichton' },
];

// Ресолверы для обработки запросов
const resolvers = {
    Query: {
        books: () => books,
    },
};

export class GraphQLServer {
    private readonly server: ApolloServer;

    constructor(private readonly transport: IQueue) {
        this.server = new ApolloServer({ typeDefs, resolvers });

        this.transport.receive(async (message) => {
            const request = JSON.parse(message);
            const response = await this.server.executeOperation(request);

            // console.log('request', JSON.stringify(request, null, 2));
            // console.log('response', JSON.stringify(response.data, null, 2));

            return JSON.stringify(response);
        });
    }
}
