import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
process.env.TOKEN_SECRET;

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader ? authHeader.split(" ")[1]: null;

  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
    if (err) {
      res.status(401).json({ message: "Invalid token" });
      return
    }

    req.user = user; // We add the user to the request object
    next();
  });
};
