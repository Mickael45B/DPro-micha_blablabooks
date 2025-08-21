/**
 * Composant App qui constitue le point d'entrée principal de l'application.
 *
 * @returns {JSX.Element} Le composant App rendu.
 */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./css/App.css";
import "./css/MediaQueries.css";
import Header from "./components/Header.jsx";
import MainContent from "./components/MainContent.jsx";
import Footer from "./components/Footer.jsx";
import BottomBar from "./components/BottomBar.jsx";
import BookPage from "./components/BookPage.jsx";
import LibraryPage from "./components/LibraryPage.jsx";
import LoginPage from "./components/LoginPage.jsx";
import RegisterPage from "./components/RegisterPage.jsx";
import UserLibraryPage from "./components/UserLibraryPage.jsx";
// import AnotherPage from './components/AnotherPage.jsx';

function App() {
	console.log("App is rendering"); // Debug
	return (
		<div>
			<Header />
			<Router>
				<Routes>
					<Route path="/" element={<MainContent />} />
					<Route path="/livres/:id" element={<BookPage />} />
					{/* <Route path="/another" element={<AnotherPage />} />
        <Route path="/another" element={<AnotherPage />} />
        <Route path="/another" element={<AnotherPage />} /> */}
					<Route path="/catalogue" element={<LibraryPage />} />
					<Route path="/connexion" element={<LoginPage />} />
					<Route path="/inscription" element={<RegisterPage />} />
					<Route path="/mybiblilbooks" element={<UserLibraryPage />} />
				</Routes>
			</Router>
			<BottomBar />
			<Footer />
		</div>
	);
}

export default App;
