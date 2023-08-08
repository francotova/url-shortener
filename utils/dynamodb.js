import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import crypto from "crypto";

// Configuración de AWS DynamoDB
AWS.config.update({
  region: "us-east-2",
  endpoint: "http://localhost:8000",
  accessKeyId: "AKIAY5B5K7V4GT3TD2HQ",
  secretAccessKey: "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",
});

const dynamoDB = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

// export function createTable(callback) {
//   const params = {
//     TableName: "ShortsUrl", // Cambiar por el nombre de tu tabla en DynamoDB
//     KeySchema: [
//       {
//         AttributeName: "shortUrl", // Reemplaza 'shortUrl' con el nombre del atributo que deseas usar como clave primaria
//         KeyType: "HASH", // 'HASH' para clave primaria de hash, 'RANGE' para clave primaria compuesta
//       },
//     ],
//     AttributeDefinitions: [
//       {
//         AttributeName: "shortUrl", // Reemplaza 'shortUrl' con el nombre del atributo que deseas usar como clave primaria
//         AttributeType: "S", // 'S' para cadena de texto, 'N' para número, etc.
//       },
//       {
//         AttributeName: "longUrl", // Atributo para el índice global secundario
//         AttributeType: "S", // 'S' para cadena de texto, 'N' para número, etc.
//       },
//     ],
//     ProvisionedThroughput: {
//       ReadCapacityUnits: 5, // Capacidad de lectura (ajusta según tus necesidades)
//       WriteCapacityUnits: 5, // Capacidad de escritura (ajusta según tus necesidades)
//     },
//     GlobalSecondaryIndexes: [
//       {
//         IndexName: "LongUrlIndex", // Nombre del índice global secundario
//         KeySchema: [
//           {
//             AttributeName: "longUrl", // Clave primaria invertida para el índice global secundario
//             KeyType: "HASH", // 'HASH' para clave primaria de hash, 'RANGE' para clave primaria compuesta
//           },
//         ],
//         Projection: {
//           ProjectionType: "KEYS_ONLY", // Proyecta solo las claves (shortUrl) para el índice global secundario
//         },
//         ProvisionedThroughput: {
//           ReadCapacityUnits: 5, // Capacidad de lectura para el índice global secundario
//           WriteCapacityUnits: 5, // Capacidad de escritura para el índice global secundario
//         },
//       },
//     ],
//   };

//   dynamoDB.createTable(params, function (err, data) {
//     if (err) {
//       console.error("Error al crear la tabla:", err);
//       callback(err);
//     } else {
//       console.log("Tabla creada con éxito:", data);
//       callback(null);
//     }
//   });
// }


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
  
    // Tabla para las estadísticas
    const statsTableParams = {
      TableName: "Stats", // Cambiar por el nombre de tu tabla en DynamoDB para las estadísticas
      KeySchema: [
        {
          AttributeName: "type", // Reemplaza 'type' con el nombre del atributo que deseas usar como clave primaria
          KeyType: "HASH", // 'HASH' para clave primaria de hash, 'RANGE' para clave primaria compuesta
        },
        // Si deseas una clave primaria compuesta, agrega más atributos aquí
      ],
      AttributeDefinitions: [
        {
          AttributeName: "type", // Reemplaza 'type' con el nombre del atributo que deseas usar como clave primaria
          AttributeType: "S", // 'S' para cadena de texto, 'N' para número, etc.
        },
        // Agrega más atributos aquí si los necesitas para una clave primaria compuesta
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5, // Capacidad de lectura (ajusta según tus necesidades)
        WriteCapacityUnits: 5, // Capacidad de escritura (ajusta según tus necesidades)
      },
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

  // Hasheamos la URL corta utilizando SHA-256 para generar un hash determinista
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

export function searchInDynamoAndRedirect(hashedUrl, res) {
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
      res.redirect(301, data.Item.longUrl);
    });
  }

// Otras funciones relacionadas con la interacción con DynamoDB
