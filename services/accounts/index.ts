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
import { plainToClass } from "class-transformer";
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

@InputType("UserInput")
@Entity({ name: "user" }) ///Type references
@Directive(`@key(fields: "id")`) //User type can be connected from other services in the graph through its id field.
@ObjectType()
export class User extends BaseEntity {
  @Field(() => ID, { nullable: true })
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  username: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  birthDate: string;
}

@Resolver((of) => User)
class AccountsResolver {
  @Query((returns) => [User])
  async user(@Arg("id", { nullable: true }) id: string) {
    return id ? await User.findOne({ where: { id } }) : await User.find();
  }
  @Mutation(() => User)
  async addUser(@Arg("input") input: User) {
    return await User.create(input).save();
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
  reference: Pick<User, "id">
): Promise<User> {
  // return users.find((u) => u.id === reference.id)!;
  return User.findOne({ where: { id: reference.id } });
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
      resolvers: [AccountsResolver],
      orphanedTypes: [User],
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