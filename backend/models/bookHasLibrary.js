import { DataTypes } from "sequelize";
import sequelize from "../db/clientSequelize.js";

const BookHasLibrary = sequelize.define(
	"bookhaslibrary",
	{
		id: {
			type: DataTypes.STRING(42),
			primaryKey: true,
			allowNull: false,
		},

		id_book: {
			type: DataTypes.STRING(42),
		},

		id_library: {
			type: DataTypes.STRING(42),
		},

		is_favorite: {
			type: DataTypes.BOOLEAN,
		},

		is_read: {
			type: DataTypes.STRING(42),
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		updated_at: {
			type: DataTypes.DATE,
		},
	},
	{
		tableName: "bookhaslibrary", // Specify the exact table name
		timestamps: true,
	},
);

export default BookHasLibrary;
