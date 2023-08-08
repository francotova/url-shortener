import crypto from "crypto";
import { searchCacheOrDynamoAndRedirect } from "../utils/redis.js";


export async function redirectUrl(req, res) {
  const shortUrl = req.params.shortUrl;

  // Revertir el hash para obtener el hash original almacenado en la base de datos
  const hashedUrl = crypto.createHash("sha256").update(shortUrl).digest("hex");


  searchCacheOrDynamoAndRedirect(hashedUrl, res);
}

