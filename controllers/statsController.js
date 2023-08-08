import {searchStatsInCacheOrDynamoAndResponse} from "../utils/redis.js"
import crypto from "crypto";

// Función para obtener todas las estadísticas de una shortUrl
export function getStatsForShortUrl(req, res) {
    const shortUrl = req.params.shortUrl;
    const hashedUrl = crypto.createHash("sha256").update(shortUrl).digest("hex");

    searchStatsInCacheOrDynamoAndResponse(hashedUrl, res);
}
