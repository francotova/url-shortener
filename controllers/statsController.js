import { searchStatsInDynamoAndResponse } from "../utils/dynamodb.js";
import crypto from "crypto";


export function getStatsForShortUrl(req, res) {
  const shortUrl = req.query.shortUrl;
  if (shortUrl) {
    const hash = shortUrl.slice(-6); 
    const hashedUrl = crypto.createHash("sha256").update(hash).digest("hex");
    searchStatsInDynamoAndResponse(hashedUrl, res);
  } else {
    res.status(400).json("No ingresó ninguna Short URL.");
  }
}
