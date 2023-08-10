// utils/stats.js
import AWS from './awsConfig.js';
const docClient = new AWS.DynamoDB.DocumentClient();


// Record Statidistics
export function recordStatistics(shortUrl, longUrl, createdTimestamp, generatedDuration, redirectDuration) {
  const params = {
    TableName: "Stats", 
    Item: {
      shortUrl: shortUrl,
      longUrl: longUrl,
      createdTimestamp: createdTimestamp,
      generatedDuration: generatedDuration,
      redirectDuration: redirectDuration,
      redirectCount: 0, 
      cutRequestsCount: 0, 
    },
  };

  docClient.put(params, (error) => {
    if (error) {
      console.error("Error al registrar estadísticas:", error);
    } else {
      console.log("Estadísticas registradas con éxito:", params.Item);
    }
  });
}

// Función para registrar las estadísticas de redirección
export function recordRedirectStats(shortUrl, redirectDuration, userAgent, ipAddress) {
  const params = {
    TableName: "Stats", 
    Key: {
      shortUrl: shortUrl,
    },
    UpdateExpression: "SET redirectDuration = :redirectDuration, redirectCount = redirectCount + :inc, userAgent = :userAgent, ipAddress = :ipAddress",
    ExpressionAttributeValues: {
      ":redirectDuration": redirectDuration,
      ":inc": 1,
      ":userAgent": userAgent,
      ":ipAddress": ipAddress,
    },
    ReturnValues: "ALL_NEW",
  };

  docClient.update(params, (error, data) => {
    if (error) {
      console.error("Error al registrar estadísticas de redirección:", error);
    } else {
      console.log("Estadísticas de redirección registradas con éxito:", data.Attributes);
    }
  });
}

