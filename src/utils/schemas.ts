import { z } from "zod";

const isValidUsername = (key: string) => !/[^a-z0-9_]/i.test(key);

const SIGNUP_SCHEMA = z.object({
  username: z
    .string({ required_error: "An username is required." })
    .min(3, "Username must be above 3 characters")
    .max(15, "Your username is too long!")
    .refine(isValidUsername, { message: "Invalid username." }),
  email: z
    .string({ required_error: "An email is required." })
    .max(100, "Your email is too long!")
    .email("Invalid email."),
  password: z
    .string({ required_error: "A password is required." })
    .max(70, "Your password is too long!"),
});

const LOGIN_SCHEMA = z.object({
  username: z.string({ required_error: "An username is required." }),
  password: z.string({ required_error: "A password is required." }),
});

const USER_UPDATE_SCHEMA = z.object({
  username: z
    .string()
    .min(3, "Username must be above 3 characters")
    .max(15, "Your username is too long!")
    .refine(isValidUsername, { message: "Invalid username." })
    .optional(),
});

const CREATE_COMMUNITY_SCHEMA = z.object({
  name: z
    .string({ required_error: "A name is required." })
    .min(3, "Community names must be above 3 characters")
    .max(15, "Community names must be less then 15 characters")
    // TODO: make a custom regex for this
    .refine(isValidUsername, { message: "Invalid community name." }),
  description: z
    .string()
    .max(255, "Community descriptions must be less then 255 characters")
    .optional(),
});

const CREATE_POST_SCHEMA = z.object({
  content: z
    .string({ required_error: "Every post must have content." })
    .min(3, "Content must be above 3 characters")
    .max(255, "Content must be less then 255 characters"),
  title: z
    .string({ required_error: "A title is required" })
    .min(1, "Title must be above 1 characters")
    .max(20, "Title must be less then 20 characters"),
});

export {
  SIGNUP_SCHEMA,
  LOGIN_SCHEMA,
  USER_UPDATE_SCHEMA,
  CREATE_COMMUNITY_SCHEMA,
  CREATE_POST_SCHEMA
};
