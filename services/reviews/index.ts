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

// extend user from accounts Service

@Directive("@extends") //Type extensions
@Directive(`@key(fields: "userId")`)
@ObjectType()
export class User {
  @Directive("@external")
  @Field((type) => ID)
  userId: string;

  // @Directive("@external")
  // @Field()
  // username: string;
}

// extend user from product Service
@Directive("@extends")
@Directive(`@key(fields: "productId")`)
@ObjectType()
export class Product {
  @Directive("@external")
  @Field()
  productId: string;
}

/// Review type Reference
@Entity()
@Directive(`@key(fields: "reviewId")`)
@ObjectType()
export class Review extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Field((type) => ID)
  reviewId: string;

  @Column()
  @Field()
  remarks: string;

  @Column()
  @Field()
  userId: string;

  @Column()
  @Field()
  productId: string;

  // @Type(() => User)
  // @Directive(`@provides(fields: "username")`)
  // @Field()
  // author: User;

  // @Type(() => Product)
  // @Directive(`@provides(fields: "productId")`)
  // @Field()
  // product: Product;
}

@InputType()
class ReviewInput {
  @Field()
  remarks: string;

  @Field()
  userId: string;

  @Field()
  productId: string;
}

@Resolver((of) => Review)
export class ReviewsResolver {
  @Query(() => [Review])
  //@FieldResolver((returns) => [Review])
  async getReviews(): Promise<Review[]> {
    return await Review.find();
  }

  @Mutation(() => Review)
  async addReview(@Arg("input") input: ReviewInput) {
    return await Review.create(input).save();
  }
}

// Resolve a field reviews under User in account service
@Resolver((of) => User)
export class UserReviewsResolver {
  @FieldResolver((returns) => [Review])
  async reviews(@Root() user: User): Promise<Review[]> {
    // console.log("LOL", user.id);
    // return reviews.filter((review) => review.author.id === user.id);
    return Review.find({ where: { userId: user.userId } });
    // return;
  }
}

// Resolve a field reviews under User in account service
@Resolver((of) => Product)
export class ProductReviewsResolver {
  @FieldResolver(() => [Review])
  async reviews(@Root() product: Product): Promise<Review[]> {
    //return reviews.filter((review) => review.product.upc === product.upc);
    return Review.find({ where: { productId: product.productId } });
  }
}

export async function resolveReviewReference(
  reference: Pick<Review, "reviewId">
): Promise<Review> {
  // return users.find((u) => u.id === reference.id)!;
  return await Review.findOne({ where: { reviewId: reference.reviewId } });
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
  const schema = await buildFederatedSchema(
    {
      resolvers: [ReviewsResolver, ProductReviewsResolver, UserReviewsResolver],
      orphanedTypes: [User, Review, Product],
    },
    {
      Review: { __resolveReference: resolveReviewReference },
    }
  );

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
