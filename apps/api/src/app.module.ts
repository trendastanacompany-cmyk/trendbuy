import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ServeStaticModule } from "@nestjs/serve-static";
import { TypeOrmModule } from "@nestjs/typeorm";
import { join } from "path";
import { CategoriesModule } from "./categories/categories.module";
import { HealthController } from "./common/health.controller";
import { Category } from "./entities/category.entity";
import { Product } from "./entities/product.entity";
import { ProductsModule } from "./products/products.module";
import { UploadsModule } from "./uploads/uploads.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get<string>("DB_HOST", "localhost"),
        port: Number(config.get<string>("DB_PORT", "5432")),
        username: config.get<string>("DB_USER", "postgres"),
        password: config.get<string>("DB_PASSWORD", "postgres"),
        database: config.get<string>("DB_NAME", "trendastana"),
        entities: [Category, Product],
        synchronize: config.get<string>("DB_SYNC", "true") === "true"
      })
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "uploads"),
      serveRoot: "/uploads"
    }),
    CategoriesModule,
    ProductsModule,
    UploadsModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
