import "dotenv/config";
import Koa from "koa";
import { bodyParser } from "@koa/bodyparser";

import logger from "./utils/logger.js";
import pool from "./utils/db.js";

import authRoutes from "./api/auth.js";
import usersRoutes from "./api/users.js";

const app = new Koa();

logger.info(`connecting to PostgreSQL`);
await pool.connect();

app.use(bodyParser());

app.use(async (ctx, next) => {
  ctx.set("X-Powered-By", "kiwi");

  await next();
});

app.use(authRoutes.routes());
app.use(usersRoutes.routes());

app.listen(process.env.PORT, () => {
  logger.info(`kiwi listening on port: ${process.env.PORT}`);
});
