import prisma from '../lib/prisma.ts';

export const findUserByUsername = (username: string) =>
  prisma.user.findUnique({ where: { username } });

export const findUserById = (id: string) =>
  prisma.user.findUnique({ where: { id } });

export const insertUser = (data: { username: string; name: string; passwordHash: string }) =>
  prisma.user.create({ data });
