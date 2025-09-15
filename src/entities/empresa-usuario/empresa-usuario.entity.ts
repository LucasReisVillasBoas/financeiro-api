import {
  Entity,
  PrimaryKey,
  ManyToOne,
  Property,
  Index,
} from '@mikro-orm/core';
import { Empresa } from '../empresa/empresa.entity';
import { Usuario } from '../usuario/usuario.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

@Entity()
export class EmpresaUsuario {
  @Expose()
  @ApiProperty()
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Expose()
  @ApiProperty()
  @Index()
  @ManyToOne(() => Empresa)
  empresa!: Empresa;

  @Expose()
  @ApiProperty()
  @Index()
  @ManyToOne(() => Usuario)
  usuario!: Usuario;

  @Expose()
  @ApiProperty()
  @Property({ onCreate: () => new Date() })
  criadoEm!: Date;

  @Expose()
  @ApiProperty()
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  atualizadoEm!: Date;
}
