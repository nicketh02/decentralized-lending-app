import Navbar from '../../components/Navbar';
import withAuth from '../../components/withAuth';
import Lenders from '../../components/lenders';
import Borrowers from '../../components/borrowers';
import { useSession } from 'next-auth/react';
import Layout from '@/components/layout';

const Dashboard = () => {
    const { data: session } = useSession();

    const userType = session?.user?.type;

    return (
        <Layout>
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6 text-center">Dashboard</h1>
                {userType === 'lender' && <Lenders />}
                {userType === 'borrower' && <Borrowers />}
            </div>
        </Layout>
    );
};

export default withAuth(Dashboard);
