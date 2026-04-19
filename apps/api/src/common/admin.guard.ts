import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const key = process.env.ADMIN_API_KEY;
    if (!key) throw new UnauthorizedException("ADMIN_API_KEY not configured");

    const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const provided = req.headers["x-admin-key"];

    if (provided !== key) throw new UnauthorizedException("Invalid admin key");
    return true;
  }
}
