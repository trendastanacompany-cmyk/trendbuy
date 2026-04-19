import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from "@nestjs/common";
import { AdminGuard } from "../common/admin.guard";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@Controller("api/products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAll(@Query("categoryId") categoryId?: string) {
    const products = await this.productsService.findAll(categoryId?.trim());
    return products.map((item) => ({
      ...item,
      price: Number(item.price),
      oldPrice: item.oldPrice === null ? null : Number(item.oldPrice)
    }));
  }

  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() dto: CreateProductDto) {
    const product = await this.productsService.create(dto);
    return {
      ...product,
      price: Number(product.price),
      oldPrice: product.oldPrice === null ? null : Number(product.oldPrice)
    };
  }

  @Put(":id")
  @UseGuards(AdminGuard)
  async update(@Param("id") id: string, @Body() dto: UpdateProductDto) {
    const product = await this.productsService.update(id, dto);
    return {
      ...product,
      price: Number(product.price),
      oldPrice: product.oldPrice === null ? null : Number(product.oldPrice)
    };
  }

  @Delete(":id")
  @UseGuards(AdminGuard)
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.productsService.remove(id);
  }
}
