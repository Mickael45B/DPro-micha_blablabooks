// chargement du .env
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

// import { router } from "./router.js";
//import sequelize from "./db/clientSequelize.js";

// setup view engine
//app.set("view engine", "ejs");
//app.set("views", "./views");

// start app
const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
