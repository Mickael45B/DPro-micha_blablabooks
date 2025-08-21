import { DataTypes } from "sequelize";
import sequelize from "../db/clientSequelize.js";

const Book = sequelize.define("book", {

    id_book: {
        type: DataTypes.STRING(42),
        primaryKey: true,
        allowNull: false,
    },
    isbn: {
        type: DataTypes.STRING(42),
    },
    title: {
        type: DataTypes.STRING(42),
    },
    author: {
        type: DataTypes.STRING(42),
    },
    publication_date: {
        type: DataTypes.DATE,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
    },
    gender: {
        type: DataTypes.STRING(42),
    },
    editor: {
        type: DataTypes.STRING(42),
    },
    bookimage: {
        type: DataTypes.STRING(100),
    },
    vignetteimage: {
        type: DataTypes.STRING(100),
    },
 
    age_limit: {
        type: DataTypes.INTEGER,
    },
    description: {
        type: DataTypes.STRING(255),
    },
    series: {
        type: DataTypes.STRING(42),
    },
}, {
    tableName: "book", // Specify the exact table name
    timestamps: true,
});

export default Book;
