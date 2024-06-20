// Cena de início
class StartScene extends Phaser.Scene {
    constructor() {
        super({ key: 'StartScene' });
    }

    preload() {
        // Carrega a imagem do botão de iniciar e a imagem de fundo
        this.load.image('startButton', 'assets/start.png');
        this.load.image('background', 'assets/fundo.png');
    }

    create() {
        // Adiciona a imagem de fundo
        const background = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY - 100, 'background');
        background.setOrigin(0.5, 0.5);
        background.setDisplaySize(this.cameras.main.width, this.cameras.main.height - 200); // Ajusta o tamanho do fundo

        // Adiciona o botão de iniciar
        const startButton = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY + 100, 'startButton').setInteractive();
        startButton.setScale(0.3); // Ajusta a escala do botão

        // Define a ação ao clicar no botão de iniciar
        startButton.on('pointerdown', () => {
            resetGame(); // Reinicia o jogo quando o botão for clicado
            this.scene.start('MainScene'); // Inicia a cena principal
        });
    }
}

// Cena principal do jogo
class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // Carrega as imagens dos ativos
        this.load.image('player', 'assets/player.png');
        this.load.image('bread', 'assets/pao.png');
        this.load.image('meat', 'assets/carne.png');
        this.load.image('tomato', 'assets/tomate.png');
        this.load.image('cheese', 'assets/queijo.png');
        this.load.image('bacon', 'assets/bacon.png');
        this.load.image('quadro', 'assets/quadro.png'); 
        this.load.image('coin', 'assets/moedas.png'); 
        this.load.image('complete', 'assets/end.png'); 
        this.load.tilemapTiledJSON('map', 'assets/tiles/Cozinha_desenho.json'); // Carrega o mapa do Tiled
        this.load.spritesheet('tiles', 'assets/tiles/tileset.png', { frameWidth: 16, frameHeight: 16 });
    }

    create() {
        // Cria o mapa a partir do JSON carregado
        this.map = this.make.tilemap({ key: 'map' });

        if (!this.map) {
            console.error("O objeto do mapa não foi criado corretamente.");
            return;
        }

        // Adiciona o tileset e cria as camadas do mapa
        const tileset = this.map.addTilesetImage('Cozinha', 'tiles');
        this.map.createLayer('Camada de Blocos 1', tileset, 0, 0);
        this.map.createLayer('Mesas', tileset, 0, 0);

        // Adiciona o jogador
        player = this.physics.add.sprite(250, 250, 'player').setScale(0.03);
        player.setCollideWorldBounds(true);  // Impede que o jogador saia dos limites do mundo

        // Define os controlos
        controls = this.input.keyboard.createCursorKeys();  // Cria os controlos de cursor (setas)

        // Define as teclas para pegar e soltar ingredientes
        teclaPegar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        teclaSoltar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

        // Adiciona e posiciona o quadro
        quadro = this.add.image(100, 100, 'quadro');
        quadro.setOrigin(0.44, 0.66);
        quadro.setScale(0.15); // Ajusta a escala conforme necessário

        // Adiciona o texto dos pedidos no quadro
        pedidoTexto = this.add.text(10, 10, '', { font: '9px Arial', fill: '#ffffff' });
        pedidoTexto.setOrigin(0, 0);
        pedidoTexto.setPosition(quadro.x - quadro.displayWidth / 2 + 36, quadro.y - quadro.displayHeight / 2 + (-15)); // Posiciona o texto dentro do quadro

        // Adiciona o texto de mensagem de erro
        mensagemErro = this.add.text(15, 80, '', { font: '13px Arial', fill: '#ff0000' });
        atualizarTextoPedidos();  // Atualiza o texto dos pedidos

        // Posiciona o texto do score no quadro
        const scoreLabel = this.add.text(quadro.x - 60, quadro.y + 30, 'Score:', { font: '12px Arial', fill: '#ffffff' });
        scoreLabel.setOrigin(0, 0.5);

        // Adiciona a imagem da moeda ao lado do score
        const coinImage = this.add.image(scoreLabel.x + scoreLabel.width - 49, scoreLabel.y, 'coin');
        coinImage.setScale(0.014); // Ajusta a escala da imagem da moeda conforme necessário

        // Adiciona o texto da pontuação
        scoreTexto = this.add.text(scoreLabel.x + scoreLabel.width + 5, scoreLabel.y, '0', { font: '12px Arial', fill: '#ffffff' });
        scoreTexto.setOrigin(0, 0.5);

        // Cria as zonas de ingredientes a partir do mapa
        ingredientZones = this.map.getObjectLayer('IngredientZones').objects.map(zone => {
            let spriteKey = zone.properties.find(prop => prop.name === 'ingredient').value;  // Encontra a propriedade "ingredient" da zona
            let sprite = this.physics.add.sprite(zone.x + zone.width / 2, zone.y + zone.height / 2, spriteKey);  // Adiciona o sprite do ingrediente
            sprite.setScale(ingredientScales[spriteKey]); // Usa a escala específica para o ingrediente
            sprite.setInteractive();  // Torna o sprite interativo
            sprite.setData('ingredient', spriteKey);  // Define dados personalizados para o sprite
            this.physics.add.overlap(player, sprite, pickIngredient, null, this);  // Adiciona a sobreposição entre o jogador e o ingrediente
            return { sprite: sprite, originalX: zone.x + zone.width / 2, originalY: zone.y + zone.height / 2 };  // Retorna o sprite e as suas coordenadas originais
        });

        // Adiciona a zona de entrega
        const deliveryZone = this.map.getObjectLayer('delivery_zone').objects[0];  // Obtém a zona de entrega a partir do mapa
        let deliverySprite = this.add.rectangle(deliveryZone.x + deliveryZone.width / 2, deliveryZone.y + deliveryZone.height / 2, deliveryZone.width, deliveryZone.height, 0x0000ff, 0); // Adiciona um retângulo invisível para a zona de entrega
        deliverySprite.setOrigin(0.5, 0.5);
        this.physics.add.existing(deliverySprite, true);  // Torna o retângulo um objeto estático de física
        this.physics.add.overlap(player, deliverySprite, deliverIngredient, null, this);  // Adiciona a sobreposição entre o jogador e a zona de entrega

        // Adiciona a imagem de "Jogo Completo"
        jogoCompletoTexto = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY, 'complete');
        jogoCompletoTexto.setOrigin(0.5);
        jogoCompletoTexto.setScale(0.3); // Ajusta a escala da imagem conforme necessário
        jogoCompletoTexto.setVisible(false); // Inicialmente oculto
    }

    update() {
        // Define a velocidade do jogador para zero
        player.setVelocity(0);
        
        // Movimenta o jogador conforme os controlos
        if (controls.left.isDown) {
            player.setVelocityX(-200);  // Move para a esquerda
        } else if (controls.right.isDown) {
            player.setVelocityX(200);  //Move para a direita
        }
        if (controls.up.isDown) {
            player.setVelocityY(-200);  // Move para cima
        } else if (controls.down.isDown) {
            player.setVelocityY(200);  // Move para baixo
        }
    }
}

