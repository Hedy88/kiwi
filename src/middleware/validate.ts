import type { Context, Next } from "koa";
import { ZodError, ZodSchema } from "zod";

const validateSchema = (schema: ZodSchema) => {
  return async (ctx: Context, next: Next) => {
    try {
      schema.parse(ctx.request.body);
      await next();
    } catch (err) {
      if (err instanceof ZodError) {
        ctx.status = 400;
        ctx.body = {
          status: "error",
          message: err.issues[0].message,
        };

        return;
      }
    }
  };
};

export default validateSchema;
