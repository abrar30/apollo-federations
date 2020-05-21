import "reflect-metadata";
import {
  ObjectType,
  Directive,
  Field,
  Resolver,
  FieldResolver,
  Root,
  InputType,
  Mutation,
  Arg,
} from "type-graphql";
import { buildFederatedSchema } from "../helper/buildFederatedSchema";
import { plainToClass, Type } from "class-transformer";
import { ApolloServer } from "apollo-server";
import {
  createConnection,
  Entity,
  Column,
  BaseEntity,
  PrimaryColumn,
} from "typeorm";

@Entity({ name: "inventory" })
@ObjectType()
@Directive("@extends")
@Directive(`@key(fields: "productId")`)
export class Product extends BaseEntity {
  @PrimaryColumn()
  @Field()
  @Directive("@external")
  productId: string;

  @Field()
  @Directive("@external")
  weight: number;

  @Field()
  @Directive("@external")
  price: number;

  @Column()
  @Field()
  inStock: boolean;
}

// @Directive("@extends")
// @Directive(`@key(fields: "upc")`)
// @ObjectType()
// export class Product {
//   @Directive("@external")
//   @Field()
//   upc: string;

//   @Field()
//   @Directive("@external")
//   weight: number;

//   @Field()
//   @Directive("@external")
//   price: number;
// }

// //@InputType()
// @Entity()
// @Directive(`@key(fields: "upc")`)
// @ObjectType()
// export class Inventory {
//   @Field()
//   @Directive("@external")
//   upc: string;

//   @Field()
//   inStock: string;

//   @Type(() => Product)
//   @Directive(`@provides(fields: "weight")`)
//   @Field()
//   product: Product;
// }
@InputType()
class InventoryInput {
  @Field()
  inStock: boolean;
  @Field()
  productId: string;
}

@Resolver((of) => Product)
export default class ProductResolver {
  @Directive(`@requires(fields: "price weight")`)
  @FieldResolver((returns) => Number)
  async shippingEstimate(@Root() product: Product): Promise<number> {
    // free for expensive items
    if (product.price > 1000) {
      return 0;
    }
    // estimate is based on weight
    return product.weight * 0.5;
  }
  @Mutation(() => Product)
  async addInventory(@Arg("input") input: InventoryInput) {
    return await Product.create(input).save();
  }
}

export async function resolveProductReference(
  reference: Pick<Product, "productId">
): Promise<Product | undefined> {
  //const found = Product.find((i) => i.upc === reference.upc);
  const found = await Product.findOne({
    where: { productId: reference.productId },
  });
  // return found;
  if (!found) {
    return;
  }
  return plainToClass(Product, {
    ...reference,
    ...found,
  });
}

const main = async () => {
  await createConnection({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "root",
    database: "inventory",
    entities: [Product],
    logging: true,
    synchronize: true,
  });
  const schema = await buildFederatedSchema(
    {
      resolvers: [ProductResolver],
      orphanedTypes: [Product],
    },
    {
      Product: { __resolveReference: resolveProductReference },
    }
  );

  const server = new ApolloServer({
    schema,
    tracing: false,
    playground: true,
  });

  server.listen({ port: 4004 }).then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
  });
};
main().catch((err) => console.trace(err));
// const inventory = [
//   { upc: "1", inStock: true },
//   { upc: "2", inStock: false },
//   { upc: "3", inStock: true },
// ];