// Configuração do jogo
const config = {
    type: Phaser.AUTO,
    width: 480,
    height: 480,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // Se colocar como 'false' desativa as caixas de colisão visíveis depois de testar
        }
    },
    scene: [StartScene, MainScene] // Adiciona ambas as cenas 
};

// Cria uma nova instância do jogo
const game = new Phaser.Game(config);

// Funções globais e variáveis
var player, controls, teclaPegar, teclaSoltar;
var ingredientCarregado = null;
var pedidos = [];
var pedidoTexto, mensagemErro, quadro, jogoCompletoTexto, scoreTexto;
var ingredientZones = [];
var map;
var score = 0; // Variável global de pontuação

// Define as escalas específicas para cada ingrediente
const ingredientScales = {
    'bread': 0.06,
    'meat': 0.008,
    'tomato': 0.1,
    'cheese': 0.015,
    'bacon': 0.02
};

// Função para reiniciar o jogo
function resetGame() {
    // Reinicializa os pedidos
    pedidos = [
        { id: 1, ingredientes: ['bread', 'meat', 'cheese'], completo: false },
        { id: 2, ingredientes: ['bread', 'bacon', 'tomato'], completo: false },
        { id: 3, ingredientes: ['bread', 'meat', 'bacon', 'tomato'], completo: false },
        { id: 4, ingredientes: ['bread', 'meat', 'cheese', 'bacon', 'tomato'], completo: false }
    ];
    // Reinicializa a pontuação
    score = 0;
}

// Função para pegar o ingrediente
function pickIngredient(player, ingredient) {
    if (!ingredientCarregado && Phaser.Input.Keyboard.JustDown(teclaPegar)) {
        ingredientCarregado = ingredient;  // Carrega o ingrediente
        ingredient.setVisible(false);  // Torna o ingrediente invisível
        console.log('Pegou: ' + ingredient.getData('ingredient'));
    }
}

