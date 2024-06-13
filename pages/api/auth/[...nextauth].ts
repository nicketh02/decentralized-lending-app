import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcrypt';

interface User {
    id: string;
    email: string;
    address: string;
    type: string;
}

export default NextAuth({
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                if (!credentials) {
                    throw new Error('Credentials not provided');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    throw new Error('User not found');
                }

                const isValidPassword = await bcrypt.compare(credentials.password, user.password);

                if (!isValidPassword) {
                    throw new Error('Invalid password');
                }

                return { id: String(user.user_id), email: user.email, address: user.address, type: user.type };
            }
        })
    ],
    adapter: PrismaAdapter(prisma),
    secret: process.env.SECRET,
    session: {
        strategy: 'jwt',
    },
    jwt: {
        secret: process.env.SECRET,
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/signin',
    },
    callbacks: {
        async session({ session, token, user }) {
            if (token.user) {
                session.user = token.user as User;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.user = user as User;
            }
            return token;
        },
    },
});
