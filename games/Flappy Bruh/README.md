# Flappy Bruh

Developer: Walter

Status: Playable (v4.2)

## Description

Um jogo estilo Flappy Bird em que o passarinho atravessa canos. A cada trecho o
mundo pode se inverter (voar de costas, gravidade lateral, de cabeça para
baixo) e, após o cano 45, essas inversões passam a ser completamente
aleatórias. Também inclui recorde salvo localmente, tutorial na primeira
partida, configurações de volume e um painel de desenvolvedor para
teletransportar para pontos específicos do jogo durante testes.

## Technology

- HTML5 Canvas + JavaScript puro (sem dependências externas)
- Arquivo único e autocontido (`src/index.html`)
- Áudio sintetizado via Web Audio API
- Progresso/volume/recorde salvos em `localStorage`

## How to Run

Abra `src/index.html` diretamente no navegador, ou sirva a pasta com
qualquer servidor estático (ex: `npx serve games/game-2/src`).

## Arcade Integration

This game will later integrate with the shared AP CS Arcade.
