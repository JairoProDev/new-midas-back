import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCors from '@fastify/cors';
import secureSession from '@fastify/secure-session';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  const configService = app.get(ConfigService);
  const jwtSecret = configService.get<string>('JWT_SECRET');
  const sessionSecret = configService.get<string>('SESSION_SECRET');

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }

  if (!sessionSecret) {
    throw new Error('SESSION_SECRET is not defined');
  }

  // Enable CORS
  await app.register(fastifyCors, {
    origin: [configService.get('FRONTEND_URL')],
    credentials: true,
  });

  // Enable secure sessions
  await app.register(secureSession, {
    secret: Buffer.from(sessionSecret, 'base64'), // Ajuste aquí para asegurar que se use 'base64'
    salt: 'mq9hDxBVDbspDR6n',
    cookieName: 'sessionId',
    cookie: {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    },
  });

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('Authentication API')
    .setDescription('API documentation for the authentication system')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get('PORT', 3001);
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
