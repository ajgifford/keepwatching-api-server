import { HTTPHeaders, SensitiveKeys, SpecialMessages } from './loggerModel';
import { Request, Response } from 'express';

export const formatHTTPLoggerResponse = (req: Request, res: Response, responseBody: any, requestStartTime?: number) => {
  let requestDuration = '.';

  if (requestStartTime) {
    const endTime = Date.now() - requestStartTime;
    requestDuration = `${endTime / 1000}s`; // ms to s
  }
  return {
    request: {
      headers: req.headers,
      host: req.headers.host,
      baseUrl: req.baseUrl,
      url: req.url,
      method: req.method,
      body: redactLogData(req.body),
      params: req?.params,
      query: req?.query,
      clientIp: req?.headers[HTTPHeaders.ForwardedFor] ?? req?.socket.remoteAddress,
    },
    response: {
      headers: res.getHeaders(),
      statusCode: res.statusCode,
      requestDuration,
      body: redactLogData(responseBody),
    },
  };
};

const sensitiveKeysList = Object.values(SensitiveKeys) as string[];
const redactLogData = (data: any): any => {
  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map((item) => redactLogData(item));
    }

    const redactedData: any = {};
    for (const key in data) {
      if (sensitiveKeysList.includes(key)) {
        redactedData[key] = SpecialMessages.Redacted;
      } else {
        // Recursively redact sensitive keys within nested objects
        redactedData[key] = redactLogData(data[key]);
      }
    }

    return redactedData;
  } else {
    return data;
  }
};
