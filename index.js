import express from "express";
import bodyParser from "body-parser";
import { createTables,  getAllTables, getItemsTable, persistData } from "./utils/dynamodb.js";
import { setCacheData } from "./utils/redis.js";
import { shortenUrl, expandUrl } from "./routes/shortenerRoute.js";
import { redirectUrl } from "./routes/redirectRoute.js";
import {
    logShortUrlGenerationStats,
    logRedirectStats,
    logRedirectionCountStats,
    logLongUrlCutRequestsStats,
  } from "./utils/stats.js";
// import { recordStats, getStats } from "./routes/statsRoute.js";

const app = express();
app.use(bodyParser.json());

// Endpoint para acortar la URL
app.post("/shorten", async (req, res) => {
  shortenUrl(req, res, persistData, setCacheData);
});

// Endpoint para obtener y redirigir
app.get("/expand/:shortUrl", async (req, res) => {
  expandUrl(req, res);
});

// Endpoint para obtener estadísticas
// app.get("/stats/:shortUrl", async (req, res) => {
//   getStats(req, res);
// });

app.get("/bdview/tables", async (req, res) => {
    getAllTables(req, res);
});
  
app.get("/bdview/tables/:tableName", async (req, res) => {
    getItemsTable(req.params.tableName, res);
});

app.get("/redirect/:shortUrl", async (req, res) => {
    redirectUrl(req, res);
})
  



// Llamamos al método createTable antes de iniciar el servidor
// createTables(function (err) {
//   if (err) {
//     console.error("Error al crear la tabla en DynamoDB:", err);
//     process.exit(1); // Salir del proceso en caso de error al crear la tabla
//   }

//   // Una vez creada la tabla, iniciamos el servidor de Express
//   app.listen(3000, () => {
//     console.log("Servidor iniciado en el puerto 3000");
//   });
// });

app.listen(3000, () => {
    console.log("Servidor iniciado en el puerto 3000");
  });