import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Usuario } from '../entities/usuario/usuario.entity';
import { UsuarioRepository } from './usuario.repository';
import { UsuarioCreateRequestDto } from './dto/usuario-create-request.dto';
import { UsuarioUpdateRequestDto } from './dto/usuario-update-request.dto';
import * as bcrypt from 'bcryptjs';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { EmpresaService } from '../empresa/empresa.service';
import { UsuarioEmpresaFilialRepository } from './usuario-empresa-filial.repository';
import { AssociarEmpresaFilialRequestDto } from './dto/associar-empresa-filial-request.dto';
import { InjectRepository } from '@mikro-orm/nestjs';
import { UsuarioContato } from '../entities/usuario-contato/usuario-contato.entity';
import { CidadeService } from '../cidade/cidade.service';
import { UsuarioContatoRepository } from './usuario-contato.repository';
import { ContatoService } from '../contato/contato.service';
import { Contato } from '../entities/contato/contato.entity';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: UsuarioRepository,
    private readonly cidadeService: CidadeService,
    private readonly contatoService: ContatoService,
    @InjectRepository(UsuarioContato)
    private readonly usuarioContatoRepository: UsuarioContatoRepository,
    private readonly empresaService: EmpresaService,
    private readonly usuarioEmpresaFilialRepository: UsuarioEmpresaFilialRepository,
  ) {}

  async create(dto: UsuarioCreateRequestDto): Promise<Usuario> {
    if (await this.exists(dto.email)) {
      throw new BadRequestException('Email já existe');
    }

    const usuario = this.usuarioRepository.create({
      nome: dto.nome,
      cargo: dto.cargo,
      login: dto.login,
      senha: dto.senha,
      telefone: dto.telefone,
      email: dto.email,
      ativo: dto.ativo,
    });
    usuario.senha = await this.hashPassword(dto.senha);

    // Primeiro persiste o usuário para ter o ID
    await this.usuarioRepository.persistAndFlush(usuario);

    if (dto.cidade) {
      let cidade = null;

      // Tenta encontrar por codigoIbge se fornecido
      if (dto.cidade.codigoIbge) {
        cidade = await this.cidadeService.findByCodigoIbge(
          dto.cidade.codigoIbge,
          usuario.id,
        );
      }

      if (!cidade) {
        // Cria a cidade se não existir
        const novaCidade = await this.cidadeService.create({
          clienteId: usuario.id,
          nome: dto.cidade.nome,
          uf: dto.cidade.uf,
          codigoBacen: dto.cidade.codigoBacen,
          codigoIbge: dto.cidade.codigoIbge,
        });
        usuario.cidade = novaCidade;
      } else {
        usuario.cidade = cidade;
      }

      await this.usuarioRepository.flush();
    }

    if (dto.contatos && dto.contatos.length > 0) {
      await this.associarContatos(usuario.id, dto.contatos);
    }

    return usuario;
  }

  async update(id: string, dto: UsuarioUpdateRequestDto): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ id });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { cidadeId, cidade, contatoIds, senha, ...dadosBasicos } = dto;
    Object.assign(usuario, dadosBasicos);

    if (senha) {
      usuario.senha = await this.hashPassword(senha);
    }

    // Tratamento de cidade
    if (cidadeId !== undefined || cidade !== undefined) {
      if (cidadeId === null) {
        // Remove a cidade do usuário
        usuario.cidade = undefined;
      } else if (cidadeId) {
        // Tenta encontrar a cidade pelo ID
        let cidadeEncontrada = null;
        try {
          cidadeEncontrada = await this.cidadeService.findOne(
            cidadeId,
            usuario.id,
          );
        } catch (error) {
          // Cidade não encontrada - será criada se houver dados
        }

        if (cidadeEncontrada) {
          usuario.cidade = cidadeEncontrada;
        } else if (cidade) {
          // Cidade não existe, mas temos dados para criar
          const novaCidade = await this.cidadeService.create({
            clienteId: usuario.id,
            nome: cidade.nome,
            uf: cidade.uf,
            codigoBacen: cidade.codigoBacen,
            codigoIbge: cidade.codigoIbge,
          });
          usuario.cidade = novaCidade;
        } else {
          throw new NotFoundException(
            `Cidade com ID ${cidadeId} não encontrada. Forneça os dados da cidade para criá-la.`,
          );
        }
      } else if (cidade) {
        // Apenas dados da cidade fornecidos (sem ID) - tenta encontrar por codigoIbge ou cria nova
        let cidadeEncontrada = null;

        if (cidade.codigoIbge) {
          cidadeEncontrada = await this.cidadeService.findByCodigoIbge(
            cidade.codigoIbge,
            usuario.id,
          );
        }

        if (cidadeEncontrada) {
          usuario.cidade = cidadeEncontrada;
        } else {
          const novaCidade = await this.cidadeService.create({
            clienteId: usuario.id,
            nome: cidade.nome,
            uf: cidade.uf,
            codigoBacen: cidade.codigoBacen,
            codigoIbge: cidade.codigoIbge,
          });
          usuario.cidade = novaCidade;
        }
      }
    }

    await this.usuarioRepository.flush();

    if (contatoIds !== undefined) {
      await this.atualizarContatos(usuario.id, contatoIds);
    }

    return usuario;
  }

  private async associarContatos(
    usuarioId: string,
    contatos: Contato[],
  ): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ id: usuarioId });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    for (const contato of contatos) {
      const existe = await this.contatoService.exists(
        contato.celular,
        usuario.id,
      );
      if (!existe) {
        const novoContato = await this.contatoService.create({
          clienteId: usuario.id,
          nome: contato.nome,
          funcao: contato.funcao,
          telefone: contato.telefone,
          celular: contato.celular,
          email: contato.email,
        });
        contato.id = novoContato.id;
      }

      const jaAssociado = await this.usuarioContatoRepository.findOne({
        usuario: usuario,
        contato: contato,
      });

      if (!jaAssociado) {
        const usuarioContato = this.usuarioContatoRepository.create({
          usuario: usuario,
          contato: contato,
        });
        usuario.usuarioContatos.add(usuarioContato);
        await this.usuarioRepository.persistAndFlush(usuario);
        await this.usuarioContatoRepository.persistAndFlush(usuarioContato);
      }
    }
  }

  private async atualizarContatos(
    usuarioId: string,
    contatoIds: string[],
  ): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({ id: usuarioId });
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const associacoesAntigas = await this.usuarioContatoRepository.find({
      usuario: usuario,
    });

    for (const associacao of associacoesAntigas) {
      this.usuarioContatoRepository.remove(associacao);
    }

    for (const contatoId of contatoIds) {
      const contato = await this.contatoService.findOne(contatoId, usuario.id);
      if (!contato) {
        throw new NotFoundException(
          `Contato com ID ${contatoId} não encontrado`,
        );
      }

      const usuarioContato = this.usuarioContatoRepository.create({
        usuario: usuario,
        contato: contato,
      });
      await this.usuarioContatoRepository.persistAndFlush(usuarioContato);
    }
  }

  async getByEmail(email: string, empresaId?: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      email,
      ativo: true,
    });
    if (!usuario) throw new NotFoundException('Usuario not found');
    if (
      empresaId &&
      !usuario.empresasFiliais
        .getItems()
        .some((uef) => uef.empresa.id === empresaId)
    ) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return usuario;
  }

  async getById(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ id, ativo: true });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  async exists(email: string): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({
      email,
      ativo: true,
    });
    return !!usuario;
  }

  async findOne(id: string): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({ id, ativo: true });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  async findAll(empresaId: string[]): Promise<Usuario[]> {
    const empresas = [];
    empresaId.map(async (id) => {
      const empresa = await this.empresaService.findOne(id);
      if (empresa) empresas.push(empresa);
    });

    if (!empresas) throw new NotFoundException('Nenhuma não encontrada');

    const associacao = await this.usuarioEmpresaFilialRepository.find(
      { empresa: { id: empresaId } },
      { populate: ['usuario'] },
    );

    const usuarios: Usuario[] = [];
    for (const assoc of associacao) {
      try {
        const usuario = await this.getById(assoc.usuario.id);
        usuarios.push(usuario);
      } catch (error) {}
    }
    return usuarios;
  }
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  async associarEmpresaOuFilial(
    usuarioId: string,
    dto: AssociarEmpresaFilialRequestDto,
    admin: string,
  ): Promise<UsuarioEmpresaFilial> {
    const usuario = await this.usuarioRepository.findOne({
      id: usuarioId,
      ativo: true,
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const empresaOuFilialId = dto.empresaId || dto.filialId;
    if (!empresaOuFilialId) {
      throw new BadRequestException(
        'É necessário fornecer empresaId ou filialId',
      );
    }

    const empresa = await this.empresaService.findOne(empresaOuFilialId);
    if (!empresa) throw new NotFoundException('Empresa não encontrada');

    let cidade = await this.cidadeService.findByCliente(usuario.id);
    if (!cidade) {
      cidade = await this.cidadeService.findByCliente(admin);
      if (!cidade) {
        throw new NotFoundException('Cidade não encontrada para associação');
      }
    }

    const contato = await this.contatoService.findByCliente(usuario.id);
    if (!contato) throw new NotFoundException('Contato não encontrado');

    const isFilial = !!empresa.sede;
    const jaExiste = await this.usuarioEmpresaFilialRepository.findOne({
      usuario,
      empresa,
      filial: isFilial,
    });

    if (jaExiste) {
      throw new BadRequestException('Associação já existe');
    }

    const associacao = this.usuarioEmpresaFilialRepository.create({
      usuario,
      empresa,
      filial: isFilial,
    });

    await this.cidadeService.update(
      cidade.id,
      usuario.id,
      { filialId: empresa.id },
      admin,
    );
    await this.contatoService.update(
      contato.id,
      usuario.id,
      {
        filialId: empresa.id,
      },
      admin,
    );

    await this.usuarioEmpresaFilialRepository.persistAndFlush(associacao);
    return associacao;
  }

  async listarAssociacoes(usuarioId: string): Promise<UsuarioEmpresaFilial[]> {
    const usuario = await this.usuarioRepository.findOne({
      id: usuarioId,
      ativo: true,
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const associacoes = await this.usuarioEmpresaFilialRepository.find(
      { usuario },
      { populate: ['empresa', 'filial'] },
    );

    return associacoes;
  }

  async removerAssociacao(usuarioId: string, assocId: string): Promise<void> {
    const usuario = await this.usuarioRepository.findOne({
      id: usuarioId,
      ativo: true,
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');

    const associacao = await this.usuarioEmpresaFilialRepository.findOne({
      id: assocId,
      usuario,
    });

    if (!associacao) {
      throw new NotFoundException('Associação não encontrada');
    }

    await this.usuarioEmpresaFilialRepository.removeAndFlush(associacao);
  }
}
