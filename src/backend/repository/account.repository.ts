import { eq } from "drizzle-orm";
import { db } from "../database";
import {
  AccountInsert,
  accounts,
  AccountSelect,
} from "../database/schema/accounts";

export interface IAccountRepository {
  create(data: AccountInsert): Promise<AccountSelect>;
  findByEmail(email: string): Promise<AccountSelect | null>;
  findById(id: string): Promise<AccountSelect | null>;
}

export class AccountRepository implements IAccountRepository {
  async create(data: AccountInsert): Promise<AccountSelect> {
    const [created] = await db.insert(accounts).values(data).returning();
    return created;
  }

  async findByEmail(email: string): Promise<AccountSelect | null> {
    const rows = await db
      .select()
      .from(accounts)
      .where(eq(accounts.email, email))
      .limit(1);
    return rows[0] ?? null;
  }

  async findById(id: string): Promise<AccountSelect | null> {
    const rows = await db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);
    return rows[0] ?? null;
  }
}

export const accountRepository = new AccountRepository();
