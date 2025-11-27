#!/bin/bash

###############################################################################
# Script de Geração de Certificados SSL Self-Signed para Desenvolvimento
#
# IMPORTANTE: Estes certificados são APENAS para desenvolvimento local!
# NÃO use em produção. Em produção, use certificados de uma CA válida
# (Let's Encrypt, DigiCert, etc.)
###############################################################################

set -e

echo "🔐 Gerando Certificados SSL Self-Signed para Desenvolvimento..."
echo ""

# Criar diretório para certificados
CERT_DIR="./ssl"
mkdir -p "$CERT_DIR"

# Configurações do certificado
CERT_DAYS=365
CERT_COUNTRY="BR"
CERT_STATE="SP"
CERT_CITY="Sao Paulo"
CERT_ORG="Financeiro API Dev"
CERT_CN="localhost"

# Arquivo de configuração OpenSSL para SANs
cat > "$CERT_DIR/openssl.cnf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
x509_extensions = v3_req
distinguished_name = dn

[dn]
C = $CERT_COUNTRY
ST = $CERT_STATE
L = $CERT_CITY
O = $CERT_ORG
CN = $CERT_CN

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Gerar chave privada
echo "📝 Gerando chave privada..."
openssl genrsa -out "$CERT_DIR/server.key" 2048

# Gerar certificado self-signed
echo "📜 Gerando certificado self-signed..."
openssl req \
  -new \
  -x509 \
  -key "$CERT_DIR/server.key" \
  -out "$CERT_DIR/server.cert" \
  -days $CERT_DAYS \
  -config "$CERT_DIR/openssl.cnf"

# Remover arquivo de configuração temporário
rm "$CERT_DIR/openssl.cnf"

# Definir permissões corretas
chmod 600 "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/server.cert"

echo ""
echo "✅ Certificados SSL gerados com sucesso!"
echo ""
echo "📁 Localização dos certificados:"
echo "   - Chave Privada: $CERT_DIR/server.key"
echo "   - Certificado:   $CERT_DIR/server.cert"
echo ""
echo "⚙️  Para habilitar HTTPS na aplicação, atualize seu .env:"
echo ""
echo "   ENABLE_HTTPS=true"
echo "   SSL_KEY_PATH=./ssl/server.key"
echo "   SSL_CERT_PATH=./ssl/server.cert"
echo ""
echo "⚠️  IMPORTANTE: Estes certificados são self-signed e irão gerar"
echo "   avisos de segurança no navegador. Isso é normal em desenvolvimento."
echo ""
echo "💡 Para aceitar o certificado no navegador:"
echo "   1. Acesse https://localhost:3000"
echo "   2. Clique em 'Avançado' ou 'Advanced'"
echo "   3. Clique em 'Continuar para localhost' ou 'Proceed to localhost'"
echo ""
echo "🚀 Para iniciar a aplicação com HTTPS:"
echo "   npm run start:dev"
echo ""
