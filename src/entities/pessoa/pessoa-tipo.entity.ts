import {
  Entity,
  PrimaryKey,
  Property,
  ManyToOne,
  Index,
  Unique,
  Enum,
} from '@mikro-orm/core';
import { Pessoa } from './pessoa.entity';
import { TipoPessoa } from './tipo-pessoa.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

@Entity({ tableName: 'pessoa_tipo' })
@Unique({ properties: ['pessoa', 'tipo'] })
export class PessoaTipo {
  @Expose()
  @ApiProperty()
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Index()
  @ManyToOne(() => Pessoa)
  pessoa!: Pessoa;

  @Expose()
  @ApiProperty({ enum: TipoPessoa })
  @Index()
  @Enum(() => TipoPessoa)
  @Property({ type: 'enum' })
  tipo!: TipoPessoa;

  @Expose()
  @ApiProperty()
  @Property()
  criadoEm!: Date;
}
