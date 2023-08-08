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

  // Revertir el hash para obtener el hash original almacenado en la base de datos
  const hashedUrl = crypto.createHash("sha256").update(shortUrl).digest("hex");


  //Reescribo el llamado a la función 'searchCacheOrDynamoAndResponse':
  // searchCacheOrDynamoAndResponse(hashedUrl, (error, longUrl) => {
  //   if(error) {
  //     console.log("Hubo un error al obtener la url larga.")
  //     res.status(500).json("URL corta no encontrada");
  //   }

  //   res.status(200).json(longUrl);
  // })
  
  searchCacheOrDynamoAndResponse(hashedUrl, res);
}

