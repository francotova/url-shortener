import crypto from "crypto";
import { deleteShortUrl } from "../utils/dynamodb.js";

// Función para eliminar una shortUrl y sus estadísticas de DynamoDB
export function deleteShortUrlAndStats(req, res) {
  const shortUrl = req.params.shortUrl;

  const hashedUrl = crypto.createHash("sha256").update(shortUrl).digest("hex");

  deleteShortUrl(hashedUrl, (err) => {
    if (err) {
      console.log("Ocurrió un error al eliminar la shortURL solicitada.", err);
      res.status(500).json("Ocurrió un error al eliminar la ShortURL.");
    } else {
      res.status(200).json("ShortURL eliminada con éxito");
    }
  });
}
