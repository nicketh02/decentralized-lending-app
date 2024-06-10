import Navbar from '../../components/Navbar';
import withAuth from '../../components/withAuth';

const Dashboard = () => {
    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-6 text-center">Dashboard</h1>
                {/* Add your dashboard content here */}
            </div>
        </div>
    );
}

export default withAuth(Dashboard);