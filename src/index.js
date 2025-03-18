import Card from './Card.js';
import Game from './Game.js';
import SpeedRate from './SpeedRate.js';


// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims && true;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    console.log(card)
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

class Creature extends Card {
    constructor(name, maxPower, image) {
        super(name, maxPower, image);
    }

    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()]
    }
}


// Основа для утки.
class Duck extends Creature {
    constructor() {
        super("Мирная утка", 2)
    }

    quacks() {
        console.log('quack')
    };

    swims() {
        console.log('float: both;')
    };
}


// Основа для собаки.
class Dog extends Creature {
    constructor() {
        super('Бандит', 3);
    }
}


// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck()
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Dog(),
];

const duck = seriffStartDeck[0];
console.log(Boolean(duck && duck.quacks && duck.swims), isDuck(duck))


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
