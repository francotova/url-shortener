import redis from "redis";
import {searchInDynamoAndRedirect, searchInDynamoAndResponse} from "./dynamodb.js";
import { recordRedirectStats } from "./stats.js";
import { config } from "../config.js"

const redisClient = redis.createClient({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT, 
});

const REDIS_KEY_PREFIX = "short_url:";
redisClient.on("connect", function () {
  console.log("Redis conectado exitosamente.");
});

redisClient.on("error", (err) => {
  console.log(err);
});

export function setCacheData(shortUrl, longUrl) {
  redisClient.setex(`${REDIS_KEY_PREFIX}${shortUrl}`, 86400, longUrl);
}

export function getCacheData(callback) {
  const result = {};

  function scan(cursor) {
    redisClient.scan(cursor, "MATCH", "*", "COUNT", "100", (error, reply) => {
      if (error) {
        console.error("Error al escanear claves en Redis:", error);
        return callback(error, null);
      }

      const nextCursor = reply[0];
      const keys = reply[1];

      if (keys.length > 0) {
        redisClient.mget(keys, (error, values) => {
          if (error) {
            console.error("Error al obtener valores en Redis:", error);
            return callback(error, null);
          }

          keys.forEach((key, index) => {
            result[key] = values[index];
          });

          if (nextCursor === "0") {
            callback(null, result);
          } else {
            scan(nextCursor);
          }
        });
      } else {
        callback(null, result);
      }
    });
  }
  scan("0");
}


export function searchCacheOrDynamoAndResponse(hashedUrl, res) {
  redisClient.get(`${REDIS_KEY_PREFIX}${hashedUrl}`, (error, longUrl) => { 
    if (error) {
      console.error("Error al obtener de Redis:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (longUrl) {
      console.log("Obtenido desde el Caché.");
        res.status(200).json(longUrl);
    } else {
      searchInDynamoAndResponse(hashedUrl, res);
    }
  });
}

export function searchCacheOrDynamoAndRedirect(hashedUrl, res, startTime, userAgent, ipAddress) { 
  
    redisClient.get(`${REDIS_KEY_PREFIX}${hashedUrl}`, (error, longUrl) => {
      if (error) {
        console.error("Error al obtener de Redis:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
      if (longUrl) {
        const endTime = Date.now();
        const redirectDuration = endTime - startTime; 

        console.log("Obtenido desde el Caché.");
        
        res.redirect(302, longUrl);

        recordRedirectStats(hashedUrl, redirectDuration, userAgent, ipAddress);

      } else {
        searchInDynamoAndRedirect(hashedUrl, res, startTime, userAgent, ipAddress); 
      }
    });
  }



export function deleteCacheForShortUrl(hashedUrl, callback) {
  redisClient.del(`${REDIS_KEY_PREFIX}${hashedUrl}`, (error) => {
    if (error) {
      console.error("Error al eliminar caché de Redis:", error);
      callback(null, error);
    } else {
      console.log("Caché eliminado para la shortUrl:", hashedUrl);
      callback(null, hashedUrl);
    }
  });
}