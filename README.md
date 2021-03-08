[![npm](https://img.shields.io/npm/v/monjoi.svg)](http://npm.im/monjoi)

# 🐦 Monjoi

> Monjoi - A lightweight alternative to [Mongoose](https://mongoosejs.com/).

## Features

- Natively written in [TypeScript](https://www.typescriptlang.org/)
- Schema's with [Joi](https://joi.dev)
- Pre and Post Hooks (a.k.a Plugins)
- Pagination _// TODO_
- Partial Schema Validation for Updates _// TODO_
- Automatic Timestamp insertion / updating _// TODO_

## Install

```sh
npm i monjoi

# or with Yarn

yarn add monjoi
```

\* Monjoi has peer dependencies on [Joi](https://joi.dev) and [node mongodb driver](https://www.npmjs.com/package/mongodb).

## Examples

### Creating a collection.

1. First declare the **Schema** and **Type**, then export the **Data Access Object** _(DAO)_ and **Type**.

```ts
// person.model.ts
import Joi from 'joi'
import { collection } from 'monjoi'

export type Person = {
  name: string
  age?: number
}

const PersonSchema = Joi.object<Person>({
  name: Joi.string().required(),
  age: Joi.number()
})

// Person - Data Access Object
export const PersonDAO = collection('person', PersonSchema)
```

2. Connect DAO's to the DB

```ts
// TODO: Example needed
```

3. Dependency Inject your new DAO into any service to get access to the collection.

```ts
// person.service.ts
import { Person, PersonDAO } from './person.model.ts'

class PersonService {
  constructor(
    // Dependency Injected `personDAO`
    private personDAO: PersonDAO
  ) {}

  public async createPerson(person: Person): Promise<Person> {
    // Automatically validates `person` against Joi schema
    // and returns the newly inserted mongo document with _id
    return this.personDAO.insertOne(person)
  }
}
```

### Hooks (Plugins)

There are 2 types of hooks available:

1. Pre Hooks - Functions that execute **before** running the db access
2. Post Hooks - Functions that execute **after** running the db access

Hooks can return regular values or even Promises.

#### Pre hooks

Useful for triggering other operations before accessing the db. If a hook returns a rejected promise, then the main db operation will not execute, neither will the Post hooks.

#### Post hooks

Useful for formatting db responses or triggering other operations. Post hooks should generally **return** objects because they will be passed to the next hook.

Any hook that **returns a rejected promise** will cancel the hook chain.

#### Hook Examples

Hooks are declared when defining your DAO. You can hook into any standard mongodb collection [operation](http://mongodb.github.io/node-mongodb-native/3.6/api/Collection.html).

```ts
export const PersonDAO = collection('person', PersonSchema, {
  insertOne: {
    pre: [
      () => console.log('I will run before any insertOne operation for person collection'),
      () => console.log('me too!')
    ],
    post: [
      (insertedDoc) => {
        console.log(`Document ${insertedDoc._id} created!`)
        return insertedDoc // <-- Don't forget to return objects from post hooks
      },
      (insertedDoc) => {
        // formatting example, removing mongo __v field
        return omit(insertedDoc, ['__v'])
      }
    ]
  }
})
```
