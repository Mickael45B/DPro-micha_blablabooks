import Header from '../../layout/Header/Header.jsx';
// import Sidebar from './Sidebar';
import Footer from '../../layout/Footer/Footer.jsx';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        {/* <Sidebar /> */}
        <main className="flex-1 p-6 bg-gray-50">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default NotFoundPage;