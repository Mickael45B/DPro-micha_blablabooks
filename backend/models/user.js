import { DataTypes } from "sequelize";
import sequelize from "../db/clientSequelize.js";

const User = sequelize.define(
	"users",
	{
		id_user: {
			type: DataTypes.STRING(42),
			primaryKey: true,
			allowNull: false,
		},

		name: {
			type: DataTypes.STRING(255),
		},

		email: {
			type: DataTypes.STRING(42),
			unique: true,
			allowNull: false,
		},

		password: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		created_at: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		updated_at: {
			type: DataTypes.DATE,
		},
		is_admin: {
			type: DataTypes.BOOLEAN,
		},
	},
	{
		tableName: "users", // Specify the exact table name
		timestamps: true,
	},
);

export default User;
