import { DataTypes } from "sequelize";
import sequelize from "../db/clientSequelize.js";

const UserHasBook = sequelize.define("userHasBook", {
	id_userHasBook: {
		type: DataTypes.STRING(42),
		primaryKey: true,
		allowNull: false,
	},

	id_user: {
		type: DataTypes.STRING(42),
	},

	id_book: {
		type: DataTypes.STRING(42),
	},
	created_at: {
		type: DataTypes.DATE,
		allowNull: false,
	},
	updated_at: {
		type: DataTypes.DATE,
	},
}, {
	tableName: "userHasBook", // Specify the exact table name
	timestamps: true,
});

export default UserHasBook;
