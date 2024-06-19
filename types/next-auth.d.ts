import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            type: string;
            id: string;
            email: string;
            address: string;
        } & DefaultSession['user'];
    }

    interface User extends DefaultUser {
        type: string;
        address: string;
    }
}
