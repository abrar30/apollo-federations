# apollo-federations

### Installation

To run this demo locally, pull down the repository then run the following commands:

`yarn`
This will install all of the dependencies for the gateway and each underlying service.

`yarn start-services`
This command will run all of the microservices at once. They can be found at http://localhost:4001, http://localhost:4002, http://localhost:4003, and http://localhost:4004.

In another terminal window, run the gateway by running this command:

`yarn start-gateway`
This will start up the gateway and serve it at http://localhost:4000

Run below mutation and queries at http://localhost:4000

### Mutation

- Add user \*

```
mutation {
  addUser(input: {
    name: "Abrar Hussain",
    username: "@abrar",
    birthDate: "05-12-1991"
  }){
    userId
    name
  }
}
```

- Add product \*

```
mutation {
  addProduct(input: {
     name: "Chair",
    price: 54,
    weight: 50,
    userId: "1"  #specify accoriding to your user
  }) {
    productId
    name
  }
}
```

- add Inventory \*

```
mutation {
  addInventory(input: {
    productId: "1",
    inStock: false
  }) {
    productId
    inStock
  }
}
```

- Add Review

```
mutation {
  addReview(input: {
    remarks : "Prefer something else.",
    productId: "1",
    userId: "1"

  }) {
    reviewId
    userId
  }
}
```

### Query

```
query {
  topProducts {
    name
    price
    shippingEstimate
    inStock
    reviews {
      remarks
      author {
        name
        username
        birthDate
        reviews {
         userId
          product {
            name
            price
            weight
            shippingEstimate
            inStock
          }
       }
      }
    }
  }
}

```
