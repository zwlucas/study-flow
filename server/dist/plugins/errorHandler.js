"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandlerPlugin;
async function errorHandlerPlugin(fastify) {
    fastify.setErrorHandler(function (error, request, reply) {
        // Tratamento de erros de validação do Zod
        if (error.validation) {
            return reply.status(400).send({
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Dados de entrada inválidos.",
                    details: error.validation,
                },
            });
        }
        // Rate Limit atingido
        if (error.statusCode === 429) {
            return reply.status(429).send({
                error: {
                    code: "TOO_MANY_REQUESTS",
                    message: "Muitas requisições. Tente novamente mais tarde.",
                },
            });
        }
        // Tratamento genérico para erros previstos ou não previstos
        const statusCode = error.statusCode || 500;
        const isServerError = statusCode === 500;
        // Log apenas de erros 500 (problemas internos, evitar vazar/fazer log de erro de cliente)
        if (isServerError) {
            fastify.log.error({ err: error, req: request }, error.message);
        }
        reply.status(statusCode).send({
            error: {
                code: isServerError ? "INTERNAL_SERVER_ERROR" : error.code || "BAD_REQUEST",
                message: isServerError ? "Um erro inesperado ocorreu." : error.message,
            },
        });
    });
}
