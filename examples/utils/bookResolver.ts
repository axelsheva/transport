import { Args, Mutation, Query, Resolver } from 'type-graphql';
import { BOOKS } from './data';
import { Book, CreateBookArgs } from './gql';

@Resolver(Book)
export class BookResolver {
    @Query(() => [Book])
    books(): Array<Book> {
        return BOOKS;
    }

    @Mutation(() => Book)
    book(@Args() book: CreateBookArgs): Book {
        console.log('Add book', book);

        return book;
    }
}
