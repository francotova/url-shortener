import redis from "redis";
import {searchInDynamoAndRedirect, searchInDynamoAndResponse} from "./dynamodb.js";

// Configuración de Redis
const redisClient = redis.createClient({
  host: "localhost", // Cambiar por la dirección de tu servidor Redis
  port: 6379, // Puerto de Redis
});
const REDIS_KEY_PREFIX = "short_url:";
redisClient.on("connect", function () {
  console.log("redis connected");
  console.log(`connected ${redisClient.connected}`);
});

redisClient.on("error", (err) => {
  console.log(err);
});

export function setCacheData(shortUrl, longUrl) {
  redisClient.setex(`${REDIS_KEY_PREFIX}${shortUrl}`, 86400, longUrl);
}

export function searchCacheOrDynamoAndResponse(hashedUrl, res) {
  redisClient.get(`${REDIS_KEY_PREFIX}${hashedUrl}`, (error, longUrl) => {
    if (error) {
      console.error("Error al obtener de Redis:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (longUrl) {
      console.log("Obtenido desde el Caché.");
      // Si encontramos la URL larga en Redis, redirigimos al usuario
        res.status(200).json(longUrl);
    } else {
      searchInDynamoAndResponse(hashedUrl, res);
    }
  });
}

export function searchCacheOrDynamoAndRedirect(hashedUrl, res) {
    redisClient.get(`${REDIS_KEY_PREFIX}${hashedUrl}`, (error, longUrl) => {
      if (error) {
        console.error("Error al obtener de Redis:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
  
      if (longUrl) {
        console.log("Obtenido desde el Caché.");
        // Si encontramos la URL larga en Redis, redirigimos al usuario
          res.redirect(301, longUrl);
      } else {
        searchInDynamoAndRedirect(hashedUrl, res);
      }
    });
  }
