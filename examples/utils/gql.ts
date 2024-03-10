import { IsString } from 'class-validator';
import { ArgsType, Field, ObjectType } from 'type-graphql';

@ObjectType()
export class Book {
    @Field()
    title: string;

    @Field()
    author: string;
}

@ArgsType()
export class CreateBookArgs {
    @IsString()
    @Field()
    title: string;

    @IsString()
    @Field()
    author: string;
}
