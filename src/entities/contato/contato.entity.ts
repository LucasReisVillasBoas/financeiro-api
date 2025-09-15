import {
  Entity,
  PrimaryKey,
  Property,
  Index,
  ManyToOne,
} from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { TipoContato } from './tipo-contato.entity';

@Entity()
export class Contato {
  @Expose()
  @ApiProperty()
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Expose()
  @ApiProperty()
  @Property({ length: 50 })
  @Index()
  entityType!: string; // ex: 'empresa' ou 'pessoa'

  @Expose()
  @ApiProperty()
  @Index()
  @Property()
  entityId!: number;

  @Expose()
  @ApiProperty()
  @ManyToOne(() => TipoContato)
  tipoContato!: TipoContato;

  @Expose()
  @ApiProperty()
  @Property({ length: 100 })
  descricao!: string;

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
