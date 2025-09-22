import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from 'src/usuario/usuario.service';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/core';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private usuarioService: UsuarioService,
    private readonly em: EntityManager,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    await RequestContext.create(this.em, async () => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];

      try {
        const payload = await this.jwtService.verifyAsync(token);

        const user = await this.usuarioService.getById(payload.sub);

        if (!user) {
          return res.status(401).json({ message: 'Unauthorized' });
        }

        req['user'] = user;
        next();
      } catch (error) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    });
  }
}
