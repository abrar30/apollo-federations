import "reflect-metadata";
import {
  Field,
  ObjectType,
  ID,
  Directive,
  Resolver,
  Query,
  Arg,
  InputType,
  Mutation,
  FieldResolver,
  Root,
} from "type-graphql";
import { buildFederatedSchema } from "../helper/buildFederatedSchema";
import { ApolloServer } from "apollo-server";
import { plainToClass, Type } from "class-transformer";
import {
  Column,
  Entity,
  Index,
  OneToMany,
  BaseEntity,
  PrimaryGeneratedColumn,
  createConnection,
} from "typeorm";

// @Directive("@extends")
// @Directive(`@key(fields: "userId")`)
// @ObjectType()
// export class Review {
//   @Directive("@external")
//   @Field()
//   userId: string;
// }

@Directive("@extends")
@Directive(`@key(fields: "productId")`)
@ObjectType()
export class Product {
  @Directive("@external")
  @Field()
  productId: string;
  @Directive("@external")
  @Field()
  userId: string;
}

@Entity({ name: "user" }) ///Type references
@Directive(`@key(fields: "userId")`) //User type can be connected from other services in the graph through its id field.
@ObjectType()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  userId: string;

  @Field()
  @Column()
  username: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  birthDate: string;

  // @Type(() => [Product])
  // @Directive(`@provides(fields: "userId")`)
  // @Field()
  // product: Product[];
}

@InputType("UserInput")
class UserInput {
  @Field()
  username: string;

  @Field()
  name: string;

  @Field()
  birthDate: string;
}

@Resolver((of) => User)
class AccountsResolver {
  @Query((returns) => [User])
  async user(@Arg("id", { nullable: true }) userId: string) {
    return userId
      ? await User.findOne({ where: { userId } })
      : await User.find();
  }
  @Mutation(() => User)
  async addUser(@Arg("input") input: UserInput) {
    return await User.create(input).save();
  }
}

@Resolver((of) => Product)
export class UserProductsResolver {
  @Directive(`@requires(fields: "userId")`)
  @FieldResolver(() => [User])
  async purchasedBy(@Root() product: Product): Promise<User[]> {
    return User.find({ where: { userId: product.userId } });
  }
}

// @Resolver((of) => Review)
// export class ReviewUserResolver {
//   // @Directive(`@requires(fields: "username userId")`)
//   @FieldResolver((returns) => User)
//   async author(@Root() review: Review): Promise<User> {
//     // console.log("LOL", user.id);
//     // return reviews.filter((review) => review.author.id === user.id);
//     return await User.findOne({ where: { id: review.userId } });
//   }
//}

export async function resolveUserReference(
  reference: Pick<User, "userId">
): Promise<User> {
  // return users.find((u) => u.id === reference.id)!;
  return await User.findOne({ where: { userId: reference.userId } });
}

const main = async () => {
  await createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "root",
    database: "accounts",
    entities: [User],
    logging: true,
    synchronize: true,
  });
  const schema = await buildFederatedSchema(
    {
      resolvers: [AccountsResolver, UserProductsResolver],
      orphanedTypes: [User, Product],
    },
    {
      User: { __resolveReference: resolveUserReference },
    }
  );

  const server = new ApolloServer({
    schema,
    tracing: false,
    playground: true,
  });

  server.listen({ port: 4001 }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
};

main().catch((err) => console.trace(err));

// export const users: User[] = plainToClass(User, [
//   {
//     id: "1",
//     name: "Ada Lovelace",
//     birthDate: "1815-12-10",
//     username: "@ada",
//   },
//   {
//     id: "2",
//     name: "Alan Turing",
//     birthDate: "1912-06-23",
//     username: "@complete",
//   },
// ]);
