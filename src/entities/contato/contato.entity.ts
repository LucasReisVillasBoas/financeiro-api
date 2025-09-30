import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { TipoContato } from './tipo-contato.entity';
import { ContatoRepository } from '../../contato/contato.repository';
import { IsOptional, IsString } from 'class-validator';
import { Usuario } from '../usuario/usuario.entity';
import { Empresa } from '../empresa/empresa.entity';

@Entity({ repository: () => ContatoRepository })
export class Contato {
  @Expose()
  @ApiProperty()
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Expose()
  @IsString()
  @Property()
  nome!: string;

  @Expose()
  @ManyToOne(() => Usuario, { nullable: true })
  cliente?: Usuario;

  @Expose()
  @IsOptional()
  @ManyToOne(() => Empresa, { nullable: true })
  filial?: Empresa;

  @Expose()
  @IsString()
  @Property()
  funcao!: string;

  @Expose()
  @IsString()
  @Property()
  telefone!: string;

  @Expose()
  @IsString()
  @Property()
  celular!: string;

  @Expose()
  @IsString()
  @Property()
  email!: string;

  @Property({ nullable: true })
  deletadoEm?: Date;

  @Expose()
  @ApiProperty()
  @Property({ onCreate: () => new Date() })
  criadoEm!: Date;

  @Expose()
  @ApiProperty()
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  atualizadoEm!: Date;
}
