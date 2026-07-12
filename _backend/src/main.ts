import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 8880: distinct from the frontend dev server's 3330 (see
  // _frontend/package.json), since `pnpm front`/`pnpm back` are meant to
  // run side by side.
  await app.listen(process.env.PORT ?? 8880);
}
bootstrap();
