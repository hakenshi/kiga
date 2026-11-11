import db from "@/lib/db";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { InferInsertModel } from "drizzle-orm";
import { z } from "zod";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface IRepository<TInsert, TUpdate, TReturn = any> {
  create(data: TInsert): TReturn;
  update(id: number, data: TUpdate): TReturn;
  delete(id: number): any;
  findOne?(id: number): any;
  findMany?(userId: number, options?: any): any;
}

export abstract class BaseRepository {
  protected static insert<T extends SQLiteTable, Z extends z.ZodType<InferInsertModel<T>>>(
    tx: Tx,
    data: z.input<Z>,
    zodSchema: Z,
    drizzleSchema: T
  ) {
    const safeData = zodSchema.safeParse(data);
    if (!safeData.success) {
      throw new Error(safeData.error.message);
    }

    return tx.insert(drizzleSchema).values(safeData.data).returning().all();
  }
}
