declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';

  interface SwaggerUiOptions {
    customSiteTitle?: string;
    swaggerOptions?: Record<string, unknown>;
    customCss?: string;
    customfavIcon?: string;
    customJs?: string;
  }

  const serve: RequestHandler[];
  function setup(swaggerDoc: object, options?: SwaggerUiOptions): RequestHandler;

  export { serve, setup };
}
