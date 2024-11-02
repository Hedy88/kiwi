import { z } from "zod";

const isValidUsername = (key: string) => !/[^a-z0-9_]/i.test(key);

const REGISTER_SCHEMA = z.object({
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

export { REGISTER_SCHEMA, LOGIN_SCHEMA };
