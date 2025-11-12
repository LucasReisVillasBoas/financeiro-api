import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsuarioModule } from '../usuario/usuario.module';
import { EmpresaGuard } from './empresa.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [ConfigModule, PassportModule, UsuarioModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, EmpresaGuard],
  exports: [JwtAuthGuard, EmpresaGuard],
})
export class AuthModule {}
