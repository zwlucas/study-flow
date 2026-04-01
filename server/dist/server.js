"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)(); // Load variables from .env
const PORT = parseInt(process.env.PORT || "3333", 10);
const HOST = process.env.HOST || "0.0.0.0"; // Fastify defaults to localhost unless 0.0.0.0 is used
async function startServer() {
    const app = await (0, app_1.buildApp)();
    try {
        const url = await app.listen({ port: PORT, host: HOST });
        app.log.info(`API Server rodando em ${url}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
startServer();
