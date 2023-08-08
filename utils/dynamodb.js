import AWS from "./awsConfig.js";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { recordRedirectStats, recordStatistics } from "./stats.js";
import { deleteCacheForShortUrl } from "./redis.js";
// import { logRedirectStats } from "../routes/statsRoute.js";




const dynamoDB = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();


export function createTables(callback) {
    // Tabla para las URL cortas
    const shortUrlTableParams = {
      TableName: "ShortsUrl", // Cambiar por el nombre de tu tabla en DynamoDB
      KeySchema: [
        {
          AttributeName: "shortUrl", // Reemplaza 'shortUrl' con el nombre del atributo que deseas usar como clave primaria
          KeyType: "HASH", // 'HASH' para clave primaria de hash, 'RANGE' para clave primaria compuesta
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: "shortUrl", // Reemplaza 'shortUrl' con el nombre del atributo que deseas usar como clave primaria
          AttributeType: "S", // 'S' para cadena de texto, 'N' para número, etc.
        },
        {
          AttributeName: "longUrl", // Atributo para el índice global secundario
          AttributeType: "S", // 'S' para cadena de texto, 'N' para número, etc.
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5, // Capacidad de lectura (ajusta según tus necesidades)
        WriteCapacityUnits: 5, // Capacidad de escritura (ajusta según tus necesidades)
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: "LongUrlIndex", // Nombre del índice global secundario
          KeySchema: [
            {
              AttributeName: "longUrl", // Clave primaria invertida para el índice global secundario
              KeyType: "HASH", // 'HASH' para clave primaria de hash, 'RANGE' para clave primaria compuesta
            },
          ],
          Projection: {
            ProjectionType: "KEYS_ONLY", // Proyecta solo las claves (shortUrl) para el índice global secundario
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5, // Capacidad de lectura para el índice global secundario
            WriteCapacityUnits: 5, // Capacidad de escritura para el índice global secundario
          },
        },
      ],
    };
  
    // const statsTableParams = {
    //   TableName: "Stats",
    //   KeySchema: [
    //     {
    //       AttributeName: "shortUrl",
    //       KeyType: "HASH",
    //     },
    //   ],
    //   AttributeDefinitions: [
    //     {
    //       AttributeName: "shortUrl",
    //       AttributeType: "S",
    //     },
    //     {
    //       AttributeName: "longUrl",
    //       AttributeType: "S",
    //     },
    //     // Agregar los nuevos atributos de agente de usuario y dirección IP
    //     {
    //       AttributeName: "userAgent",
    //       AttributeType: "S",
    //     },
    //     {
    //       AttributeName: "ipAddress",
    //       AttributeType: "S",
    //     },
    //     // ... otros atributos existentes ...
    //   ],
    //   ProvisionedThroughput: {
    //     ReadCapacityUnits: 5,
    //     WriteCapacityUnits: 5,
    //   },
    //   GlobalSecondaryIndexes: [
    //     {
    //       IndexName: "LongUrlIndex",
    //       KeySchema: [
    //         {
    //           AttributeName: "longUrl",
    //           KeyType: "HASH",
    //         },
    //       ],
    //       Projection: {
    //         ProjectionType: "ALL",
    //       },
    //       ProvisionedThroughput: {
    //         ReadCapacityUnits: 5,
    //         WriteCapacityUnits: 5,
    //       },
    //     },
    //   ],
    // };
    const statsTableParams = {
      TableName: "Stats", // Nombre de la tabla para las estadísticas
      KeySchema: [
        {
          AttributeName: "shortUrl",
          KeyType: "HASH",
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: "shortUrl",
          AttributeType: "S",
        },
        {
          AttributeName: "longUrl",
          AttributeType: "S",
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: "LongUrlIndex",
          KeySchema: [
            {
              AttributeName: "longUrl",
              KeyType: "HASH",
            },
          ],
          Projection: {
            ProjectionType: "ALL",
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
    };
  
    // Crear la tabla para las URL cortas
    dynamoDB.createTable(shortUrlTableParams, function (err, data) {
      if (err) {
        console.error("Error al crear la tabla de URL cortas:", err);
        callback(err);
      } else {
        console.log("Tabla de URL cortas creada con éxito:", data);
  
        // Crear la tabla para las estadísticas
        dynamoDB.createTable(statsTableParams, function (err, data) {
          if (err) {
            console.error("Error al crear la tabla de estadísticas:", err);
            callback(err);
          } else {
            console.log("Tabla de estadísticas creada con éxito:", data);
            callback(null);
          }
        });
      }
    });
  }


export async function getAllTables(req, res) {
  var params = {};
  var tables = [];

  while (true) {
    var response = await dynamoDB.listTables(params).promise();
    tables = tables.concat(response.TableNames);

    if (undefined === response.LastEvaluatedTableName) {
      break;
    } else {
      params.ExclusiveStartTableName = response.LastEvaluatedTableName;
    }
  }
  res.status(200).json({
    tables,
  });
}

export async function getItemsTable(tableName, res) {
  const params = {
    TableName: tableName,
  };
  const data = await docClient.scan(params).promise();
  res.status(200).json({
    data,
  });
}
export function persistData(longUrl, callback) {
  const hash = nanoid(6); // Longitud de la URL corta
  const startTime = Date.now(); // Marca de tiempo de inicio para medir la duración

  // Hasheamos la URL corta utilizando el algoritmo de SHA-256 para generar un hash.
  const hashedUrl = crypto.createHash("sha256").update(hash).digest("hex");

  console.log("SHORTEN: ", hashedUrl);

  // Verificar si el longUrl ya existe en la tabla utilizando el índice global secundario
  const queryParams = {
    TableName: "ShortsUrl", // Cambiar por el nombre de tu tabla en DynamoDB
    IndexName: "LongUrlIndex", // Nombre del índice global secundario
    KeyConditionExpression: "longUrl = :longUrl",
    ExpressionAttributeValues: {
      ":longUrl": longUrl,
    },
    ProjectionExpression: "shortUrl", // Proyectar solo el atributo shortUrl para minimizar el costo
    Limit: 1, // Limitar la consulta a un solo resultado, ya que solo queremos verificar si existe
  };

  docClient.query(queryParams, function (err, data) {
    if (err) {
      console.error("Error al verificar duplicados:", err);
      callback(err);
    } else {
      if (data.Items.length > 0) {
        // Si existe un resultado, significa que ya se ha generado una shortUrl para este longUrl
        const existingShortUrl = data.Items[0].shortUrl;
        console.log(
          `La shortUrl "${existingShortUrl}" ya existe para el longUrl "${longUrl}"`
        );
        callback(null, existingShortUrl);
      } else {
        // Si no existe un resultado, podemos persistir los datos en la tabla

        const endTime = Date.now(); // Marca de tiempo de finalización para medir la duración
        const generatedDuration = endTime - startTime; // Duración de generación de la URL corta
        recordStatistics(hashedUrl, longUrl, new Date().toISOString(), generatedDuration, 0);

        const params = {
          TableName: "ShortsUrl", // Cambiar por el nombre de tu tabla en DynamoDB
          Item: {
            shortUrl: hashedUrl,
            longUrl: longUrl,
            createdAt: new Date().toISOString(),
          },
        };

        docClient.put(params, function (error) {
          if (error) {
            console.error("Error al guardar en DynamoDB:", error);
            callback(error);
          } else {
            console.log("Datos persistidos con éxito:", params.Item);
            callback(null, hash);
          }
        });
      }
    }
  });
}

//Reescribo función 'searchInDynamoAndResponse' con callback:
// export function searchInDynamoAndResponse(hashedUrl, callback) {
//   const params = {
//     TableName: "ShortsUrl", // Cambiar por el nombre de tu tabla en DynamoDB
//     Key: {
//       shortUrl: hashedUrl, // Utilizamos el hash revertido para buscar en la base de datos
//     },
//   };

//   docClient.get(params, (error, data) => {
//     if (error) {
//       console.error("Error al obtener de DynamoDB:", error);
//       callback(null, error);
//     }

//     if (!data.Item) {
//       let notExist = "No existe el item en DynamoDB";
//       callback(null, notExist);
//     }

//     console.log("Obtenido desde DynamoDB.", data.Item);
//     callback(null, data.Item.longUrl);
//   });
// }


export function searchInDynamoAndResponse(hashedUrl, res) {
  const params = {
    TableName: "ShortsUrl", // Cambiar por el nombre de tu tabla en DynamoDB
    Key: {
      shortUrl: hashedUrl, // Utilizamos el hash revertido para buscar en la base de datos
    },
  };

  docClient.get(params, (error, data) => {
    if (error) {
      console.error("Error al obtener de DynamoDB:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    if (!data.Item) {
      return res.status(404).json({ error: "URL corta no encontrada" });
    }
    console.log("Obtenido desde DynamoDB.");
    res.status(200).json(data.Item.longUrl);
  });
}

export function searchInDynamoAndRedirect(hashedUrl, res, startTime, userAgent, ipAddress) {
    const params = {
      TableName: "ShortsUrl", // Cambiar por el nombre de tu tabla en DynamoDB
      Key: {
        shortUrl: hashedUrl, // Utilizamos el hash revertido para buscar en la base de datos
      },
    };
  
    docClient.get(params, (error, data) => {
      if (error) {
        console.error("Error al obtener de DynamoDB:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
      }
  
      if (!data.Item) {
        return res.status(404).json({ error: "URL corta no encontrada" });
      }
      const endTime = Date.now(); // Marca de tiempo de finalización para medir la duración
      const redirectDuration = endTime - startTime; // Duración de redirección

      console.log("Obtenido desde DynamoDB.");

      res.redirect(301, data.Item.longUrl);

      recordRedirectStats(hashedUrl, redirectDuration, userAgent, ipAddress);
      
    });
  }


export function searchStatsInDynamoAndResponse(hashedUrl, res) {
  const params = {
    TableName: "Stats", // Nombre de la tabla para las estadísticas
    Key: {
      shortUrl: hashedUrl,
    },
  };

  docClient.get(params, (dynamoError, data) => {
    if (dynamoError) {
      console.error("Error al obtener estadísticas desde DynamoDB:", dynamoError);
      callback(dynamoError, null);
    } else {
      if (data.Item) {
        console.log("Estadísticas obtenidas desde DynamoDB:", data.Item);
        res.status(200).json(data.Item);
      } else {
        // Si no se encontraron estadísticas en DynamoDB
        console.log("No se encontraron estadísticas para la shortUrl:", shortUrl);
        res.status(404).send("No se encontraron estadísticas para la shortUrl:", shortUrl);
      }
    }
  });
}

export function deleteShortUrl(hashedUrl, callback) {
  const deleteShortUrlParams = {
    TableName: "ShortsUrl", // Nombre de la tabla de URL cortas
    Key: {
      shortUrl: hashedUrl,
    },
  };

  docClient.delete(deleteShortUrlParams, (error, data) => {
    if (error) {
      console.error("Error al eliminar la shortUrl desde DynamoDB:", error);
      callback(error);
    } else {
      console.log("ShortUrl eliminada con éxito:", data);

      // Eliminar las estadísticas asociadas de la tabla Stats
      const deleteStatsParams = {
        TableName: "Stats", // Nombre de la tabla de estadísticas
        Key: {
          shortUrl: hashedUrl,
        },
      };

      docClient.delete(deleteStatsParams, (statsError) => {
        if (statsError) {
          console.error("Error al eliminar estadísticas desde DynamoDB:", statsError);
          callback(statsError);
        } else {
          console.log("Estadísticas eliminadas con éxito para la shortUrl:", hashedUrl);
          
          // También eliminamos la entrada del caché si existía
          deleteCacheForShortUrl(hashedUrl, (error, hashedUrl) => {
            if(error) {
              console.log("Error al eliminar la ShortURL del caché.");
              callback(null, error);
            }
            else {
              console.log("Short URL eliminada con éxito", hashedUrl);
              callback(null, hashedUrl);
            }
          })
          // redisClient.del(hashedUrl, (redisError) => {
          //   if (redisError) {
          //     console.error("Error al eliminar caché de Redis:", redisError);
          //   } else {
          //     console.log("Caché eliminado para la shortUrl:", hashedUrl);
          //   }
          //   callback(null);
          // });
        }
      });
    }
  });
}
