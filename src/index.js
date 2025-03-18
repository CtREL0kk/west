import Game from './Game.js';
import Creature from './Card.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

function isDuck(card) {
    return card && card.quacks && card.swims;
}

function isDog(card) {
    return card instanceof Dog;
}

export function getCreatureDescription(card) {
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



// Основа для утки.
class Duck extends Creature {
    constructor(name = 'Мирная утка', power = 2, image = "duck.jpg") {
        super(name, power, image);
    }
    quacks(){
        console.log('quack');
    }
    swims(){
        console.log('float: both;');
    }

}


// Основа для собаки.
class Dog extends Creature {
    constructor(name = 'Пес-бандит', power = 3, image="dog.jpg") {
        super(name, power, image);
    }
}

class Trasher extends Dog {
    constructor(name="Громила", power = 5) {
        super(name, power);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        if (value > 0){
            this.view.signalAbility(() => {
                continuation(value - 1);
            });
        }
    }

    getDescriptions(){
        let newDescriptions = ['Если Громилу атакуют, то он получает на 1 меньше урона.',
        ];
        return newDescriptions.concat(super.getDescriptions());
    }
}

class Gatling extends Creature{
    constructor(name = 'Гатлинг', power = 6, image="gatling.jpg") {
        super(name, power, image);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();

        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;
        for (let i = 0; i < oppositePlayer.table.length; i++) {
            taskQueue.push(onDone => this.view.showAttack(onDone));
            taskQueue.push(onDone => {
                const oppositeCard = oppositePlayer.table[i];
                this.dealDamageToCreature(this.currentPower, oppositeCard, gameContext, onDone);
            });
        }

        taskQueue.continueWith(continuation);

    }

}

class Rogue extends Creature{
    constructor(name = 'Изгой', power = 2, image = "rogue.jpg") {
        super(name, power, image);
    }

    doBeforeAttack (gameContext, continuation) {
        const { currentPlayer, oppositePlayer, position, updateView } = gameContext;

        const oppositeCard = oppositePlayer.table[position];

        if (oppositeCard) {
            const prototype = Object.getPrototypeOf(oppositeCard);

            const abilitiesToSteal = [
                'modifyDealedDamageToCreature',
                'modifyDealedDamageToPlayer',
                'modifyTakenDamage'
            ];
            for (const ability of abilitiesToSteal) {
                if (prototype.hasOwnProperty(ability)) {
                    this[ability] = prototype[ability];
                    delete prototype[ability];
                }
            }

            oppositePlayer.table.forEach(card => card.updateView());
        }
        super.doBeforeAttack(gameContext, continuation);
    }

}

class Lad extends Dog{
    constructor(name = 'Браток', power = 3, image = "lad.jpg") {
        super(name, power, image);
        let currentCount = Lad.getInGameCount();
        Lad.setInGameCount(currentCount + 1);
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation){
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(value - Lad.getBonus());
    }

    getDescriptions(){
        let newDescriptions = [];
        if (Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature')){
            newDescriptions.push('Чем их больше, тем они сильнее');
        }
        return newDescriptions.concat(super.getDescriptions());
    }

    doAfterComingIntoPlay(gameContext, continuation){
        let currentCount = Lad.getInGameCount();
        Lad.setInGameCount(currentCount + 1);
        continuation();
    }

    doBeforeRemoving(continuation){
        let currentCount = Lad.getInGameCount();
        Lad.setInGameCount(currentCount - 1);
        continuation();
    }
    static getInGameCount() {
        return this.inGameCount || 0;
    }
    static setInGameCount(value) {
        this.inGameCount = value;
    }
    static getBonus() {
        let count = this.getInGameCount();
        return count * (count + 1) / 2;
    }
}

class PseudoDuck extends Dog{
    constructor(name="Псевдоутка", power = 3, image = "pseudoduck.jpg") {
        super(name, power, image);
    }
    quacks(){
        console.log('quack');
    }
    swims(){
        console.log('float: both;');
    }
}

class Brewer extends Duck{
    constructor(name = "Пивовар", power = 2) {
        super(name, power);
    }

    doBeforeAttack(gameContext, continuation) {
        const { currentPlayer, oppositePlayer, position, updateView } = gameContext;
        for (let creature of currentPlayer.table.concat(oppositePlayer.table)) {
            if (isDuck(creature)) {
                creature.maxPower += 1;

                creature.currentPower += 2;

                creature.view.signalHeal();
                creature.updateView();
            }
        }
        super.doBeforeAttack(gameContext, continuation);

    }
}

class Nemo extends Creature{
    constructor(name = 'Немо', power = 4, image) {
        super(name, power, image);
    }

    doBeforeAttack(gameContext, continuation) {
        const {currentPlayer, oppositePlayer, position, updateView} = gameContext;

        const oppositeCard = oppositePlayer.table[position];

        if (oppositeCard) {
            const stolenPrototype = Object.getPrototypeOf(oppositeCard);

            Object.setPrototypeOf(this, stolenPrototype);

            currentPlayer.table.forEach(card => card.updateView());
            oppositePlayer.table.forEach(card => card.updateView());

            if (typeof this.doBeforeAttack === 'function') {
                this.doBeforeAttack(gameContext, continuation);
            } else {
                continuation();
            }
        } else {
            continuation();
        }
    }
}

const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
    new Rogue(),
];
const banditStartDeck = [
    new Lad(),
    new Lad(),
    new Lad(),
];
const game = new Game(seriffStartDeck, banditStartDeck);

SpeedRate.set(1);

game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
