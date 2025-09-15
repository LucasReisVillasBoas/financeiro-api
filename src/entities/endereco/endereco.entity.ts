import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EnderecoRepository } from '../../endereco/endereco.repository';

@Entity({ repository: () => EnderecoRepository })
export class Endereco {
  @Expose()
  @ApiProperty()
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Expose()
  @ApiProperty()
  @Property({ length: 8 })
  cep!: string;

  @Expose()
  @ApiProperty()
  @Property({ length: 60 })
  logradouro!: string;

  @Expose()
  @ApiProperty()
  @Property({ length: 60 })
  numero!: string;

  @Expose()
  @ApiProperty()
  @Property({ length: 60 })
  bairro!: string;

  @Expose()
  @ApiProperty({ nullable: true })
  @Property({ length: 60, nullable: true })
  complemento?: string;

  @Expose()
  @ApiProperty()
  @Property({ length: 60 })
  cidade!: string;

  @Expose()
  @ApiProperty()
  @Property({ length: 7 })
  codigoIbge!: string;

  @Expose()
  @ApiProperty()
  @Property({ length: 2 })
  uf!: string;

  @Expose()
  @ApiProperty({ default: true })
  @Property({ default: true })
  ativo: boolean = true;

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
