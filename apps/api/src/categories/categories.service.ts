import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "../entities/category.entity";
import { Product } from "../entities/product.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>
  ) {}

  findAll() {
    return this.categoriesRepo.find({
      order: { sortOrder: "ASC", name: "ASC" }
    });
  }

  async create(dto: CreateCategoryDto) {
    const name = dto.name.trim();
    const duplicate = await this.categoriesRepo
      .createQueryBuilder("category")
      .where("LOWER(category.name) = LOWER(:name)", { name })
      .getOne();

    if (duplicate) throw new BadRequestException("Category already exists");

    const category = this.categoriesRepo.create({
      name,
      sortOrder: dto.sortOrder ?? 0
    });
    return this.categoriesRepo.save(category);
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException("Category not found");

    const name = dto.name.trim();
    const duplicate = await this.categoriesRepo
      .createQueryBuilder("category")
      .where("LOWER(category.name) = LOWER(:name)", { name })
      .andWhere("category.id != :id", { id })
      .getOne();

    if (duplicate) throw new BadRequestException("Category already exists");

    category.name = name;
    category.sortOrder = dto.sortOrder ?? category.sortOrder;
    return this.categoriesRepo.save(category);
  }

  async remove(id: string) {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException("Category not found");

    await this.productsRepo.delete({ categoryId: id });
    await this.categoriesRepo.delete({ id });
  }
}
