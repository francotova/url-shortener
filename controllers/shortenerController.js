import crypto from "crypto";
import { searchCacheOrDynamoAndResponse } from "../utils/redis.js";




export async function shortenUrl(req, res, persistData, setCacheData) {
  const longUrl = req.body.longUrl;

  // Persistir los datos en DynamoDB
  persistData(longUrl, function (err, shortUrl) {
    if (err) {
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    
    // Almacenar la URL corta en Redis con un tiempo de expiración. (24 horas)
    setCacheData(shortUrl, longUrl);

    res.json({ shortUrl });
  });
}

export async function expandUrl(req, res) {
  const shortUrl = req.params.shortUrl;

  const hashedUrl = crypto.createHash("sha256").update(shortUrl).digest("hex");


  searchCacheOrDynamoAndResponse(hashedUrl, res);
}

