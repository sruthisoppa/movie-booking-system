import jwt from 'jsonwebtoken';

export const createToken = (user: { id: number; name: string; email: string }) => {
  return jwt.sign(user, process.env.JWT_SECRET as string, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET as string);
};
