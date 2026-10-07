import { Module, Global, Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE_PROVIDER = 'DRIZZLE_PROVIDER';
export type DrizzleDB = PostgresJsDatabase<typeof schema>;
const POSTGRES_CLIENT = 'POSTGRES_CLIENT';
@Injectable()
class DatabaseShutdown implements OnModuleDestroy {
  constructor(@Inject(POSTGRES_CLIENT) private client: ReturnType<typeof postgres>) {}
  async onModuleDestroy() { await this.client.end({ timeout: 5 }); }
}

@Global()
@Module({
  providers: [
    {
      provide: POSTGRES_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('DATABASE_URL');
        if (!connectionString) {
          throw new Error('DATABASE_URL is required for database persistence');
        }
        return postgres(connectionString, { max: 10, connect_timeout: 5, idle_timeout: 20 });
      },
    },
    { provide: DRIZZLE_PROVIDER, inject: [POSTGRES_CLIENT], useFactory: (client: ReturnType<typeof postgres>) => drizzle(client, { schema }) },
    DatabaseShutdown,
  ],
  exports: [DRIZZLE_PROVIDER],
})
export class DatabaseModule {}
