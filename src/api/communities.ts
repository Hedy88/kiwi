import Router from "@koa/router";

import pool from "../utils/db.js";
import authenticatedOnly from "../middleware/authenticatedOnly.js";
import validateSchema from "../middleware/validate.js";

import {
  CREATE_COMMUNITY_SCHEMA,
  CREATE_POST_SCHEMA,
} from "../utils/schemas.js";
import { generateId, snowflake } from "../utils/snowflakes.js";
import { wilsonScore } from "../utils/algorithms.js";
import { Snowflake } from "nodejs-snowflake";

const router = new Router({
  prefix: "/api/communities",
});

const checkCommunityExists = async (name: string) => {
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

    const checkName = await checkCommunityExists(name);

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
      description:
        communityQuery.rows[0].description ||
        "This community has no description.",
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

router.get("/:name/posts/:catagory", async (ctx) => {
  let error: string;

  if (!["hot", "new", "popular"].includes(ctx.params.catagory))
    error = "Invalid catagory.";

  if (!error) {
    const communityQuery = await pool.query(
      "SELECT id FROM communities WHERE name = $1",
      [ctx.params.name],
    );

    if (communityQuery.rowCount > 0) {
      if (ctx.params.catagory == "new") {
        const posts = await pool.query(
          "SELECT id, author, title, content FROM posts WHERE community = $1 LIMIT 12",
          [communityQuery.rows[0].id],
        );

        posts.rows.sort((a, b) => {
          const firstDate = Snowflake.timestampFromID(
            a.id,
            snowflake.customEpoch(),
          );
          const secondDate = Snowflake.timestampFromID(
            b.id,
            snowflake.customEpoch(),
          );

          return secondDate - firstDate;
        });

        ctx.body = {
          status: "success",
          posts: [
            ...(await Promise.all(
              posts.rows.map(async (post) => {
                const post_votes = await pool.query(
                  "SELECT voter::text, vote_type FROM post_votes WHERE post_id = $1",
                  [post.id],
                );

                return {
                  id: post.id,
                  author: post.author,
                  title: post.title,
                  content: post.content,
                  votes: [
                    ...post_votes.rows.map((vote) => {
                      return {
                        voter: vote.voter,
                        vote_type: vote.vote_type,
                      };
                    }),
                  ],
                };
              }),
            )),
          ],
        };

        return;
      } else if (ctx.params.catagory == "popular") {
        const posts = await pool.query(
          `
          SELECT 
            p.id,
            p.author,
            p.title,
            p.content,
            COALESCE(SUM(CASE WHEN v.vote_type = 0 THEN 1 ELSE 0 END), 0) AS upvotes,
            COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0) AS downvotes
          FROM 
            posts p
          LEFT JOIN 
            post_votes v ON p.id = v.post_id AND p.community = $1
          GROUP BY 
            p.id
          LIMIT 12
          `,
          [communityQuery.rows[0].id],
        );

        posts.rows.sort((a, b) => {
          return (
            wilsonScore(b.upvotes, b.downvotes) -
            wilsonScore(a.upvotes, a.downvotes)
          );
        });

        ctx.body = {
          status: "success",
          posts: [
            ...(await Promise.all(
              posts.rows.map(async (post) => {
                const post_votes = await pool.query(
                  "SELECT voter::text, vote_type FROM post_votes WHERE post_id = $1",
                  [post.id],
                );

                return {
                  id: post.id,
                  author: post.author,
                  title: post.title,
                  content: post.content,
                  votes: [
                    ...post_votes.rows.map((vote) => {
                      return {
                        voter: vote.voter,
                        vote_type: vote.vote_type,
                      };
                    }),
                  ],
                };
              }),
            )),
          ],
        };

        return;
      }
    } else error = "This community doesn't exist.";
  }

  if (error) {
    ctx.status = 400;

    ctx.body = {
      status: "error",
      message: error,
    };
  }
});

router.post(
  "/:name/post",
  ...[authenticatedOnly(), validateSchema(CREATE_POST_SCHEMA)],
  async (ctx) => {
    let error: string;

    const title = ctx.request.body["title"].trim();
    const content = ctx.request.body["content"].trim();

    const communityQuery = await pool.query(
      "SELECT id FROM communities WHERE name = $1",
      [ctx.params.name],
    );

    if (communityQuery.rowCount > 0) {
      const id = generateId();

      await pool.query(
        "INSERT INTO posts (id, author, community, content, title) VALUES ($1, $2, $3, $4, $5)",
        [id, ctx.state.user.id, communityQuery.rows[0].id, content, title],
      );

      await pool.query(
        "INSERT INTO post_votes (post_id, voter, vote_type) VALUES ($1, $2, $3)",
        [id, ctx.state.user.id, 0],
      );

      ctx.body = {
        status: "success",
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
  },
);

export default router;
