export default {
  development: {
    username: process.env.DB_USERNAME || "blablabook",
    password: process.env.DB_PASSWORD || "blablabook",
    database: process.env.DB_NAME || "blablabook",
    host: process.env.DB_HOST || "db",
    dialect: "postgres",
  },
  test: {
    username: process.env.DB_USERNAME || "blablabook",
    password: process.env.DB_PASSWORD || "blablabook",
    database: process.env.DB_NAME_TEST || "blablabook_test",
    host: process.env.DB_HOST || "db",
    dialect: "postgres",
  },
  production: {
    username: process.env.DB_USERNAME || "blablabook",
    password: process.env.DB_PASSWORD || "blablabook",
    database: process.env.DB_NAME || "blablabook",
    host: process.env.DB_HOST || "db",
    dialect: "postgres",
  },
};