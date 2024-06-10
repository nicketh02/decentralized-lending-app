import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcrypt';

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
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    return null;
                }

                const isValidPassword = await bcrypt.compare(credentials.password, user.password);

                if (!isValidPassword) {
                    return null;
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
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
        newUser: '/auth/new-user'
    },
    callbacks: {
        async session({ session, token }) {
            console.log('Session callback:', token);
            if (token.user) {
                session.user = token.user;
            }
            return session;
        },
        async jwt({ token, user }) {
            console.log('JWT callback:', { token, user });
            if (user) {
                token.user = user;
            }
            return token;
        },
    },
});