import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    switch (method) {
        case 'GET':
            const { userId } = req.query;
            const deals = await prisma.allDealsLenders.findMany({
                where: { userId: Number(userId) },
                orderBy: { dateTime: 'desc' },
            });
            res.status(200).json(deals);
            break;

        case 'POST':
            const { type, amount, interestGained, dateTime, userId: postUserId } = req.body;
            const newDeal = await prisma.allDealsLenders.create({
                data: {
                    userId: Number(postUserId),
                    type,
                    amount,
                    interestGained,
                    dateTime: new Date(dateTime),
                },
            });
            res.status(201).json(newDeal);
            break;

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).end(`Method ${method} Not Allowed`);
            break;
    }
}
