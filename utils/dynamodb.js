import AWS from "./awsConfig.js";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { recordRedirectStats, recordStatistics } from "./stats.js";
import { deleteCacheForShortUrl } from "./redis.js";




const dynamoDB = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();


export function createTables(callback) {
    // Tabla para las URL cortas
    const shortUrlTableParams = {
      TableName: "ShortsUrl", 
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
            ProjectionType: "KEYS_ONLY",
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5, 
            WriteCapacityUnits: 5, 
          },
        },
      ],
    };
  
    
    const statsTableParams = {
      TableName: "Stats", 
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
  const hash = nanoid(6);
  const startTime = Date.now(); 

  
  const hashedUrl = crypto.createHash("sha256").update(hash).digest("hex");

  const queryParams = {
    TableName: "ShortsUrl",
    IndexName: "LongUrlIndex",
    KeyConditionExpression: "longUrl = :longUrl",
    ExpressionAttributeValues: {
      ":longUrl": longUrl,
    },
    ProjectionExpression: "shortUrl",
    Limit: 1, 
  };

  docClient.query(queryParams, function (err, data) {
    if (err) {
      console.error("Error al verificar duplicados:", err);
      callback(err);
    } else {
      if (data.Items.length > 0) {
        
        const existingShortUrl = data.Items[0].shortUrl;
        console.log(
          `La shortUrl "${existingShortUrl}" ya existe para el longUrl "${longUrl}"`
        );
        callback(null, existingShortUrl);
      } else {
        

        const endTime = Date.now(); 
        const generatedDuration = endTime - startTime; 
        recordStatistics(hashedUrl, longUrl, new Date().toISOString(), generatedDuration, 0);

        const params = {
          TableName: "ShortsUrl", 
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


export function searchInDynamoAndResponse(hashedUrl, res) {
  const params = {
    TableName: "ShortsUrl", 
    Key: {
      shortUrl: hashedUrl,
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
      TableName: "ShortsUrl", 
      Key: {
        shortUrl: hashedUrl, 
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
      const endTime = Date.now(); 
      const redirectDuration = endTime - startTime; 

      console.log("Obtenido desde DynamoDB.");

      res.redirect(301, data.Item.longUrl);

      recordRedirectStats(hashedUrl, redirectDuration, userAgent, ipAddress);
      
    });
  }


export function searchStatsInDynamoAndResponse(hashedUrl, res) {
  const params = {
    TableName: "Stats",
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
    TableName: "ShortsUrl", 
    Key: {
      shortUrl: hashedUrl,
    },
  };

  docClient.delete(deleteShortUrlParams, (error, data) => {
    if (error) {
      console.error("Error al eliminar la shortUrl desde DynamoDB:", error);
      callback(error);
    } else {

      // Eliminar las estadísticas asociadas de la tabla Stats
      const deleteStatsParams = {
        TableName: "Stats", 
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
        }
      });
    }
  });
}
