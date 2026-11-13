import db from "@/lib/db";
import { AnySQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { and, eq, InferInsertModel, isNull } from "drizzle-orm";
import { z } from "zod";
import { categories, CategoryType } from "@/lib/db/schema";

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
      throw safeData.error;
    }

    return tx.insert(drizzleSchema).values(safeData.data).returning().all();
  }
}
