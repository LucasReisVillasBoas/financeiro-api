import { Entity, PrimaryKey, ManyToOne, Property, Index } from '@mikro-orm/core';
import { Empresa } from '../empresa/empresa.entity';
import { Usuario } from '../usuario/usuario.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UsuarioEmpresaFilialRepository } from '../../usuario/usuario-empresa-filial.repository';

@Entity({ repository: () => UsuarioEmpresaFilialRepository })
export class UsuarioEmpresaFilial {
  @Expose()
  @ApiProperty()
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Expose()
  @ApiProperty({ description: 'Usuário associado' })
  @Index()
  @ManyToOne(() => Usuario)
  usuario!: Usuario;

  @Expose()
  @ApiProperty({ description: 'Empresa associada' })
  @Index()
  @ManyToOne(() => Empresa)
  empresa!: Empresa;

  @Expose()
  @ApiProperty({ description: 'Indica se é filial', default: false })
  @Property({ type: 'boolean', default: false })
  filial: boolean = false;

  @Expose()
  @ApiProperty()
  @Property({ onCreate: () => new Date() })
  criadoEm!: Date;

  @Expose()
  @ApiProperty()
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  atualizadoEm!: Date;
}
