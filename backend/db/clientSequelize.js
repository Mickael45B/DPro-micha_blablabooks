import { Sequelize } from "sequelize";


import dotenv from "dotenv";
dotenv.config();

console.log("DB_NAME", process.env.DB_NAME);
console.log("DB_USERNAME", process.env.DB_USERNAME);
console.log("DB_PASSWORD", process.env.DB_PASSWORD);
console.log("DB_HOST", process.env.DB_HOST);
const sequelize = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USERNAME,
	process.env.DB_PASSWORD,
	{
		host: process.env.DB_HOST || "db",
		dialect:
			"postgres" /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */,

		define: {
			createdAt: "created_at",
			updatedAt: "updated_at",
			underscored: true,
		},
	},
);

// Test de connexion
sequelize
  .authenticate()
  .then(() => {
    console.log("Connexion à la base de données réussie !");
  })
  .catch((err) => {
    console.error("Impossible de se connecter à la base de données :", err);
  });

export default sequelize;
