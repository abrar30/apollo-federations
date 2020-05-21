import "reflect-metadata";
import { Type, plainToClass } from "class-transformer";
import {
  Directive,
  ObjectType,
  Field,
  ID,
  Resolver,
  FieldResolver,
  Root,
  InputType,
  Mutation,
  Arg,
  Query,
} from "type-graphql";
import { buildFederatedSchema } from "../helper/buildFederatedSchema";
import { ApolloServer } from "apollo-server";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  createConnection,
} from "typeorm";

@Directive("@extends") //Type extensions
@Directive(`@key(fields: "id")`)
@ObjectType()
export class User {
  @Directive("@external")
  @Field((type) => ID, { nullable: true })
  id: string;

  @Directive("@external")
  @Field()
  username: string;
}

@Directive("@extends")
@Directive(`@key(fields: "upc")`)
@ObjectType()
export class Product {
  @Directive("@external")
  @Field({ nullable: true })
  upc: string;
}

//@InputType("ReviewInput")
@Entity()
@Directive(`@key(fields: "id")`)
@ObjectType()
export class Review extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Field((type) => ID, { nullable: true })
  id: string;

  @Column()
  @Field()
  body: string;

  @Column()
  @Field()
  userId: string;

  @Column()
  @Field()
  productId: string;

  @Type(() => User)
  @Directive(`@provides(fields: "username")`)
  @Field()
  author: User;

  @Type(() => Product)
  @Field()
  product: Product;
}

@InputType()
class ReviewInput {
  @Field()
  body: string;

  @Field()
  userId: string;

  @Field()
  productId: string;
}

@Resolver((of) => Review)
export class ReviewsResolver {
  //@Directive(`@requires(fields: "username")`)
  // @FieldResolver((returns) => [User])
  // async author(@Root() review: Review): Promise<User[]> {
  //   return await  User
  // }

  @Query(() => [Review])
  //@FieldResolver((returns) => [Review])
  async reviews(): Promise<Review[]> {
    return await Review.find();
  }

  @Mutation(() => Review)
  async addReview(@Arg("input") input: ReviewInput) {
    return await Review.create(input).save();
  }
}

@Resolver((of) => User)
export class UserReviewsResolver {
  @FieldResolver((returns) => [Review])
  async reviews(@Root() user: User): Promise<Review[]> {
    // console.log("LOL", user.id);
    // return reviews.filter((review) => review.author.id === user.id);
    return Review.find({ where: { userId: user.id } });
  }
}

@Resolver((of) => Product)
export class ProductReviewsResolver {
  @FieldResolver(() => [Review])
  async reviews(@Root() product: Product): Promise<Review[]> {
    //return reviews.filter((review) => review.product.upc === product.upc);
    return Review.find({ where: { productId: product.upc } });
  }
}

const main = async () => {
  await createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "root",
    database: "reviews",
    entities: [Review],
    logging: true,
    synchronize: true,
  });
  const schema = await buildFederatedSchema({
    resolvers: [ReviewsResolver, ProductReviewsResolver, UserReviewsResolver],
    orphanedTypes: [User, Review, Product],
  });

  const server = new ApolloServer({
    schema,
    tracing: false,
    playground: true,
  });

  server.listen({ port: 4002 }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
};
main().catch((err) => console.trace(err));
// export const reviews: Review[] = plainToClass(Review, [
//   {
//     id: "1",
//     author: { id: "1", username: "@ada" },
//     product: { upc: "1" },
//     body: "Love it!",
//   },
//   {
//     id: "2",
//     author: { id: "1", username: "@ada" },
//     product: { upc: "2" },
//     body: "Too expensive.",
//   },
//   {
//     id: "3",
//     author: { id: "2", username: "@complete" },
//     product: { upc: "3" },
//     body: "Could be better.",
//   },
//   {
//     id: "4",
//     author: { id: "2", username: "@complete" },
//     product: { upc: "1" },
//     body: "Prefer something else.",
//   },
// ]);
