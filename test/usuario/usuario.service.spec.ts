import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioService } from '../../src/usuario/usuario.service';
import { UsuarioRepository } from '../../src/usuario/usuario.repository';
import { CidadeService } from '../../src/cidade/cidade.service';
import { ContatoService } from '../../src/contato/contato.service';
import { EmpresaService } from '../../src/empresa/empresa.service';
import { UsuarioContatoRepository } from '../../src/usuario/usuario-contato.repository';
import { UsuarioEmpresaFilialRepository } from '../../src/usuario/usuario-empresa-filial.repository';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Usuario } from '../../src/entities/usuario/usuario.entity';
import { UsuarioCreateRequestDto } from '../../src/usuario/dto/usuario-create-request.dto';
import { UsuarioUpdateRequestDto } from '../../src/usuario/dto/usuario-update-request.dto';
import * as bcrypt from 'bcryptjs';

describe('UsuarioService', () => {
  let service: UsuarioService;

  const mockUsuarioRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    persistAndFlush: jest.fn(),
    flush: jest.fn(),
  };

  const mockCidadeService = {
    findByCodigoIbge: jest.fn(),
    findByCliente: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockContatoService = {
    exists: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findByCliente: jest.fn(),
    update: jest.fn(),
  };

  const mockEmpresaService = {
    findOne: jest.fn(),
  };

  const mockUsuarioContatoRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    remove: jest.fn(),
    persistAndFlush: jest.fn(),
  };

  const mockUsuarioEmpresaFilialRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    persistAndFlush: jest.fn(),
    removeAndFlush: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuarioService,
        {
          provide: 'UsuarioRepository',
          useValue: mockUsuarioRepository,
        },
        {
          provide: CidadeService,
          useValue: mockCidadeService,
        },
        {
          provide: ContatoService,
          useValue: mockContatoService,
        },
        {
          provide: EmpresaService,
          useValue: mockEmpresaService,
        },
        {
          provide: 'UsuarioContatoRepository',
          useValue: mockUsuarioContatoRepository,
        },
        {
          provide: UsuarioEmpresaFilialRepository,
          useValue: mockUsuarioEmpresaFilialRepository,
        },
      ],
    }).compile();

    service = module.get<UsuarioService>(UsuarioService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar um usuário com sucesso', async () => {
      const dto: UsuarioCreateRequestDto = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: 'senha123',
        cargo: 'Desenvolvedor',
        login: 'joao.silva',
        telefone: '11999999999',
        ativo: true,
      };

      const usuario = new Usuario();
      usuario.id = 'usuario-id';
      usuario.email = dto.email;
      usuario.nome = dto.nome;

      mockUsuarioRepository.findOne.mockResolvedValue(null); // exists check
      mockUsuarioRepository.create.mockReturnValue(usuario);
      mockUsuarioRepository.findOne.mockResolvedValueOnce(null); // exists
      mockUsuarioRepository.findOne.mockResolvedValueOnce(usuario); // findByEmail

      const result = await service.create(dto);

      expect(mockUsuarioRepository.create).toHaveBeenCalled();
      expect(mockUsuarioRepository.persistAndFlush).toHaveBeenCalled();
    });

    it('deve lançar erro se email já existe', async () => {
      const dto: UsuarioCreateRequestDto = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: 'senha123',
        cargo: 'Desenvolvedor',
        login: 'joao.silva',
        telefone: '11999999999',
        ativo: true,
      };

      const usuarioExistente = new Usuario();
      usuarioExistente.email = dto.email;

      mockUsuarioRepository.findOne.mockResolvedValue(usuarioExistente);

      await expect(service.create(dto)).rejects.toThrow(
        new BadRequestException('Email já existe'),
      );
    });

    it('deve hashear a senha do usuário', async () => {
      const dto: UsuarioCreateRequestDto = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: 'senha123',
        cargo: 'Desenvolvedor',
        login: 'joao.silva',
        telefone: '11999999999',
        ativo: true,
      };

      const usuario = new Usuario();
      usuario.id = 'usuario-id';
      usuario.email = dto.email;

      mockUsuarioRepository.findOne.mockResolvedValueOnce(null);
      mockUsuarioRepository.create.mockReturnValue(usuario);
      mockUsuarioRepository.findOne.mockResolvedValueOnce(usuario);

      const result = await service.create(dto);

      expect(usuario.senha).toBeDefined();
      expect(usuario.senha).not.toBe('senha123');
      const isValidPassword = await bcrypt.compare('senha123', usuario.senha);
      expect(isValidPassword).toBe(true);
    });
  });

  describe('update', () => {
    it('deve atualizar um usuário com sucesso', async () => {
      const usuarioId = 'usuario-id';
      const dto: UsuarioUpdateRequestDto = {
        nome: 'João Silva Atualizado',
        cargo: 'Gerente',
      };

      const usuario = new Usuario();
      usuario.id = usuarioId;
      usuario.nome = 'João Silva';
      usuario.cargo = 'Desenvolvedor';

      mockUsuarioRepository.findOne.mockResolvedValue(usuario);

      const result = await service.update(usuarioId, dto);

      expect(usuario.nome).toBe(dto.nome);
      expect(usuario.cargo).toBe(dto.cargo);
      expect(mockUsuarioRepository.flush).toHaveBeenCalled();
    });

    it('deve lançar erro se usuário não encontrado', async () => {
      const usuarioId = 'usuario-inexistente';
      const dto: UsuarioUpdateRequestDto = {
        nome: 'João Silva',
      };

      mockUsuarioRepository.findOne.mockResolvedValue(null);

      await expect(service.update(usuarioId, dto)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });

    it('deve atualizar a senha se fornecida', async () => {
      const usuarioId = 'usuario-id';
      const dto: UsuarioUpdateRequestDto = {
        senha: 'novaSenha123',
      };

      const usuario = new Usuario();
      usuario.id = usuarioId;
      usuario.senha = 'senhaAntigaHash';

      mockUsuarioRepository.findOne.mockResolvedValue(usuario);

      await service.update(usuarioId, dto);

      expect(usuario.senha).not.toBe('senhaAntigaHash');
      expect(usuario.senha).not.toBe('novaSenha123');
      const isValidPassword = await bcrypt.compare(
        'novaSenha123',
        usuario.senha,
      );
      expect(isValidPassword).toBe(true);
    });
  });

  describe('getByEmail', () => {
    it('deve retornar usuário por email', async () => {
      const email = 'joao@teste.com';
      const usuario: any = {
        id: 'usuario-id',
        email: email,
        ativo: true,
        empresasFiliais: {
          getItems: () => [],
        },
      };

      mockUsuarioRepository.findOne.mockResolvedValue(usuario);

      const result = await service.getByEmail(email);

      expect(result).toEqual(usuario);
      expect(mockUsuarioRepository.findOne).toHaveBeenCalledWith({
        email,
        ativo: true,
      });
    });

    it('deve lançar erro se usuário não encontrado', async () => {
      const email = 'inexistente@teste.com';

      mockUsuarioRepository.findOne.mockResolvedValue(null);

      await expect(service.getByEmail(email)).rejects.toThrow(
        new NotFoundException('Usuario not found'),
      );
    });
  });

  describe('getById', () => {
    it('deve retornar usuário por id', async () => {
      const usuarioId = 'usuario-id';
      const usuario = new Usuario();
      usuario.id = usuarioId;
      usuario.ativo = true;

      mockUsuarioRepository.findOne.mockResolvedValue(usuario);

      const result = await service.getById(usuarioId);

      expect(result).toEqual(usuario);
      expect(mockUsuarioRepository.findOne).toHaveBeenCalledWith({
        id: usuarioId,
        ativo: true,
      });
    });

    it('deve lançar erro se usuário não encontrado', async () => {
      const usuarioId = 'usuario-inexistente';

      mockUsuarioRepository.findOne.mockResolvedValue(null);

      await expect(service.getById(usuarioId)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });
  });

  describe('exists', () => {
    it('deve retornar true se usuário existe', async () => {
      const email = 'joao@teste.com';
      const usuario = new Usuario();
      usuario.email = email;

      mockUsuarioRepository.findOne.mockResolvedValue(usuario);

      const result = await service.exists(email);

      expect(result).toBe(true);
    });

    it('deve retornar false se usuário não existe', async () => {
      const email = 'inexistente@teste.com';

      mockUsuarioRepository.findOne.mockResolvedValue(null);

      const result = await service.exists(email);

      expect(result).toBe(false);
    });
  });

  describe('findOne', () => {
    it('deve retornar usuário por id', async () => {
      const usuarioId = 'usuario-id';
      const usuario = new Usuario();
      usuario.id = usuarioId;

      mockUsuarioRepository.findOne.mockResolvedValue(usuario);

      const result = await service.findOne(usuarioId);

      expect(result).toEqual(usuario);
    });

    it('deve lançar erro se usuário não encontrado', async () => {
      const usuarioId = 'usuario-inexistente';

      mockUsuarioRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(usuarioId)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });
  });

  describe('associarEmpresaOuFilial', () => {
    it('deve lançar erro se usuário não encontrado', async () => {
      const usuarioId = 'usuario-inexistente';
      const dto = { empresaId: 'empresa-id' };

      mockUsuarioRepository.findOne.mockResolvedValue(null);

      await expect(
        service.associarEmpresaOuFilial(usuarioId, dto, 'admin-id'),
      ).rejects.toThrow(new NotFoundException('Usuário não encontrado'));
    });

    it('deve lançar erro se empresa não encontrada', async () => {
      const usuarioId = 'usuario-id';
      const dto = { empresaId: 'empresa-inexistente' };

      const usuario = new Usuario();
      usuario.id = usuarioId;

      mockUsuarioRepository.findOne.mockResolvedValue(usuario);
      mockEmpresaService.findOne.mockResolvedValue(null);

      await expect(
        service.associarEmpresaOuFilial(usuarioId, dto, 'admin-id'),
      ).rejects.toThrow(new NotFoundException('Empresa não encontrada'));
    });

    it('deve lançar erro se associação já existe', async () => {
      const usuarioId = 'usuario-id';
      const dto = { empresaId: 'empresa-id' };

      const usuario = new Usuario();
      usuario.id = usuarioId;

      const empresa: any = { id: 'empresa-id', sede: null };
      const associacaoExistente: any = { usuario, empresa };

      mockUsuarioRepository.findOne.mockResolvedValue(usuario);
      mockEmpresaService.findOne.mockResolvedValue(empresa);
      mockCidadeService.findByCliente.mockResolvedValue({ id: 'cidade-id' });
      mockContatoService.findByCliente.mockResolvedValue({ id: 'contato-id' });
      mockUsuarioEmpresaFilialRepository.findOne.mockResolvedValue(
        associacaoExistente,
      );

      await expect(
        service.associarEmpresaOuFilial(usuarioId, dto, 'admin-id'),
      ).rejects.toThrow(new BadRequestException('Associação já existe'));
    });
  });

  describe('listarAssociacoes', () => {
    it('deve retornar lista de associações do usuário', async () => {
      const usuarioId = 'usuario-id';
      const usuario = new Usuario();
      usuario.id = usuarioId;

      const associacoes = [
        { usuario, empresa: { id: 'empresa-1' } },
        { usuario, empresa: { id: 'empresa-2' } },
      ];

      mockUsuarioRepository.findOne.mockResolvedValue(usuario);
      mockUsuarioEmpresaFilialRepository.find.mockResolvedValue(associacoes);

      const result = await service.listarAssociacoes(usuarioId);

      expect(result).toEqual(associacoes);
      expect(result).toHaveLength(2);
    });

    it('deve lançar erro se usuário não encontrado', async () => {
      const usuarioId = 'usuario-inexistente';

      mockUsuarioRepository.findOne.mockResolvedValue(null);

      await expect(service.listarAssociacoes(usuarioId)).rejects.toThrow(
        new NotFoundException('Usuário não encontrado'),
      );
    });
  });

  describe('removerAssociacao', () => {
    it('deve remover associação com sucesso', async () => {
      const usuarioId = 'usuario-id';
      const assocId = 'assoc-id';

      const usuario = new Usuario();
      usuario.id = usuarioId;

      const associacao: any = { id: assocId, usuario };

      mockUsuarioRepository.findOne.mockResolvedValue(usuario);
      mockUsuarioEmpresaFilialRepository.findOne.mockResolvedValue(associacao);

      await service.removerAssociacao(usuarioId, assocId);

      expect(
        mockUsuarioEmpresaFilialRepository.removeAndFlush,
      ).toHaveBeenCalledWith(associacao);
    });

    it('deve lançar erro se associação não encontrada', async () => {
      const usuarioId = 'usuario-id';
      const assocId = 'assoc-inexistente';

      const usuario = new Usuario();
      usuario.id = usuarioId;

      mockUsuarioRepository.findOne.mockResolvedValue(usuario);
      mockUsuarioEmpresaFilialRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removerAssociacao(usuarioId, assocId),
      ).rejects.toThrow(new NotFoundException('Associação não encontrada'));
    });
  });
});
