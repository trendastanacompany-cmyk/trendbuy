import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from "typeorm";
import { Category } from "./category.entity";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  categoryId!: string;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: "CASCADE"
  })
  @JoinColumn({ name: "categoryId" })
  category!: Category;

  @Column()
  name!: string;

  @Column()
  image!: string;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  price!: string;

  @Column({ type: "numeric", precision: 12, scale: 2, nullable: true })
  oldPrice!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
