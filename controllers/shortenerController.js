import crypto from "crypto";
import { searchCacheOrDynamoAndResponse } from "../utils/redis.js";
import { setCacheData } from "../utils/redis.js";
import { recordStatistics } from "../utils/stats.js";

export async function shortenUrl(req, res, persistData) {
  const longUrl = req.body.longUrl;
 
  persistData(longUrl, function (err, shortUrl, hashedUrl) {
    if (err) {
      return res.status(500).json({ error: "Error interno del servidor: " + err });
    }

    
    setCacheData(hashedUrl, longUrl);

    res.json({ shortUrl });
  });
}

export async function expandUrl(req, res) {
  const shortUrl = req.query.shortUrl;
  if (shortUrl) {
    const hash = shortUrl.slice(-6);
    const hashedUrl = crypto.createHash("sha256").update(hash).digest("hex");
    searchCacheOrDynamoAndResponse(hashedUrl, res);
  } else {
    res.status(400).json("No ingresó una Short URL.");
  }
}
