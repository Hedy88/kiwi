import Router from "@koa/router";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import pool from "../utils/db.js";
import validateSchema from "../middleware/validate.js";
import logger from "../utils/logger.js";

import { LOGIN_SCHEMA, SIGNUP_SCHEMA } from "../utils/schemas.js";
import { generateId } from "../utils/snowflakes.js";

const router = new Router({
  prefix: "/api/auth",
});

const checkUsernameUsage = async (username: string) => {
  const query = await pool.query(
    "SELECT COUNT(*) FROM users WHERE username = $1",
    [username],
  );

  if (parseInt(query.rows[0].count) > 0) {
    return false;
  }

  return true;
};

const checkEmailUsage = async (email: string) => {
  const query = await pool.query(
    "SELECT COUNT(*) FROM users WHERE email = $1",
    [email],
  );

  if (parseInt(query.rows[0].count) > 0) {
    return false;
  }

  return true;
};

const createUser = async (
  username: string,
  email: string,
  password: string,
) => {
  const hash = await bcrypt.hash(password, 12);
  const id = generateId();

  await pool.query(
    "INSERT INTO users (id, username, email, password_hash) VALUES ($1, $2, $3, $4)",
    [id, username, email, hash],
  );
};

router.post("/signup", validateSchema(SIGNUP_SCHEMA), async (ctx) => {
  let error: string;
  let username = ctx.request.body["username"];
  let email = ctx.request.body["email"];
  let password = ctx.request.body["password"];

  username = username.trim();
  password = password.trim();

  const checkEmail = await checkEmailUsage(email);
  const checkUsername = await checkUsernameUsage(username);

  if (checkEmail) {
    if (checkUsername) {
      try {
        await createUser(username, email, password);
      } catch (err) {
        error = "Something went wrong trying to create this account";
        logger.error("account creation error: " + err);
      }
    } else error = "This username has already been taken.";
  } else error = "This e-mail has already been taken.";

  if (!error) {
    ctx.body = {
      status: "success",
    };
  } else {
    ctx.status = 400;

    ctx.body = {
      status: "error",
      message: error,
    };
  }

  return;
});

router.post("/login", validateSchema(LOGIN_SCHEMA), async (ctx) => {
  let error: string;
  let username = ctx.request.body["username"];
  let password = ctx.request.body["password"];

  username = username.trim();
  password = password.trim();

  const user = await pool.query(
    "SELECT id, password_hash, site_banned FROM users WHERE username = $1",
    [username],
  );

  if (user.rowCount !== 0) {
    const { id, password_hash, site_banned } = user.rows[0];
    const comparePass = await bcrypt.compare(password, password_hash);

    if (!site_banned) {
      if (comparePass) {
        const token = jwt.sign({ id }, process.env.SECRET, { expiresIn: "1d" });

        ctx.body = {
          status: "success",
          token,
        };

        return;
      } else error = "Invalid username / password.";
    } else error = "This account has been banned from using Birdeye.";
  } else error = "Invalid username / password.";

  if (error) {
    ctx.status = 400;

    ctx.body = {
      status: "error",
      message: error,
    };
  }
});

export default router;
