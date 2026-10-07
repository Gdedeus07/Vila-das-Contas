# Vila das Contas

Jogo 3D de matemática para crianças de 5 a 7 anos (fim da Educação Infantil ao 2º ano). A criança é a nova ajudante da vila e, com o Tico, um tatu-bola, resolve problemas do dia a dia com as quatro operações, sempre mexendo nos objetos antes de ver os números.

**Jogar:** https://gdedeus07.github.io/Vila-das-Contas/

## Como funciona

- **Praça central** como mapa e cinco lugares, liberados em ordem: Padaria (adição), Feira (subtração), Granja (multiplicação), Casa da Lia (divisão) e Ponto de ônibus (revisão com duas operações).
- **Quatro passos em todo problema:** ouvir a história, fazer com os objetos 3D, ver o desenho e escrever a conta.
- **Três níveis:** até 5 com contagem narrada e cartões de pontinhos; até 10 com cartões de algarismo; até 20 (+ e −) e até 10 (× e ÷), começando pelo desenho e montando a conta com peças.
- **Ajuste automático:** 3 acertos seguidos sobem um nível; 2 erros seguidos devolvem um apoio.
- **Dicas em três camadas** e **erro como informação**: o morador reage e os objetos mostram a diferença. Sem vidas, sem cronômetro, sem som de fracasso.
- **Progresso visível:** cada missão enfeita a praça e dá uma figurinha do morador. No fim, a Festa da Vila.
- **Painel do professor:** abre segurando os dois botões ao mesmo tempo (no computador, um botão com o mouse e a tecla Shift). Mostra missões, nível por lugar, acertos por ideia, estratégias e o erro mais comum com sugestão de intervenção. Exporta a turma em planilha.

## Privacidade

Sem anúncios, compras, chat ou coleta de dados pessoais. O progresso fica salvo só no navegador do aparelho.

## Tecnologia

HTML, CSS e JavaScript puros, com [three.js](https://threejs.org/) r128 para o 3D e a voz sintetizada do navegador (pt-BR). Não precisa de instalação nem de etapa de build: basta servir a pasta.

```
index.html        página, estilos e interface
js/core.js        utilidades, salvamento no aparelho, voz, música e efeitos
js/models.js      modelos 3D low-poly
js/world.js       vila, câmera, Tico e arrastar e soltar
js/missions-a.js  situações da Padaria e da Feira
js/missions-b.js  situações da Granja, Casa da Lia e Ônibus
js/play.js        fluxo da missão, cartões, dicas e ajuste de nível
js/ui.js          jogadores, praça, álbum, festa e painel do professor
```
