import { Args, Mutation, Query, Resolver } from 'type-graphql';
import { BOOKS } from './data';
import { Book, CreateBookArgs } from './gql';
import { RequestContext, RequestContextType } from './requestContext';

@Resolver(Book)
export class BookResolver {
    @Query(() => [Book])
    books(@RequestContext() context: RequestContextType): Array<Book> {
        console.log(`[BookResolver][books] user: ${context.user.id}`);

        return BOOKS;
    }

    @Mutation(() => Book)
    book(@Args() book: CreateBookArgs): Book {
        console.log('Add book', book);

        return book;
    }
}
