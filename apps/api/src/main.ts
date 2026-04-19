import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const allowedOrigin = process.env.ALLOWED_ORIGIN || "https://trendbuy.kz";
  app.enableCors({ origin: allowedOrigin });

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
  console.log(`API started on http://localhost:${port}`);
}

bootstrap();
