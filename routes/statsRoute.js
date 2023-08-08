// utils/stats.js
import AWS from "aws-sdk";

const docClient = new AWS.DynamoDB.DocumentClient();

// Función para registrar estadísticas de generación de URL corta
export async function logShortUrlGenerationStats(duration) {
  const params = {
    TableName: "Stats", // Cambiar por el nombre de la tabla en DynamoDB para las estadísticas
    Item: {
      type: "shortUrl",
      timestamp: new Date().toISOString(),
      duration,
    },
  };

  try {
    await docClient.put(params).promise();
  } catch (error) {
    console.error("Error al guardar las estadísticas:", error);
    // Manejo de errores, por ejemplo, reintentar o guardar en un registro de errores
  }
}

// Función para registrar estadísticas de redirección
export async function logRedirectStats(shortUrl, redirectTime) {
  const params = {
    TableName: "Stats", // Cambiar por el nombre de la tabla en DynamoDB para las estadísticas
    Item: {
      type: "redirection",
      timestamp: new Date().toISOString(),
      shortUrl,
      redirectTime,
    },
  };

  try {
    await docClient.put(params).promise();
  } catch (error) {
    console.error("Error al guardar las estadísticas:", error);
    // Manejo de errores, por ejemplo, reintentar o guardar en un registro de errores
  }
}

// Función para registrar estadísticas de cantidad de redirecciones
export async function logRedirectionCountStats(shortUrl) {
  const params = {
    TableName: "Stats", // Cambiar por el nombre de la tabla en DynamoDB para las estadísticas
    Item: {
      type: "redirectionCount",
      timestamp: new Date().toISOString(),
      shortUrl,
    },
  };

  try {
    await docClient.put(params).promise();
  } catch (error) {
    console.error("Error al guardar las estadísticas:", error);
    // Manejo de errores, por ejemplo, reintentar o guardar en un registro de errores
  }
}

// Función para registrar estadísticas de solicitudes de corte para una longUrl
export async function logLongUrlCutRequestsStats(longUrl) {
  const params = {
    TableName: "Stats", // Cambiar por el nombre de la tabla en DynamoDB para las estadísticas
    Item: {
      type: "cutRequests",
      timestamp: new Date().toISOString(),
      longUrl,
    },
  };

  try {
    await docClient.put(params).promise();
  } catch (error) {
    console.error("Error al guardar las estadísticas:", error);
    // Manejo de errores, por ejemplo, reintentar o guardar en un registro de errores
  }
}

