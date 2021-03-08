import {
  CollectionInsertOneOptions,
  OptionalId,
  WithId,
  Db,
  Collection,
  FilterQuery,
  UpdateQuery,
  FindOneAndUpdateOption
} from 'mongodb'
import Joi from 'joi'

type NonEmptyArray<T> = [T, ...T[]]
type Hook = (arg?: any) => Promise<any> | any
type HookMap = {
  pre?: NonEmptyArray<Hook>
  post?: NonEmptyArray<Hook>
}
type Hooks = {
  [key in keyof Collection]?: HookMap
}

type MonjoiCollection<T> = {
  insertOne: (doc: OptionalId<T>, options?: CollectionInsertOneOptions) => Promise<WithId<T>>
  findOneAndUpdate: (
    filter: FilterQuery<T>,
    update: T | UpdateQuery<T>,
    options?: FindOneAndUpdateOption<T>
  ) => Promise<T | undefined>
  paginate: () => any
}

type Keys = keyof MonjoiCollection<any>

const asyncPipe = <T>(funcs: ((a?: any) => any)[]) => (input?: any): Promise<T> =>
  funcs.reduce((acc, func) => acc.then(func), Promise.resolve(input))

export const collection = <T>(name: string, schema: Joi.Schema<T>, hooks?: Hooks) => (
  db: Db
): Omit<Collection<T>, Keys> & MonjoiCollection<T> => {
  const col = db.collection<T>(name)

  const useHooks = async <K>(op: keyof Collection, func: () => Promise<K>): Promise<K> => {
    const preHooks = hooks?.[op]?.pre
    if (preHooks) {
      await asyncPipe(preHooks)()
    }

    const value = await func()

    const postHooks = hooks?.[op]?.post
    if (postHooks) {
      return asyncPipe<K>(postHooks)(value)
    }

    return value
  }

  return {
    ...col,

    /**
     * Insert one document into collection
     */
    insertOne: async (
      doc: OptionalId<T>,
      options?: CollectionInsertOneOptions
    ): Promise<WithId<T>> =>
      useHooks('insertOne', async () => {
        await schema.validateAsync(doc)
        const res = await col.insertOne(doc, options)
        const newDoc = res.ops[0]
        return newDoc
      }),

    /**
     * Update one document partially or whole
     */
    findOneAndUpdate: async (
      filter: FilterQuery<T>,
      update: T | UpdateQuery<T>,
      options?: FindOneAndUpdateOption<T>
    ) =>
      useHooks('findOneAndUpdate', async () => {
        // TODO: validate the partial update against the joi schema
        const res = await col.findOneAndUpdate(filter, update, options)
        const newDoc = res.value
        return newDoc
      }),

    // TODO: Add all other operations we want custom
    // validation and formatting on

    /**
     * Automatically paginate results
     */
    paginate: () => {
      // TODO
    }

    // TODO: Automatic date insertion and updating
  }
}
