import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { PrismaClient } from "@prisma/client";
import { verifyToken } from "../middleware/auth";
import { issueJWT } from "../utils/auth";
import { validEmail, validPassword, genPassword } from "../utils/credentials";
import { sendResetEmail } from "../utils/email";

const prisma = new PrismaClient();

const UserController = {
  //LOGIN
  login: asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validate email
    validEmail(email);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ error: { message: "User not found" } });
      return;
    }

    // Validate password
    validPassword(password, user.hash, user.salt);

    const { token, expires } = issueJWT(user);

    res.status(200).json({
      success: true,
      user: { email: user.email },
      token,
      expiresIn: expires,
    });
  }),

  //FORGOT
  forgot: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    validEmail(email);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ error: { message: "User not found" } });
      return;
    }

    // Generate a reset token
    const { token } = issueJWT(user);
    const host = req.get("host");

    const resetLink = `${req.protocol}://${host}/api/user/reset-password?token=${encodeURI(token)}`;

    const lastPreferences = await prisma.preferences.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Send reset link via email
    await sendResetEmail(resetLink, email, lastPreferences?.creator);

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
      link: resetLink,
    });
  }),

  //RESET
  reset: asyncHandler(async (req: Request, res: Response) => {
    let token = req.query.token as string;

    token = decodeURI(token);

    const { password } = req.body;

    if (!token) {
      res.status(400).json({ error: { message: "Reset token not found" } });
      return;
    }

    // Verify token
    const user = await verifyToken(token);

    if (!user) {
      res.status(404).json({ error: { message: "Invalid or expired token" } });
      return;
    }

    const { salt, hash } = genPassword(password);

    // Update the user's password
    await prisma.user.update({
      where: { email: user.email },
      data: {
        hash,
        salt,
      },
    });

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  }),
};

export default UserController;