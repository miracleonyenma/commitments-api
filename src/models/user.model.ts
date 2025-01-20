import mongoose, { model, Schema } from "mongoose";
import { genSalt, hash, compare } from "bcrypt";
import { object, string } from "yup";
import { assignRoleToUser } from "../services/user.services.js";
import Role from "./role.model.js";

import { initOTPGeneration } from "../services/otp.services.js";
import {
  BaseUserData,
  UpsertUserParams,
  UserDocument,
  UserModel,
} from "../types/user.js";

// Base upsert function that handles common logic
async function baseUpsertUser(
  this: any,
  params: UpsertUserParams,
  additionalFields: Record<string, any> = {}
) {
  const userRole = await Role.findOne({ name: "user" });

  const updateData = {
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    picture: params.picture,
    emailVerified: params.verified_email,
    roles: [userRole._id],
    ...additionalFields,
  };

  const user = await this.findOneAndUpdate(
    { email: params.email },
    updateData,
    { new: true, upsert: true }
  );

  const userWithRoles = await user.populate("roles");
  return userWithRoles;
}

const registerUserSchema = object({
  firstName: string().trim().min(2).required(),
  lastName: string().trim().min(3).required(),
  email: string().email().required(),
  password: string().min(6).required(),
});

const loginUserSchema = object({
  email: string().email().required(),
  password: string().min(6).required(),
});

const editUserSchema = object({
  firstName: string().trim().min(2).required(),
  lastName: string().trim().min(3).required(),
  email: string().email().required(),
});

const userSchema = new mongoose.Schema<UserDocument, UserModel>(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    picture: {
      type: String,
    },
    count: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
      required: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    gitHub: {
      id: String,
      login: String,
    },
    roles: [
      {
        type: Schema.Types.ObjectId,
        ref: "Role",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.statics.registerUser = async function (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) {
  try {
    // validate user input
    await registerUserSchema.validate(data);
    // check if user exists
    const existingUser = await this.findOne({ email: data.email });
    if (existingUser) {
      throw new Error("User already exists");
    }
    // hash password
    const salt = await genSalt(10);
    const hashedPassword = await hash(data.password, salt);
    // create user
    const user = await this.create({
      ...data,
      password: hashedPassword,
    });
    // assign user role
    await assignRoleToUser(user._id.toString(), "user");
    const userWithRoles = await this.findById(user._id).populate("roles");

    // send verification email
    await initOTPGeneration(data.email);

    return userWithRoles;
  } catch (error) {
    throw new Error(error);
  }
};

userSchema.statics.loginUser = async function ({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  // validate user input
  await loginUserSchema.validate({ email, password });
  // check if user exists
  const user = await this.findOne({ email }).populate("roles");
  if (!user) {
    throw new Error("User does not exist");
  }
  if (!user.password) {
    throw new Error(
      "Seems like you have signed up with Google. Please login with Google"
    );
  }
  // compare password
  const isMatch = await compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }
  // check if user is verified
  if (!user.emailVerified) {
    throw new Error("User is not verified");
  }
  return user;
};

userSchema.statics.me = async function ({ id }: { id: string }) {
  try {
    return this.findById(id);
  } catch (error) {
    throw new Error(error);
  }
};

userSchema.statics.editUser = async function ({
  id,
  firstName,
  lastName,
  email,
}: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}) {
  try {
    // validate user input
    await editUserSchema.validate({ firstName, lastName, email });
    // check if user exists
    const user = await this.findById(id);
    if (!user) {
      throw new Error("User does not exist");
    }
    // update user
    return this.findByIdAndUpdate(
      id,
      { firstName, lastName, email },
      { new: true }
    );
  } catch (error) {
    throw new Error(error);
  }
};

// Schema methods
userSchema.statics.upsertGoogleUser = async function (params: BaseUserData) {
  try {
    return await baseUpsertUser.call(this, params);
  } catch (error) {
    console.error("Error upserting Google user:", error);
    throw new Error(error.message);
  }
};

userSchema.statics.upsertGithubUser = async function (
  params: UpsertUserParams
) {
  try {
    return await baseUpsertUser.call(this, params, {
      gitHub: params.gitHub,
    });
  } catch (error) {
    console.error("Error upserting GitHub user:", error);
    throw new Error(error.message);
  }
};

const User = model<UserDocument, UserModel>("User", userSchema);

export default User;
