import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname, join } from "path";
import { mkdirSync } from "fs";
import { AdminGuard } from "../common/admin.guard";

const productsDir = join(__dirname, "..", "..", "uploads", "products");
mkdirSync(productsDir, { recursive: true });

@Controller("api/uploads")
export class UploadsController {
  @Post("image")
  @UseGuards(AdminGuard)
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: productsDir,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname || "").toLowerCase();
          const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
            ? ext
            : ".png";
          cb(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
        }
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!String(file.mimetype || "").startsWith("image/")) {
          cb(new BadRequestException("Only image files are allowed"), false);
          return;
        }
        cb(null, true);
      }
    })
  )
  uploadImage(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Image file is required");
    return { path: `/uploads/products/${file.filename}` };
  }
}
