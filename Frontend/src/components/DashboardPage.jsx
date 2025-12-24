import Header from './Header';
// import Sidebar from './Sidebar';
import Footer from './Footer';

const DashboardPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      
      <div className="flex flex-1">
        {/* <Sidebar /> */}
        <main className="flex-1 p-6 bg-gray-50">
            <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;