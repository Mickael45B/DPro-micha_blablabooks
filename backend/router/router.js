import express from "express";
const router = express.Router();

// import { homeController } from './controllers/homeController.js';
import authController from "../controllers/authController.js";
import userController from "../controllers/userController.js";
import bookController from "../controllers/bookController.js";
import libraryController from "../controllers/libraryController.js";
import reviewController from "../controllers/reviewController.js";
import favoriteController from "../controllers/favoriteController.js";
import verifyAdmin from "../middlewares/isAdminMiddleware.js";

import verifyJWT from "../middlewares/JWTverifyMiddleware.js";
import {
	createLibairySchema,
	readLibraryByIdSchema,
	readAllLibrariesOfUserSchema,
	readAllBooksOfLibrarySchema,
	readAllBookOfLibraryByIdSchema,
	updateLibairyShema,
	deleteLibairySchema,
} from "../schema/librairySchema.js";
import {
	getUsersByPKSchema,
	updateUserSchema,
	deleteUsersByPKSchema,
} from "../schema/userSchema.js";
import { registerSchema, loginSchema } from "../schema/authSchema.js";
import {
	createReviewSchema,
	readReviewByIdSchema,
	updateReviewShema,
	deleteReviewSchema,
} from "../schema/reviewSchema.js";
import {
	createBookSchema,
	readBookByIdSchema,
	updateBookShema,
	deleteBookSchema,
} from "../schema/bookSchema.js";
import { favoriteBookSchema } from "../schema/favoriteSchema.js";
import validate from "../middlewares/validationMiddleware.js";

//router.get("/", homeController.homePage);
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//                                                                                                             API AUTHENTIFICATION
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//CREATE
router.post("/inscription", validate(registerSchema), authController.register); // Connect to register user

//READ
router.post("/connexion", validate(loginSchema), authController.login); // Connect to login user

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//                                                                                                             API UTILISATEUR
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//READ
router.get("/utilisateurs", verifyJWT, verifyAdmin, userController.allProfiles); // GET all users (Admin only)
router.get(
	"/utilisateurs/:id",
	validate(getUsersByPKSchema),
	userController.getUserById,
); // GET to profile page

//UPDATE
router.patch(
	"/utilisateurs/:id",
	validate(updateUserSchema),
	userController.updateUser,
); // PATCH user by id

//DELETE
router.delete(
	"/utilisateurs/:id",
	verifyJWT,
	validate(deleteUsersByPKSchema),
	userController.deleteUser,
); // DELETE user by id

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//                                                                                                             API BIBLIOTHEQUE
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//CREATE
router.post(
	"/bibliotheques",
	verifyJWT,
	validate(createLibairySchema),
	libraryController.createLibrary,
); // POST new library

//READ
router.get(
	//(Admin only) 18588530-d26f-4033-b3d7-b66f2fb394f4
	"/bibliotheques",
	verifyJWT,
	verifyAdmin,
	libraryController.getAllLibraries,
);

router.get(
	"/bibliotheques/user", //toutes ses biblio perso
	verifyJWT,
	validate(readAllLibrariesOfUserSchema),
	libraryController.getAllLibrariesOfUser,
);

router.get(
	"/bibliotheques/:idLibrary/user/books", //touts les livres contenu dans une de ses biblio perso
	verifyJWT,
	validate(readAllBooksOfLibrarySchema),
	libraryController.getAllBooksOfLibrary,
);

router.get(
	"/bibliotheques/:id", //voir toutes les bibliotheque d'un utilisateur
	verifyJWT,
	verifyAdmin,
	validate(readLibraryByIdSchema),
	libraryController.getLibraryById,
);

router.get(
	// voir tous les livres d'une bibliotheque
	"/bibliotheques/:idLibrary/admin/books",
	verifyAdmin,
	validate(readAllBookOfLibraryByIdSchema),
	libraryController.getAllBookOfLibraryById,
);

//UPDATE
router.patch(
	"/bibliotheques/:id",
	validate(updateLibairyShema),
	libraryController.updateLibrary,
); // PATCH library by id

//DELETE
router.delete(
	//ajouter pour la partie admin
	"/bibliotheques/:id",
	verifyJWT,
	validate(deleteLibairySchema),
	libraryController.deleteLibrary,
); // DELETE library by id

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//                                                                                                             API LIVRE
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//CREATE

router.post(
	"/livres",
	verifyJWT,
	verifyAdmin,
	validate(createBookSchema),
	bookController.createBook,
); // POST new book (Admin only)

//READ
router.get("/livres", bookController.getAllBooks); // GET all books

router.post(
	"/livres/:id",
	verifyJWT,
	validate(readBookByIdSchema),
	bookController.getBookById,
);
//UPDATE
router.patch(
	"/livres/:id",
	verifyJWT,
	verifyAdmin,
	validate(updateBookShema),
	bookController.updateBook,
); // PATCH book by id (Admin only)

//DELETE
router.delete(
	"/livres/:id",
	verifyJWT,
	verifyAdmin,
	validate(deleteBookSchema),
	bookController.deleteBook,
); // DELETE book by id (Admin only)

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//                                                                                                             API AVIS
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//CREATE
router.post(
	"/avis/:id",
	verifyJWT,
	validate(createReviewSchema),
	reviewController.createReview,
); // POST new review

//READ
router.get(
	"/avis/:id",
	validate(readReviewByIdSchema),
	reviewController.getReviewById,
); // GET review by id

//UPDATE
// PATCH review by id (all=>Admin only / own review => user+Admin)
router.patch(
	"/avis/:id",
	verifyJWT,
	validate(updateReviewShema),
	reviewController.updateReview,
);

//DELETE
router.delete(
	"/avis/:id",
	validate(deleteReviewSchema),
	reviewController.deleteReview,
); // DELETE review by id (all=>Admin only / own review => user+Admin)

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//                                                                                                             API FAVORIS
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

router.get(
	"/favoris",
	verifyJWT,
	validate(favoriteBookSchema),
	favoriteController.favoriteBook,
); //ajouter/retirer un favoris

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//                                                                                                             API ADMIN
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//READ
//router.get("/admin", adminController.getAllAdmins); // Connect to dashboard
// router.get("/admin/:id", adminController.getAdminById); // GET admin by id

export { router };
