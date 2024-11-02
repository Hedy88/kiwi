import type { Context, Next } from "koa";
import jwt from "jsonwebtoken";

const authenticatedOnly = () => {
  return async (ctx: Context, next: Next) => {
    const token =
      ctx.header.authorization && ctx.header.authorization.split(" ")[1];

    if (token == null) {
      ctx.status = 401;
      ctx.body = {
        status: "error",
        message: "Unauthorized",
      };

      return;
    }

    jwt.verify(token, process.env.SECRET, async (err, user) => {
      if (err) {
        ctx.status = 403;
        ctx.body = {
          status: "error",
          message: "Forbidden",
        };

        return;
      }

      ctx.state.user = user;
    });

    await next();
  };
};

export default authenticatedOnly;
