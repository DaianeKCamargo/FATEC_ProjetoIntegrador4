# Testes das APIs no Postman

## Importar

1. No Postman, selecione **Import**.
2. Importe `FATEC_ProjetoIntegrador4.postman_collection.json`.
3. Importe `FATEC_ProjetoIntegrador4.postman_environment.json`.
4. Selecione o environment **FATEC APIs**.
5. Revise as URLs e credenciais antes de enviar as requisições.

As requisições incluem testes de status e formato da resposta. As operações de criação salvam IDs no environment para que as próximas chamadas possam reutilizá-los.

## Configuração

Os endereços de produção registrados no projeto estão preenchidos para pontos de coleta, doações e WebSocket. Os demais serviços usam endereços locais por padrão; altere as variáveis `*_base_url` para os endereços de sua implantação se necessário.

Para autenticação, informe `admin_username`, `admin_password` e `admin_email` de um administrador já cadastrado. Faça **Login de administrador** antes das requisições protegidas. O cadastro de novo administrador também precisa desse JWT. Troque `new_admin_username` e `new_admin_email` se for executar o cadastro mais de uma vez.

O token de recuperação não é extraído automaticamente do e-mail: após **Solicitar token por e-mail**, copie o token recebido e preencha `reset_token` antes de executar **Validar token recebido** e **Redefinir senha**. Esse fluxo depende da conta de e-mail e do serviço de envio estarem configurados.

O cadastro de animal e os registros manuais de tampinhas criam dados persistentes. A pasta não contém uma rota para excluir registros manuais de tampinhas. As requisições de exemplo para animais criam, atualizam e excluem um registro.

## Ordem sugerida

1. **Pontos de coleta → Listar pontos aprovados** para preencher `collection_point_id`; depois execute **Buscar ponto por ID**.
2. **Autenticação e administradores → Login de administrador**; depois teste `/api/admin/me`, listagem, cadastro e edição.
3. Execute as requisições de **Cadastro de animais**, **Dashboard de tampinhas** e **Registro de doações**.
4. Para recuperação de senha, solicite o token, copie-o do e-mail e execute validação e redefinição.
5. Para testar a leitura da balança por HTTP, conecte um cliente WebSocket primeiro e então envie **Enviar leitura de peso**.

## Testar o WebSocket da balança

No Postman, crie uma requisição **WebSocket** e conecte-se a:

```text
{{weight_ws_url}}/?pontoId={{donation_point_id}}
```

Uma conexão ativa inicia uma sessão exclusiva para aquele `pontoId`. Com ela conectada, envie a requisição HTTP **Balança - HTTP → Enviar leitura de peso**, usando o mesmo `donation_point_id`; a leitura será encaminhada ao WebSocket. A sessão tem limite de dois minutos e aceita apenas uma conexão de pesagem ativa por ponto.

## O que cada grupo testa

- **Cadastro de animais:** listar, criar, consultar, atualizar e excluir.
- **Autenticação e administradores:** health, login/JWT, rota autenticada e operações administrativas.
- **Recuperação de senha:** solicitar e validar token e redefinir senha.
- **Pontos de coleta:** listar pontos aprovados e buscar por ID.
- **Dashboard de tampinhas:** listar histórico e cadastrar registro manual.
- **Registro de doações:** registrar doação, consultar por ID e buscar a última por ponto.
- **Serviço de e-mail:** health e envio de token de teste.
- **Balança:** health do serviço/banco e envio de leitura por HTTP; conexão WebSocket testada separadamente.
