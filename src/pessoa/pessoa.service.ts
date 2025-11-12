import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { Pessoa } from '../entities/pessoa/pessoa.entity';
import { Empresa } from '../entities/empresa/empresa.entity';
import { Endereco } from '../entities/endereco/endereco.entity';
import { Usuario } from '../entities/usuario/usuario.entity';
import { Cidade } from '../entities/cidade/cidade.entity';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { PessoaRepository } from './pessoa.repository';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { CreatePessoaCompletoDto } from './dto/create-pessoa-completo.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';
import { FiltroPessoaDto } from './dto/filtro-pessoa.dto';
import {
  AuditService,
  AuditEventType,
  AuditSeverity,
} from '../audit/audit.service';

@Injectable()
export class PessoaService {
  constructor(
    @InjectRepository(Pessoa)
    private readonly pessoaRepository: PessoaRepository,
    private readonly em: EntityManager,
    private readonly auditService: AuditService,
  ) {}

  async createCompleto(
    dto: CreatePessoaCompletoDto,
    usuarioId: string,
    usuarioEmail: string,
  ): Promise<Pessoa> {
    const usuarioEmpresa = await this.em.findOne(
      UsuarioEmpresaFilial,
      {
        usuario: dto.clienteId,
      },
      {
        populate: ['empresa'],
      },
    );

    if (!usuarioEmpresa) {
      throw new NotFoundException('Usuário não possui empresa vinculada');
    }

    const empresaId = usuarioEmpresa.empresa.id;

    const documentoLimpo = dto.cpf_cnpj.replace(/\D/g, '');

    const documentoExistente = await this.pessoaRepository.findOne({
      documento: documentoLimpo,
      empresa: empresaId,
      deletadoEm: null,
    });

    if (documentoExistente) {
      throw new BadRequestException(
        'Já existe uma pessoa com este documento nesta empresa',
      );
    }

    let codigoIbge = dto.codigoIbge;

    if (!codigoIbge) {
      const cidade = await this.em.findOne(Cidade, {
        nome: { $ilike: dto.cidade },
        uf: dto.uf.toUpperCase(),
      });

      codigoIbge = cidade?.codigoIbge || '0000000';
    }

    const endereco = this.em.create('Endereco', {
      cep: dto.cep.replace(/\D/g, ''),
      logradouro: dto.logradouro,
      numero: dto.numero,
      complemento: dto.complemento || null,
      bairro: dto.bairro,
      cidade: dto.cidade,
      codigoIbge,
      uf: dto.uf.toUpperCase(),
    });

    await this.em.persistAndFlush(endereco);

    const empresa = this.em.getReference(Empresa, empresaId);

    const pessoaData: any = {
      empresa,
      endereco,
      razaoNome: dto.nome,
      fantasiaApelido: dto.tipo === 'Física' ? dto.nome : undefined,
      documento: documentoLimpo,
      ieRg: undefined,
      aniversario: undefined,
      email: dto.email,
      telefone: dto.telefone,
      ativo: dto.ativo ?? true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
    };

    if (usuarioId) {
      try {
        pessoaData.criadoPor = this.em.getReference(Usuario, usuarioId);
      } catch (error) {
        // Ignora se não conseguir criar a referência
      }
    }

    const pessoa = this.pessoaRepository.create(pessoaData);

    await this.em.persistAndFlush(pessoa);

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.PESSOA_CREATED,
      severity: AuditSeverity.INFO,
      success: true,
      userId: usuarioId,
      userEmail: usuarioEmail,
      resource: 'pessoas',
      action: 'CREATE',
      details: {
        pessoaId: pessoa.id,
        razaoNome: pessoa.razaoNome,
        documento: pessoa.documento,
        tipo: dto.tipo,
      },
    });

    return pessoa;
  }

  async create(
    dto: CreatePessoaDto,
    usuarioId: string,
    usuarioEmail: string,
  ): Promise<Pessoa> {
    if (!dto.razaoNome && !dto.fantasiaApelido) {
      throw new BadRequestException(
        'Informe ao menos Razão/Nome ou Fantasia/Apelido',
      );
    }

    if (dto.documento) {
      const documentoExistente = await this.pessoaRepository.findOne({
        documento: dto.documento,
        empresa: dto.empresaId,
        deletadoEm: null,
      });

      if (documentoExistente) {
        throw new BadRequestException(
          'Já existe uma pessoa com este documento nesta empresa',
        );
      }
    }

    const empresa = this.em.getReference(Empresa, dto.empresaId);
    const endereco = this.em.getReference(Endereco, dto.enderecoId);
    const criadoPor = this.em.getReference(Usuario, usuarioId);

    const pessoa = this.pessoaRepository.create({
      empresa,
      endereco,
      razaoNome: dto.razaoNome,
      fantasiaApelido: dto.fantasiaApelido,
      documento: dto.documento,
      ieRg: dto.ieRg,
      aniversario: dto.aniversario ? new Date(dto.aniversario) : undefined,
      email: dto.email,
      telefone: dto.telefone,
      ativo: dto.ativo ?? true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      criadoPor,
    });

    await this.em.persistAndFlush(pessoa);

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.PESSOA_CREATED,
      severity: AuditSeverity.INFO,
      success: true,
      userId: usuarioId,
      userEmail: usuarioEmail,
      resource: 'pessoas',
      action: 'CREATE',
      details: {
        pessoaId: pessoa.id,
        razaoNome: pessoa.razaoNome,
        fantasiaApelido: pessoa.fantasiaApelido,
        documento: pessoa.documento,
      },
    });

    return pessoa;
  }

  async findByCliente(clienteId: string): Promise<Pessoa[]> {
    const usuarioEmpresa = await this.em.findOne(
      UsuarioEmpresaFilial,
      {
        usuario: clienteId,
      },
      {
        populate: ['empresa'],
      },
    );

    if (!usuarioEmpresa) {
      throw new NotFoundException('Usuário não possui empresa vinculada');
    }

    const empresaId = usuarioEmpresa.empresa.id;

    return await this.pessoaRepository.find(
      {
        empresa: empresaId,
        deletadoEm: null,
      },
      {
        populate: ['empresa', 'endereco'],
        orderBy: { razaoNome: 'ASC' },
      },
    );
  }

  async findAll(filtro: FiltroPessoaDto): Promise<Pessoa[]> {
    const where: any = { deletadoEm: null };

    if (filtro.empresaId) {
      where.empresa = filtro.empresaId;
    }

    if (filtro.razaoNome) {
      where.razaoNome = { $ilike: `%${filtro.razaoNome}%` };
    }

    if (filtro.fantasiaApelido) {
      where.fantasiaApelido = { $ilike: `%${filtro.fantasiaApelido}%` };
    }

    if (filtro.documento) {
      where.documento = { $ilike: `%${filtro.documento}%` };
    }

    if (filtro.ativo !== undefined) {
      where.ativo = filtro.ativo;
    }

    return await this.pessoaRepository.find(where, {
      populate: ['empresa', 'endereco'],
      orderBy: { razaoNome: 'ASC' },
    });
  }

  async findOne(id: string, empresasUsuario: string[] = []): Promise<Pessoa> {
    const pessoa = await this.pessoaRepository.findOne(
      { id, deletadoEm: null },
      { populate: ['empresa', 'endereco'] },
    );

    if (!pessoa) {
      throw new NotFoundException('Pessoa não encontrada');
    }

    // Validar se o usuário tem acesso à empresa da pessoa
    if (empresasUsuario.length > 0 && pessoa.empresa?.id) {
      const temAcesso = empresasUsuario.includes(pessoa.empresa.id);
      if (!temAcesso) {
        throw new ForbiddenException(
          'Você não tem permissão para acessar pessoas desta empresa',
        );
      }
    }

    return pessoa;
  }

  async update(
    id: string,
    dto: UpdatePessoaDto,
    usuarioId: string,
    usuarioEmail: string,
    empresasUsuario: string[] = [],
  ): Promise<Pessoa> {
    const pessoa = await this.findOne(id, empresasUsuario);

    if (dto.documento) {
      throw new BadRequestException('Não é possível alterar o documento');
    }

    const dadosAntigos = {
      razaoNome: pessoa.razaoNome,
      fantasiaApelido: pessoa.fantasiaApelido,
      documento: pessoa.documento,
      ativo: pessoa.ativo,
    };

    if (dto.empresaId) {
      pessoa.empresa = this.em.getReference(Empresa, dto.empresaId);
    }

    if (dto.enderecoId) {
      pessoa.endereco = this.em.getReference(Endereco, dto.enderecoId);
    }

    if (dto.razaoNome !== undefined) {
      pessoa.razaoNome = dto.razaoNome;
    }

    if (dto.fantasiaApelido !== undefined) {
      pessoa.fantasiaApelido = dto.fantasiaApelido;
    }

    if (dto.documento !== undefined) {
      pessoa.documento = dto.documento;
    }

    if (dto.ieRg !== undefined) {
      pessoa.ieRg = dto.ieRg;
    }

    if (dto.aniversario !== undefined) {
      pessoa.aniversario = dto.aniversario
        ? new Date(dto.aniversario)
        : undefined;
    }

    if (dto.email !== undefined) {
      pessoa.email = dto.email;
    }

    if (dto.telefone !== undefined) {
      pessoa.telefone = dto.telefone;
    }

    if (dto.ativo !== undefined) {
      pessoa.ativo = dto.ativo;
    }

    // Atualizar endereço se houver campos de endereço no DTO
    const hasEnderecoFields =
      dto.cep ||
      dto.logradouro ||
      dto.numero ||
      dto.complemento ||
      dto.bairro ||
      dto.cidade ||
      dto.uf ||
      dto.codigoIbge;

    if (hasEnderecoFields && pessoa.endereco) {
      if (dto.cep !== undefined) {
        pessoa.endereco.cep = dto.cep;
      }
      if (dto.logradouro !== undefined) {
        pessoa.endereco.logradouro = dto.logradouro;
      }
      if (dto.numero !== undefined) {
        pessoa.endereco.numero = dto.numero;
      }
      if (dto.complemento !== undefined) {
        pessoa.endereco.complemento = dto.complemento;
      }
      if (dto.bairro !== undefined) {
        pessoa.endereco.bairro = dto.bairro;
      }
      if (dto.cidade !== undefined) {
        pessoa.endereco.cidade = dto.cidade;
      }
      if (dto.uf !== undefined) {
        pessoa.endereco.uf = dto.uf.toUpperCase();
      }
      if (dto.codigoIbge !== undefined) {
        pessoa.endereco.codigoIbge = dto.codigoIbge;
      }
    }

    pessoa.atualizadoEm = new Date();

    if (usuarioId) {
      try {
        const usuario = await this.em.findOne(Usuario, { id: usuarioId });
        if (usuario) {
          pessoa.atualizadoPor = usuario;
        }
      } catch (error) {
        console.warn(`Usuário ${usuarioId} não encontrado para atualizadoPor`);
      }
    }

    await this.em.flush();

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.PESSOA_UPDATED,
      severity: AuditSeverity.INFO,
      success: true,
      userId: usuarioId,
      userEmail: usuarioEmail,
      resource: 'pessoas',
      action: 'UPDATE',
      details: {
        pessoaId: pessoa.id,
        antes: dadosAntigos,
        depois: {
          razaoNome: pessoa.razaoNome,
          fantasiaApelido: pessoa.fantasiaApelido,
          documento: pessoa.documento,
          ativo: pessoa.ativo,
        },
      },
    });

    return pessoa;
  }

  async remove(
    id: string,
    usuarioId: string,
    usuarioEmail: string,
    empresasUsuario: string[] = [],
  ): Promise<void> {
    // findOne já valida o acesso à empresa
    const pessoa = await this.findOne(id, empresasUsuario);

    const contasPagar = await this.em.count('ContasPagar', {
      pessoa: id,
      deletadoEm: null,
    });

    if (contasPagar > 0) {
      throw new ForbiddenException(
        `Não é possível excluir esta pessoa pois existem ${contasPagar} conta(s) a pagar vinculada(s)`,
      );
    }

    // TODO: Adicionar validação de contas a receber quando o módulo estiver implementado
    // const contasReceber = await this.em.count('ContasReceber', {
    //   pessoa: id,
    //   deletadoEm: null,
    // });

    // if (contasReceber > 0) {
    //   throw new ForbiddenException(
    //     `Não é possível excluir esta pessoa pois existem ${contasReceber} conta(s) a receber vinculada(s)`,
    //   );
    // }

    pessoa.deletadoEm = new Date();
    await this.em.flush();

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.PESSOA_DELETED,
      severity: AuditSeverity.CRITICAL,
      success: true,
      userId: usuarioId,
      userEmail: usuarioEmail,
      resource: 'pessoas',
      action: 'DELETE',
      details: {
        pessoaId: pessoa.id,
        razaoNome: pessoa.razaoNome,
        fantasiaApelido: pessoa.fantasiaApelido,
        documento: pessoa.documento,
      },
    });
  }

  async reativar(
    id: string,
    usuarioId: string,
    usuarioEmail: string,
    empresasUsuario: string[] = [],
  ): Promise<Pessoa> {
    const pessoa = await this.pessoaRepository.findOne(
      { id },
      { populate: ['empresa'] },
    );

    if (!pessoa) {
      throw new NotFoundException('Pessoa não encontrada');
    }

    // Validar se o usuário tem acesso à empresa da pessoa
    if (empresasUsuario.length > 0 && pessoa.empresa?.id) {
      const temAcesso = empresasUsuario.includes(pessoa.empresa.id);
      if (!temAcesso) {
        throw new ForbiddenException(
          'Você não tem permissão para reativar pessoas desta empresa',
        );
      }
    }

    if (!pessoa.deletadoEm) {
      throw new BadRequestException('Esta pessoa não está excluída');
    }

    pessoa.deletadoEm = undefined;
    pessoa.ativo = true;
    pessoa.atualizadoEm = new Date();

    // Apenas atualizar atualizadoPor se o usuário for válido
    if (usuarioId) {
      try {
        const usuario = await this.em.findOne(Usuario, { id: usuarioId });
        if (usuario) {
          pessoa.atualizadoPor = usuario;
        }
      } catch (error) {
        // Ignorar erro se usuário não for encontrado
        console.warn(`Usuário ${usuarioId} não encontrado para atualizadoPor`);
      }
    }

    await this.em.flush();

    await this.auditService.log({
      timestamp: new Date(),
      eventType: AuditEventType.PESSOA_UPDATED,
      severity: AuditSeverity.INFO,
      success: true,
      userId: usuarioId,
      userEmail: usuarioEmail,
      resource: 'pessoas',
      action: 'REACTIVATE',
      details: {
        pessoaId: pessoa.id,
        razaoNome: pessoa.razaoNome,
        fantasiaApelido: pessoa.fantasiaApelido,
      },
    });

    return pessoa;
  }
}
