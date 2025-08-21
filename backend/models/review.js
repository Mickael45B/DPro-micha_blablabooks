import { DataTypes } from "sequelize";
import sequelize from "../db/clientSequelize.js";

const Review = sequelize.define(
	"reviews",
	{
		id_review: {
			type: DataTypes.UUID,
			primaryKey: true,
			allowNull: false,
		},
		id_user: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		id_book: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		comment: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		rating: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		created_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
		updated_at: {
			type: DataTypes.DATE,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: "reviews", // Specify the exact table name
		timestamps: true,
	},
);

export default Review;
