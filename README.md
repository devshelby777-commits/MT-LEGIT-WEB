# MT LEGIT Web

Site do estúdio com uma área administrativa para organizar leads, clientes, projetos, propostas, faturas, receitas, despesas, tarefas, manutenção e domínios. A identidade visual combina preto, vermelho e detalhes tecnológicos em azul, com linguagem minimalista.

## Abrir localmente

Sirva esta pasta como site estático. Por exemplo, com Python:

```powershell
python -m http.server 8000 --directory .
```

## Estado atual

- A base começa vazia. Não há clientes, projetos ou valores fictícios.
- A identidade visual usa as logos MT LEGIT e movimento discreto na Visão geral; animações respeitam a preferência do sistema por movimento reduzido.
- As imagens da marca ficam em `assets/` e são servidas localmente junto com o site.
- Clientes incluem telefone/WhatsApp, e-mail e site; registros podem ser editados e removidos.
- Anexos ficam no IndexedDB do navegador; calendários mostram prazos cadastrados.
- Registros ficam no `localStorage` do navegador atual. O painel não sincroniza entre dispositivos.
- Ainda não há autenticação, banco de dados compartilhado, emissão fiscal ou processamento de pagamentos.
- Não cadastre senhas, tokens ou dados bancários no painel.
