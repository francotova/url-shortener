import redis from "redis";
import {searchInDynamoAndRedirect, searchInDynamoAndResponse, searchStatsInDynamoAndResponse} from "./dynamodb.js";
import { recordRedirectStats } from "./stats.js";
// import { logRedirectStats } from "../routes/statsRoute.js";


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

//Reescribo función 'searchCacheOrDynamoAndResponse':
// export function searchCacheOrDynamoAndResponse(hashedUrl, callback) {
//   redisClient.get(`${REDIS_KEY_PREFIX}${hashedUrl}`, (error, longUrl) => {
//     if (error) {
//       console.error("Error al obtener de Redis:", error);
//       callback(null, error);
//     }

//     if (longUrl) {
//       console.log("Obtenido desde el Caché.");
//       // Si encontramos la URL larga en Redis, redirigimos al usuario
//       callback(null, longUrl);
//     } else {
//       searchInDynamoAndResponse(hashedUrl, (err, longUrl) => {
//         if(err) {
//           console.error("Error al obtener de Redis:", error);
//           callback(null, error);
//         }

//         if(longUrl) {
//           console.log("Obtenido desde DynamoDB.");
//           // Si encontramos la URL larga en Redis, redirigimos al usuario
//           callback(null, longUrl);
//         }
//       });
//     }
//   });
// }


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

export function searchCacheOrDynamoAndRedirect(hashedUrl, res, startTime, userAgent, ipAddress) { // add parameter startTime, userAgent, ipAddress
    redisClient.get(`${REDIS_KEY_PREFIX}${hashedUrl}`, (error, longUrl) => {
      if (error) {
        console.error("Error al obtener de Redis:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
  
      if (longUrl) {
        const endTime = Date.now(); // Marca de tiempo de finalización para medir la duración
        const redirectDuration = endTime - startTime; // Duración de redirección

        console.log("Obtenido desde el Caché.");
        // Si encontramos la URL larga en Redis, redirigimos al usuario

        res.redirect(301, longUrl);
        console.log("Después de redireccionar");
        recordRedirectStats(hashedUrl, redirectDuration, userAgent, ipAddress);

      } else {
        searchInDynamoAndRedirect(hashedUrl, res, startTime, userAgent, ipAddress); // add parameter startTime, userAgent, ipAddress
      }
    });
  }

export function searchStatsInCacheOrDynamoAndResponse(hashedUrl, res) {
    // Intentar obtener las estadísticas desde el caché de Redis
    redisClient.get(`${REDIS_KEY_PREFIX}${hashedUrl}`, (redisError, cachedStats) => {
      if (redisError) {
        console.error("Error al obtener estadísticas desde Redis:", redisError);
      }
  
      if (cachedStats) {
        // Si las estadísticas están en caché, devolverlas
        console.log("Estadísticas obtenidas desde Redis:", cachedStats);
        res.status(200).json(cachedStats);
      } else {
        // Si no están en caché, obtenerlas de DynamoDB
        searchStatsInDynamoAndResponse(hashedUrl, res);
      }
    });
}

export function deleteCacheForShortUrl(hashedUrl, callback) {
  redisClient.del(hashedUrl, (error) => {
    if (error) {
      console.error("Error al eliminar caché de Redis:", error);
      callback(null, error);
    } else {
      console.log("Caché eliminado para la shortUrl:", hashedUrl);
      callback(null, hashedUrl);
    }
  });
}