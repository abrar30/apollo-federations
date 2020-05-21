import "reflect-metadata";
import {
  ObjectType,
  Directive,
  Field,
  Resolver,
  Query,
  Arg,
  Mutation,
  InputType,
} from "type-graphql";
import { buildFederatedSchema } from "../helper/buildFederatedSchema";
import { ApolloServer } from "apollo-server";
import {
  Entity,
  BaseEntity,
  Column,
  PrimaryGeneratedColumn,
  createConnection,
} from "typeorm";

@InputType("ProductInput")
@Entity()
@Directive(`@key(fields: "upc")`)
@ObjectType()
export default class Product extends BaseEntity {
  @PrimaryGeneratedColumn()
  @Field({ nullable: true })
  upc: string;

  @Column()
  @Field()
  name: string;

  @Column()
  @Field()
  price: number;

  @Column()
  @Field()
  weight: number;
}

@Resolver((of) => Product)
export class ProductsResolver {
  @Query((returns) => [Product])
  async topProducts(
    @Arg("first", { defaultValue: 5 })
    first: number
  ): Promise<Product[]> {
    //  return products.slice(0, first);
    return Product.find({ take: first });
  }

  @Mutation(() => Product)
  async addProduct(@Arg("input") input: Product) {
    return await Product.create(input).save();
  }
}

export async function resolveProductReference(
  reference: Pick<Product, "upc">
): Promise<Product | undefined> {
  // return products.find((p) => p.upc === reference.upc);
  return Product.findOne({ where: { upc: reference.upc } });
}

const main = async () => {
  await createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "root",
    database: "product",
    entities: [Product],
    logging: true,
    synchronize: true,
  });

  const schema = await buildFederatedSchema(
    {
      resolvers: [ProductsResolver],
      orphanedTypes: [Product],
    },
    {
      Product: { __resolveReference: resolveProductReference },
      //   Abrar: { __resolveReference: resolveProductReference },
    }
  );

  const server = new ApolloServer({
    schema,
    tracing: false,
    playground: true,
  });
  server.listen({ port: 4003 }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
};

main().catch((err) => console.trace(err));

// const products = [
//   {
//     upc: "1",
//     name: "Table",
//     price: 899,
//     weight: 100,
//   },
//   {
//     upc: "2",
//     name: "Couch",
//     price: 1299,
//     weight: 1000,
//   },
//   {
//     upc: "3",
//     name: "Chair",
//     price: 54,
//     weight: 50,
//   },
// ];
