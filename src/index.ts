import "dotenv/config";
import Koa from "koa";

import logger from "./utils/logger.js";

const app = new Koa();

app.use(async (ctx, next) => {
    ctx.set("X-Powered-By", "kiwi");

    await next();
})

app.listen(process.env.PORT, () => {
    logger.info(`kiwi listening on port: ${process.env.PORT}`);
})