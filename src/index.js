import Card from './Card.js';
import Game from './Game.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
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
class Duck extends Card {
    constructor(name = 'Мирная утка', power = 2) {
        super(name, power);
    }
    quacks(){
        console.log('quack');
    }
    swims(){
        console.log('float: both;');
    }

}


// Основа для собаки.
class Dog extends Card{
    constructor(name = 'Пес-бандит', power = 3) {
        super(name, power);
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

class Lad extends Dog{
    constructor(name = 'Браток', power = 3) {
        super(name, power);
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


// Колода Шерифа, нижнего игрока.
const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];

// Колода Бандита, верхнего игрока.
const banditStartDeck = [
    new Lad(),
    new Lad(),
];


// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
