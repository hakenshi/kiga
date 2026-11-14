import type db from "@/lib/db";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import type { InferInsertModel } from "drizzle-orm";
import { like } from "drizzle-orm";
import type { z } from "zod";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface IRepository<TInsert, TUpdate, TReturn = any> {
  create(data: TInsert): TReturn;
  update(id: number, data: TUpdate): TReturn;
  delete(id: number): any;
  findOne?(id: number): any;
  findMany?(userId: number, options?: any): any;
}

export abstract class BaseRepository {
  protected static searchText(column: SQLiteColumn, query: string) {
    if (query === "") return;
    return like(column, `%${query}%`);
  }

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
