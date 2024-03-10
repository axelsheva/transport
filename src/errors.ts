import { GraphQLResponse } from 'apollo-server-types';
import { GraphQLFormattedError } from 'graphql';

export class GraphQLError extends Error implements GraphQLResponse {
    errors?: ReadonlyArray<GraphQLFormattedError>;
    extensions?: Record<string, any>;

    constructor(graphQLResponse: GraphQLResponse) {
        super(graphQLResponse.errors.at(0).message);

        this.errors = graphQLResponse.errors;
        this.extensions = graphQLResponse.extensions;
    }
}

export class TransportError extends Error {}

export class TransportProduceRequestTimeoutError extends TransportError {}
