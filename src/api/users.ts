import Router from "@koa/router";

import pool from "../utils/db.js";
import authenticatedOnly from "../middleware/authenticatedOnly.js";

const router = new Router({
  prefix: "/api/users",
});

const checkIfSubscribed = async (user_id: bigint, community_id: bigint) => {
  const query = await pool.query(
    "SELECT COUNT(*) from user_subscriptions WHERE subscriber = $1 AND community = $2",
    [user_id, community_id],
  );

  if (parseInt(query.rows[0].count) > 0) {
    return false;
  }

  return true;
};

router.get("/@me", authenticatedOnly(), async (ctx) => {
  const query = await pool.query(
    "SELECT id::text, username, email FROM users WHERE id = $1",
    [ctx.state.user.id],
  );

  ctx.body = {
    status: "success",
    id: query.rows[0].id,
    username: query.rows[0].username,
    email: query.rows[0].email,
  };
});

router.get("/:username", async (ctx) => {
  let error: string;
  const query = await pool.query(
    "SELECT id::text, username FROM users WHERE username = $1",
    [ctx.params.username],
  );

  if (query.rowCount > 0) {
    ctx.body = {
      status: "success",
      id: query.rows[0].id,
      username: query.rows[0].username,
    };

    return;
  } else error = "This user doesn't exist.";

  if (error) {
    ctx.status = 400;

    ctx.body = {
      status: "error",
      message: error,
    };
  }
});

router.get("/@me/subscriptions", authenticatedOnly(), async (ctx) => {
  const query = await pool.query(
    "SELECT * FROM user_subscriptions WHERE subscriber = $1",
    [ctx.state.user.id],
  );

  ctx.body = {
    status: "success",
    subscriptions: [
      ...await Promise.all(
        query.rows.map(async (row) => {
          // fetch community data
          const community = await pool.query(
            "SELECT name FROM communities WHERE id = $1",
            [row.community],
          );

          return {
            id: `${row.community}`,
            name: community.rows[0].name,
          };
        }),
      ),
    ],
  };
});

router.put("/@me/subscriptions/:name", authenticatedOnly(), async (ctx) => {
  let error: string;
  const communityQuery = await pool.query(
    "SELECT id FROM communities WHERE name = $1",
    [ctx.params.name],
  );

  if (communityQuery.rowCount > 0) {
    // check if user is already subscribed to this community
    const isSubscribed = await checkIfSubscribed(
      ctx.state.user.id,
      communityQuery.rows[0].id,
    );

    if (isSubscribed) {
      await pool.query(
        "INSERT INTO user_subscriptions (subscriber, community) VALUES ($1, $2)",
        [ctx.state.user.id, communityQuery.rows[0].id],
      );

      ctx.body = {
        status: "success",
      };

      return;
    } else error = "You're already subscribed to this community.";
  } else error = "This community doesn't exist.";

  if (error) {
    ctx.status = 400;

    ctx.body = {
      status: "error",
      message: error,
    };
  }
});

router.delete("/@me/subscriptions/:name", authenticatedOnly(), async (ctx) => {
  let error: string;
  const communityQuery = await pool.query(
    "SELECT id FROM communities WHERE name = $1",
    [ctx.params.name],
  );

  if (communityQuery.rowCount > 0) {
    const isSubscribed = await checkIfSubscribed(
      ctx.state.user.id,
      communityQuery.rows[0].id,
    );

    if (!isSubscribed) {
      await pool.query(
        "DELETE FROM user_subscriptions WHERE subscriber = $1 AND community = $2",
        [ctx.state.user.id, communityQuery.rows[0].id],
      );

      ctx.body = {
        status: "success",
      };

      return;
    } else error = "You're not subscribed to this community";
  } else error = "This community doesn't exist";

  if (error) {
    ctx.status = 400;

    ctx.body = {
      status: "error",
      message: error,
    };
  }
});

export default router;
