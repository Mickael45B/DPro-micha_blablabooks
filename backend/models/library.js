import { DataTypes } from "sequelize";
import sequelize from "../db/clientSequelize.js";

const Library = sequelize.define(
	"library",
	{
		id_library: {
			type: DataTypes.STRING(42),
			primaryKey: true,
			allowNull: false,
		},

		name: {
			type: DataTypes.STRING(255),
		},

		is_editable: {
			type: DataTypes.STRING(42),
		},

		id_user: {
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
		tableName: "library", // Specify the exact table name
		timestamps: true,
	},
);

export default Library;
