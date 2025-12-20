import { Injectable, BadRequestException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { OnboardingEmpresaDto } from './dto/onboarding-empresa.dto';
import { Empresa } from '../entities/empresa/empresa.entity';
import { Perfil } from '../entities/perfil/perfil.entity';
import { Contato } from '../entities/contato/contato.entity';
import { UsuarioPerfil } from '../entities/usuario-perfil/usuario-perfil.entity';
import { UsuarioEmpresaFilial } from '../entities/usuario-empresa-filial/usuario-empresa-filial.entity';
import { Usuario } from '../entities/usuario/usuario.entity';
import { normalizeCnpjCpf } from '../utils/empresa.util';

export interface OnboardingResult {
  empresa: Empresa;
  perfil: Perfil;
  contato: Contato;
}

@Injectable()
export class OnboardingService {
  constructor(private readonly em: EntityManager) {}

  async onboardEmpresa(
    dto: OnboardingEmpresaDto,
    usuarioId: string,
  ): Promise<OnboardingResult> {
    // Usar transação para garantir atomicidade
    return await this.em.transactional(async (em) => {
      // 1. Buscar usuário
      const usuario = await em.findOne(Usuario, { id: usuarioId });
      if (!usuario) {
        throw new BadRequestException('Usuário não encontrado');
      }

      const clienteId = usuarioId;

      // 2. Validar se já existe empresa com este CNPJ/CPF para o cliente
      const cnpjNorm = normalizeCnpjCpf(dto.empresa.cnpj_cpf);
      const empresaExistente = await em.findOne(Empresa, {
        cliente_id: clienteId,
        cnpj_cpf: cnpjNorm,
        ativo: true,
      });

      if (empresaExistente) {
        throw new BadRequestException(
          'Já existe uma empresa com este CNPJ/CPF cadastrada',
        );
      }

      // 3. Criar empresa
      const empresa = em.create(Empresa, {
        ...dto.empresa,
        cliente_id: clienteId,
        cnpj_cpf: cnpjNorm,
        ativo: true,
      });
      em.persist(empresa);

      // 4. Criar perfil
      const perfil = em.create(Perfil, {
        clienteId: clienteId,
        nome: dto.perfil.nome,
        permissoes: dto.perfil.permissoes,
        ativo: true,
      });
      em.persist(perfil);

      // 5. Criar contato
      const contato = em.create(Contato, {
        nome: dto.contato.nome,
        email: dto.contato.email,
        funcao: dto.contato.funcao || '',
        telefone: dto.contato.telefone || '',
        celular: dto.contato.celular || '',
        cliente: usuario,
      });
      em.persist(contato);

      // 6. Associar usuário ao perfil e empresa
      const usuarioPerfil = em.create(UsuarioPerfil, {
        usuario: usuario,
        perfil: perfil,
        empresa: empresa,
        ativo: true,
      });
      em.persist(usuarioPerfil);

      // 7. Associar usuário à empresa
      const usuarioEmpresa = em.create(UsuarioEmpresaFilial, {
        usuario: usuario,
        empresa: empresa,
        filial: false,
      });
      em.persist(usuarioEmpresa);

      // 8. Flush tudo de uma vez (dentro da transação)
      await em.flush();

      return {
        empresa,
        perfil,
        contato,
      };
    });
  }
}
