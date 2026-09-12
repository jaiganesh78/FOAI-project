import { registerAs } from '@nestjs/config';
import { z } from 'zod';

export const databaseConfigSchema = z.object({
  url: z.string().default('postgresql://gpios_user:gpios_password@localhost:5432/gpios_db?schema=public'),
});

export type DatabaseConfigType = z.infer<typeof databaseConfigSchema>;

export const databaseConfig = registerAs('database', (): DatabaseConfigType => {
  return databaseConfigSchema.parse({
    url: process.env.DATABASE_URL,
  });
});