// Função para entregar o ingrediente
function deliverIngredient(player, deliveryZone) {
    if (ingredientCarregado && Phaser.Input.Keyboard.JustDown(teclaSoltar)) {
        console.log('Entregue: ' + ingredientCarregado.getData('ingredient'));

        if (!verificarPedido.call(this, ingredientCarregado.getData('ingredient'))) {
            mensagemErro.setText('Ingrediente errado, pedido falhado');
            this.time.delayedCall(2000, () => {
                mensagemErro.setText('');
            });
            // Restaura o estado original dos pedidos em caso de erro
            let pedidoAtual = pedidos.find(p => !p.completado && p.entregues && p.entregues.length > 0);
            if (pedidoAtual) {
                pedidoAtual.ingredientes = pedidoAtual.ingredientes.concat(pedidoAtual.entregues);
                pedidoAtual.entregues = [];
            }
            score -= 5; // Reduz a pontuação em caso de erro
            scoreTexto.setText(score); // Atualiza o texto da pontuação
            atualizarTextoPedidos.call(this); // Atualiza o texto dos pedidos
            reporIngredientes.call(this); // Repõe os ingredientes em caso de erro
        } else {
            score += 10; // Aumenta a pontuação em caso de acerto
            scoreTexto.setText(score); // Atualiza o texto da pontuação

            // Verifica se todos os pedidos foram completados
            if (pedidos.every(p => p.completado)) {
                jogoCompletoTexto.setVisible(true); // Mostra a imagem de "Jogo Completo"
                this.time.delayedCall(5000, () => {
                    this.scene.start('StartScene'); // Volta para a tela inicial após 5 segundos
                });
            }
        }

        ingredientCarregado.x = deliveryZone.x;
        ingredientCarregado.y = deliveryZone.y;
        ingredientCarregado.setVisible(true);
        ingredientCarregado = null;
    }
}

// Função para verificar o pedido
function verificarPedido(ingredienteEntregue) {
    let pedidoCompleto = false;  // Variável para indicar se o pedido foi completado
    let ingredienteCorreto = false;  // Variável para indicar se o ingrediente entregue está correto

    // Encontra o primeiro pedido que ainda não foi completado
    let pedido = pedidos.find(p => !p.completado);

    // Se existir um pedido e o ingrediente entregue fizer parte dos ingredientes do pedido
    if (pedido && pedido.ingredientes.includes(ingredienteEntregue)) {
        ingredienteCorreto = true;  // Marca o ingrediente como correto
        pedido.entregues = pedido.entregues || [];  // Inicializa o array de ingredientes entregues se necessário
        pedido.entregues.push(ingredienteEntregue);  // Adiciona o ingrediente entregue ao array de ingredientes entregues
        pedido.ingredientes.splice(pedido.ingredientes.indexOf(ingredienteEntregue), 1);  // Remove o ingrediente entregue do array de ingredientes restantes
        // Se todos os ingredientes do pedido foram entregues
        if (pedido.ingredientes.length === 0) {
            pedido.completado = true;  // Marca o pedido como completado
            pedidoCompleto = true;  // Marca o pedido como completamente processado
        }
    }

    // Se o pedido foi completamente processado
    if (pedidoCompleto) {
        atualizarTextoPedidos.call(this);  // Atualiza o texto dos pedidos na tela
        reporIngredientes.call(this);  // Repõe os ingredientes na tela
        console.log('Pedido concluído!');  // Imprime uma mensagem na consola
    }

    return ingredienteCorreto;  // Retorna se o ingrediente entregue estava correto
}

// Função para atualizar o texto dos pedidos
function atualizarTextoPedidos() {
    let texto = 'Pedidos:\n';  // Inicializa o texto com o cabeçalho "Pedidos:\n"
    // Itera sobre cada pedido
    pedidos.forEach(pedido => {
        // Se o pedido não foi completado
        if (!pedido.completado) {
            // Adiciona o texto do pedido ao texto final
            texto += `Pedido ${pedido.id}: ${pedido.ingredientes.join(', ')}\n`;
        }
    });
    pedidoTexto.setText(texto);  // Define o texto do objeto `pedidoTexto` como o texto final
}

// Função para repor os ingredientes
function reporIngredientes() {
    if (!this.map) {
        console.error("O mapa está indefinido em reporIngredientes");  // Verifica se o mapa está definido
        return;
    }

    // Destrói todos os sprites de ingredientes existentes
    ingredientZones.forEach(obj => {
        let sprite = obj.sprite;
        sprite.destroy();
    });

    // Recria as zonas de ingredientes a partir do mapa
    ingredientZones = this.map.getObjectLayer('IngredientZones').objects.map(zone => {
        let spriteKey = zone.properties.find(prop => prop.name === 'ingredient').value;  // Obtém a propriedade "ingredient" da zona
        let sprite = this.physics.add.sprite(zone.x + zone.width / 2, zone.y + zone.width / 2, spriteKey).setInteractive();  // Cria um sprite para o ingrediente
        sprite.setData('ingredient', spriteKey);  // Define os dados do ingrediente no sprite
        sprite.setScale(ingredientScales[spriteKey]); // Usa a escala específica para o ingrediente
        this.physics.add.overlap(player, sprite, pickIngredient, null, this);  // Adiciona colisão entre o jogador e o ingrediente
        return { sprite: sprite, originalX: zone.x + zone.width / 2, originalY: zone.y + zone.width / 2 };  // Retorna o sprite criado e sua posição original
    });
}
