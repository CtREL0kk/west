import Card from './Card.js';
import Game from './Game.js';
import SpeedRate from './SpeedRate.js';
import TaskQueue from "./TaskQueue.js";


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
    constructor(name = "Мирная утка", power = 2) {
        super(name, power)
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
    constructor(name = 'Бандит', maxPower = 3) {
        super(name, maxPower);
    }
}

class Trasher extends Dog {
    constructor() {
        super('Громила', 5);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        this.view.signalAbility(() => continuation(value - 1));
    }

    getDescriptions() {
        const desc = "Сила = 5; получает на единицу меньше урона.";

        return super.getDescriptions().concat(desc);
    }
}

class Brewer extends Duck {
    constructor() {
        super('Пивовар', 2);
    }

    doBeforeAttack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        const allCards = currentPlayer.table.concat(oppositePlayer.table);

        const ducks = allCards.filter(card => isDuck(card));

        ducks.forEach(duck => {
            taskQueue.push(onDone => {
                duck.maxPower += 1;
                duck.currentPower += 2;
                duck.updateView();
                duck.view.signalHeal(onDone);
            });
        });

        taskQueue.continueWith(continuation);
    }

}

class Lad extends Dog {
    constructor() {
        super('Браток', 2);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const ladCount = this.getInGameCount();

        return ladCount * (ladCount + 1) / 2;
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value - Lad.getBonus());
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Lad.getInGameCount() - 1);
        continuation();
    }

    getDescriptions() {
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature') ||
            Lad.prototype.hasOwnProperty('modifyTakenDamage')) {
            const desc = 'Чем их больше, тем они сильнее';

            return super.getDescriptions().concat(desc);
        }

        return super.getDescriptions();
    }
}

class Rogue extends Creature {
    constructor() {
        super('Изгой', 2);
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        const card = Object.getPrototypeOf(toCard);
        const propNames = Object.getOwnPropertyNames(this);

        if (card.hasOwnProperty('modifyDealedDamageToCreature')) {
            this.modifyDealedDamageToCreature = card.modifyDealedDamageToCreature;
            delete card['modifyDealedDamageToCreature'];

        }
        if (card.hasOwnProperty('modifyDealedDamageToPlayer')) {
            this.modifyDealedDamageToCreature = card.modifyDealedDamageToPlayer;
            delete card['modifyDealedDamageToPlayer'];
        }
        if (card.hasOwnProperty('modifyTakenDamage')) {
            this.modifyTakenDamage = card.modifyTakenDamage
            delete card['modifyTakenDamage'];
        }

        gameContext.updateView();
        continuation(value);
    }
}

// Колода Шерифа, нижнего игрока.
class Gatling
    extends Creature {
    constructor() {
        super('Гатлинг', 6);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        taskQueue.push(onDone => this.view.showAttack(onDone));
        for (let opposite_position = 0; opposite_position < oppositePlayer.table.length; opposite_position++) {
            const oppositeCard = oppositePlayer.table[opposite_position];
            if (oppositeCard) {
                taskQueue.push(onDone => {
                    this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
                })

            }
        }


        taskQueue.continueWith(continuation);
    };

}

const seriffStartDeck = [
    new Duck(),
    new Brewer(),
    new Rogue(),
    new Rogue(),
    new Rogue(),
    new Rogue(),
];

const banditStartDeck = [
    new Dog(),
    new Dog(),
    new Dog(),
    new Dog(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(5);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
