import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "../entities/category.entity";
import { Product } from "../entities/product.entity";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>
  ) {}

  findAll(categoryId?: string) {
    if (categoryId) {
      return this.productsRepo.find({
        where: { categoryId },
        order: { sortOrder: "ASC", name: "ASC" }
      });
    }

    return this.productsRepo
      .createQueryBuilder("product")
      .innerJoin("product.category", "category")
      .orderBy("category.sortOrder", "ASC")
      .addOrderBy("category.name", "ASC")
      .addOrderBy("product.sortOrder", "ASC")
      .addOrderBy("product.name", "ASC")
      .getMany();
  }

  async create(dto: CreateProductDto) {
    await this.assertCategoryExists(dto.categoryId);
    const entity = this.productsRepo.create({
      categoryId: dto.categoryId.trim(),
      name: dto.name.trim(),
      image: dto.image.trim(),
      sortOrder: dto.sortOrder ?? 0,
      description: dto.description?.trim() || "",
      price: dto.price.toFixed(2),
      oldPrice:
        dto.oldPrice === null || dto.oldPrice === undefined
          ? null
          : dto.oldPrice.toFixed(2)
    });
    return this.productsRepo.save(entity);
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException("Product not found");

    await this.assertCategoryExists(dto.categoryId);
    product.categoryId = dto.categoryId.trim();
    product.name = dto.name.trim();
    product.image = dto.image.trim();
    product.sortOrder = dto.sortOrder ?? product.sortOrder;
    product.description = dto.description?.trim() || "";
    product.price = dto.price.toFixed(2);
    product.oldPrice =
      dto.oldPrice === null || dto.oldPrice === undefined
        ? null
        : dto.oldPrice.toFixed(2);

    return this.productsRepo.save(product);
  }

  async remove(id: string) {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException("Product not found");
    await this.productsRepo.delete({ id });
  }

  private async assertCategoryExists(categoryId: string) {
    const category = await this.categoriesRepo.findOne({
      where: { id: categoryId.trim() }
    });
    if (!category) throw new BadRequestException("categoryId not found");
  }
}
