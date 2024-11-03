import Router from "@koa/router";

import pool from "../utils/db.js";
import authenticatedOnly from "../middleware/authenticatedOnly.js";
import validateSchema from "../middleware/validate.js";

import { CREATE_COMMUNITY_SCHEMA } from "../utils/schemas.js";
import { generateId } from "../utils/snowflakes.js";

const router = new Router({
  prefix: "/api/communities",
});

const checkCommunityNameUsage = async (name: string) => {
  const query = await pool.query(
    "SELECT COUNT(*) FROM communities WHERE name = $1",
    [name],
  );

  if (parseInt(query.rows[0].count) > 0) {
    return false;
  }

  return true;
};

router.post(
  "/",
  ...[authenticatedOnly(), validateSchema(CREATE_COMMUNITY_SCHEMA)],
  async (ctx) => {
    let error: string;
    let description: string;
    const name = ctx.request.body["name"].trim();

    if (ctx.request.body["description"] !== undefined) {
      description = ctx.request.body["description"];
    }

    const checkName = await checkCommunityNameUsage(name);

    if (checkName) {
      const id = generateId();

      if (description) {
        await pool.query(
          "INSERT INTO communities (id, owner, name, description) VALUES ($1, $2, $3, $4)",
          [id, ctx.state.user.id, name, description],
        );
      } else {
        await pool.query(
          "INSERT INTO communities (id, owner, name) VALUES ($1, $2, $3)",
          [id, ctx.state.user.id, name],
        );
      }

      ctx.body = {
        status: "success",
      };

      return;
    } else error = "This name is already taken.";

    if (error) {
      ctx.status = 400;

      ctx.body = {
        status: "error",
        message: error,
      };
    }
  },
);

router.get("/:name", async (ctx) => {
  let error: string;
  const communityQuery = await pool.query(
    "SELECT id::text, owner::text, name, description FROM communities WHERE name = $1",
    [ctx.params.name],
  );

  if (communityQuery.rowCount > 0) {
    ctx.body = {
      status: "success",
      id: communityQuery.rows[0].id,
      owner: communityQuery.rows[0].owner,
      name: communityQuery.rows[0].name,
      description: communityQuery.rows[0].description || "This community has no description."
    };

    return;
  } else error = "This community doesn't exist.";

  if (error) {
    ctx.status = 400;

    ctx.body = {
      status: "error",
      message: error,
    };
  }
});

export default router;
