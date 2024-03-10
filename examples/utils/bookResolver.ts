import { Args, Mutation, Query, Resolver } from 'type-graphql';
import { BOOKS } from './data';
import { Book, CreateBookArgs } from './gql';
import { User, UserContext } from './requestContext';

@Resolver(Book)
export class BookResolver {
    @Query(() => [Book])
    books(@UserContext() user?: User): Array<Book> {
        if (user) {
            console.log(`[BookResolver][books] user: ${user.id}`);
        } else {
            console.log(`[BookResolver][books] user is missing`);
        }

        return BOOKS;
    }

    @Mutation(() => Book)
    book(@Args() book: CreateBookArgs): Book {
        console.log('Add book', book);

        return book;
    }
}
