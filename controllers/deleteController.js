import crypto from "crypto";
import { deleteShortUrl } from "../utils/dynamodb.js";


export function deleteShortUrlAndStats(req, res) {
  
  const shortUrl = req.query.shortUrl;

  if (shortUrl) {
    const hash = shortUrl.slice(-6);
    
    const hashedUrl = crypto.createHash("sha256").update(hash).digest("hex");

    deleteShortUrl(hashedUrl, (err) => {
      if (err) {
        console.log(
          "Ocurrió un error al eliminar la shortURL solicitada.",
          err
        );
        res
          .status(500)
          .json("Ocurrió un error al eliminar la ShortURL: " + err);
      } else {
        res.status(200).json("ShortURL eliminada con éxito");
      }
    });
  }
  else {
    res.status(400).json("No ingresó ninguna Short URL.");
  }
}
