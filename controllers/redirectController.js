import crypto from "crypto";
import { searchCacheOrDynamoAndRedirect } from "../utils/redis.js";

export async function redirectUrl(req, res) {
  const startTime = Date.now();
  const shortUrl = req.params.shortUrl;
  if (shortUrl) {
    const userAgent = req.headers["user-agent"];
    const ipAddress = req.ip;
    
    const hashedUrl = crypto
      .createHash("sha256")
      .update(shortUrl)
      .digest("hex");

    searchCacheOrDynamoAndRedirect(
      hashedUrl,
      res,
      startTime,
      userAgent,
      ipAddress
    );
  }
  else {
    res.status(400).json("La Short URL que ingresó no es correcta.")
  }
}
