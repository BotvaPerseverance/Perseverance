// ==UserScript==
// @name         Perseverance
// @namespace    http://*.botva.ru/*
// @version      0.1
// @description  try to take over the world!
// @author       BotvaPerseverance
// @match        https://g1.botva.ru/*
// @match        https://g2.botva.ru/*
// @match        https://g3.botva.ru/*
// @match        https://turbo.botva.ru/*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// ==/UserScript==

// .balert_baloon_content.big
(async () => {

  let BM = GM_getValue('main.power', 100) / 1.5;
  let arenaEnabled = GM_getValue('main.arena.enabled', 1);
  let attackEnabled = GM_getValue('main.attack.enabled', 1);
  let preferredPet = GM_getValue('main.preferredPet', 0);
  /**
   0 - disabled
   133 - Шнырк
   134 - Царапка
   135 - Бобруйко
   180 - Спиношип
   181 - Енотка
   182 - Броневоз
   200 - Червячелло
   246 - Лисистричка
   */

  class List {
    constructor(key) {
      this._key = key;
      this._array = GM_getValue(key, []);
    }
    existsBy(key, value) {
      return this._array.some(item => item[key] === value);
    }
    find(value) {
      return this._array.filter(item => item === value);
    }
    findBy(key, value) {
      return this._array.filter(item => item[key] === value);
    }
    _commit() {
      this._array = GM_setValue(this._key, this._array); // Date workaround
    }
    addName(name) {
      let exists = this.findBy('name', name);
      if (exists.length) {
        exists[0].updated = new Date();
      } else {
        this._array.push({
          name,
          created: new Date(),
          updated: new Date()
        });
      }
      this._commit();
    }
    remove(value) {
      this._array = this._array.filter(item => item !== value);
      this._commit();
    }
    removeBy(key, value) {
      this._array = this._array.filter(item => item[key] !== value);
      this._commit();
    }
    cleanup(inactiveDays) {
      // delete if ((current time - range) > update time)
      console.info(this._array);
      let itemsForDeletion = this._array.filter(item => {
        return ((+new Date() - inactiveDays * 24 * 60 * 60 * 1000) > +new Date(item.updated));
      });
      if (!itemsForDeletion.length) {
        return true;
      }
      let temp = this._array.filter(x => !itemsForDeletion.includes(x));
      if (temp.length) {
        this._commit();
      }
    }
  }

  const VALUES = {
    main: {
      power: GM_getValue('main.power', 0),
      timer: updateTimers(),
      blackList: { // {name: <String>, created: <Date>, updated: <Date>}
        arena: new List('main.blackList.arena')
      }
    },
    avatar: {}
  };

  function updateTimers() {
    return {
      dozorAttack: GM_getValue('main.timer.dozorAttack', -1),
      arena: GM_getValue('main.timer.arena', -1),
      dozorMonster: GM_getValue('main.timer.dozorMonster', -1),
      dozorZorro: GM_getValue('main.timer.dozorZorro', -1),
      workshop: GM_getValue('main.timer.workshop', -1),
      tunnels: GM_getValue('main.timer.tunnels', -1),
      channeling: GM_getValue('main.timer.channeling', 0)
    };
  }

  async function destinyInit() {
    console.log('Destiny init.');
    let crystalsSpan = document.querySelector('#crystal_upd_data');
    let crystals = crystalsSpan ? toInteger(crystalsSpan.innerText) : 0;

    let isPetOutOfCage = !!document.querySelector('#pet .ico_cage_1');

    let indexProfilePower = document.querySelector('#profile .profile_statistic tr:last-child td:last-child');
    if (indexProfilePower && location.href.includes('index')) {
      let power = toInteger(indexProfilePower.innerText);
      GM_setValue('main.power', power);
      //console.log('index profile power', power);
    }
    //let fightPlaceDiv = document.querySelector('#fightplace_remaining');
    //f (fightPlaceDiv) {
    //   let timerFightPlace = getDateFromDiv(fightPlaceDiv);
    //    GM_setValue('main.timer.fightplace', timerFightPlace);
    //console.log('timer fightPlace', timerFightPlace, getCountDownFromDate(timerFightPlace)/1000);
    //}

    async function checkTimers() {
      let list = updateTimers();

      let sortedEntries = Object.entries(list)
        .filter(a => a[1] !== -1) // exclude disabled timers
        .sort((prev, curr) => new Date(prev[1]) > new Date(curr[1]));

      if (!sortedEntries.length) {
        console.log('No timers.');
        return;
      }
      let closestCounter = sortedEntries[0];
      let name = closestCounter[0];
      let timeout = getCountDownFromDate(new Date(closestCounter[1]))/1000;
      if (timeout > 0) {
        console.log(`Do job '${name}' in ${timeout} sec`);
        await delay(timeout * 1000);
      } else {
        console.log(`Do job '${name}' in no time!`);
      }
      await delay(randomInteger(500, 2000) + 3000);
      switch (name) {
        case "workshop":
          var url = '/castle.php?a=';
          if (isInGuild('farm')) {
            url += 'workshop_farm&id=4';
          } else if (isInGuild('mine')) {
            url += 'workshop_mine&id=3';
          } else if (isInGuild('trade')) {
            url += 'foreign&id=1'
          }
          location.href = url;
          break;
        case 'tunnels':
          location.href = '/fort.php?a=place&type=1';
          break;
        case 'channeling':
          location.href = '/channeling.php';
          break;
        case "dozorMonster":
          if (isPetOutOfCage) {
            location.href = '/dozor.php';
          }
          break;
        case "dozorAttack":
          if (!attackEnabled) {
            return;
          }
        case "arena":
          if (!arenaEnabled) {
            return;
          }
        case "dozorZorro":
          location.href = '/dozor.php';
          break;
      }
    }

    try {
      let destiny = chooseYourDestiny(location.href);
      let stayOnPage = false;

      if (destiny !== 'buy_pet' && !isPetOutOfCage && preferredPet) {
        await delay(randomInteger(500, 2000));
        uncagePet();
      }

      if (!destiny) {
        let sec = randomInteger(10, randomInteger(15, 20));
        console.log(`Delaying ${sec} seconds. Let\'s check events.`);
        await delay(sec * 1e3);
      } else {
        console.log(`Destiny is ${destiny}.`);
        await delay(randomInteger(500, 2000));
        stayOnPage = await destinyRun(destiny);
      }

      if (stayOnPage) {
        return;
      }

      await checkEvents(destiny);
      await checkTimers();

      await delay(randomInteger(500, 2000));
      let min = randomInteger(1, randomInteger(10, 15));
      console.log(`No events? SRSLY? Waiting ${min} min for reload.`);
      await delay(min * 60 * 1e3);

      let job = document.querySelector('#rmenu1 .timer.link');
      if (job.innerText !== 'Я свободен!') {
        return job.click();
      }
      if (location.pathname !== '/dozor.php') {
        return document.querySelector('.timer[href="dozor.php"]').click();
      }
      doReload();
    } catch (e) {
      //console.error(e);
      //alert('Oopsie, something is wrong!\n' + e);
      GM_notification({
        title: 'Autobot error!!1',
        text: e.toString(),
        //image: ''
      });
    }
    function chooseYourDestiny(href) {
      console.log(`Choosing the destiny by href: ${href}`);
      if (href.match(/\/(?:m|battle|battleground|wedding|page|tavern|game)\.php/)) {
        return 'none';
      }
      if (href.includes('fight_log.php') && !href.includes('fightplace')) {
        return 'default';
      }
      if (href.includes('/dozor.php?m=arena&a=log')) {
        return 'fight_log';
      }
      if (href.includes('/shop.php?g=7')) {
        return 'buy_pet';
      }
      if (href.includes('/temple.php?a=services')) {
        return 'temple';
      }
      if (href.includes('/harbour.php?a=pier')) {
        return 'harbour_pier';
      }
      if (href.includes('/castle.php?a=workshop')) {
        return 'workshop';
      }
      if (href.includes('/castle.php?a=foreign')) {
        return 'foreign';
      }
      if (href.endsWith('/fort.php?a=place&type=1')) {
        return 'tunnels';
      }
      if (href.includes('/castle.php?a=myguild&id=31&m=lab')) {
        return 'lab';
      }
      if (href.match(/\/dozor\.php(?!\?[am])/)) {
        return 'dozor';
      }
      if (href.endsWith('/dozor.php?a=monster')) {
        return 'dozor_monster';
      }
      if (href.includes('/channeling.php')) {
        return 'channeling';
      }
    }

    async function destinyRun(destiny) {
      switch (destiny) {
        case 'default':
          await checkEvents();
          await delay(randomInteger(2000, 4000));
          return document.querySelector('.timer[href="dozor.php"]').click();
        case 'buy_pet':
          return destinyBuyPet();
        case 'temple':
          return destinyTemple();
        case 'fight_log':
          return destinyFightLog();
        case 'harbour_pier':
          return destinyHarbourPier();
        case 'workshop':
          return destinyWorkshop();
        case 'foreign':
          return destinyForeign();
        case 'tunnels':
          return destinyTunnels();
        case 'lab':
          return destinyLab();
        case 'dozor':
          return destinyDozor();
        case 'dozor_monster':
          return destinyDozorMonster();
        case 'channeling':
          return destinyChanneling();
        case 'none':
          return true;
        default:
          return false;
      }
    }

    async function destinyBuyPet() {
      let form = document.querySelector('#shop_cmd_' + preferredPet);
      if (!form) {
        throw new Error('no pet form!');
      }
      if (isPetOutOfCage) {
        console.log('We already have a pet.');
        await delay(4000);
        return false;
      }
      let radioCrystal = form.querySelector('input[type="radio"][name="ptype"]');
      let price = form.querySelector('input[type="radio"][name="ptype"] + span').innerText;
      if (price) {
        price = toInteger(price);
      }
      if (!radioCrystal.checked) {
        throw new Error('form is broken by devs');
      }
      if (crystals >= price) {
        console.log('ok!');
        await delay(2500);
        let buyButton = form.querySelector('input[value="КУПИТЬ"]');
        if (!buyButton || isHidden(buyButton) || isDisabled(buyButton)) {
          throw new Error('no button to buy pet');
        }
        buyButton.click();
        isPetOutOfCage = true;
        return false;
      }
      throw new Error('no crystals to buy pet');
      //return false;
    }
    async function destinyTemple() {
      let removeBlock = document.querySelector('#temple_remove_block');
      let inputs = removeBlock.querySelectorAll('form input[name="effect[]"][pricetype="2"]');
      if (!inputs || !inputs.length) {
        return false; // Just go ahead.
      }
      await delay(randomInteger(500, 2000));
      inputs.forEach(async input => { // TODO: click in series
        input.click();
      });
      await delay(randomInteger(500, 2000));
      let removePrice = removeBlock.querySelector('input[name="ptype"][value="1"]');
      if (!removePrice || isHidden(removePrice) || isDisabled(removePrice)) {
        throw new Error('temple: no crystal price');
      }
      if (!removePrice.checked) {
        removePrice.click();
      }
      let submitButton = removeBlock.querySelector('input[value="СНЯТЬ"]');
      if (!submitButton) {
        throw new Error('temple: no submit button');
      }
      await delay(randomInteger(500, 2000));
      submitButton.click();
      return true;
    }
    async function destinyFightLog() {
      console.log('fight log');
      let playerName = document.querySelector('#char .name u').innerText;
      let fighterName = document.querySelector('.fl_l .arena_log a.profile span').innerHTML; // uppercase workaround
      if (playerName !== fighterName) {
        console.log('Not our job.');
        await delay(randomInteger(500, 2000));
        return false;
      }
      let enemy = document.querySelector('.fl_r .arena_log span');
      let enemyName = enemy.innerHTML;

      let lose = enemy.classList.contains('green');
      if (lose) {
        VALUES.main.blackList.arena.addName(enemyName);
      }
      await delay(randomInteger(2000, 8000));
      return document.querySelector('.timer[href="dozor.php"]').click();
    }
    async function destinyHarbourPier() {
      if (document.querySelector('#events_scroll #event_73')) {
        return renewBoat();
      }

      async function renewBoat() {
        let nums = document.querySelectorAll('.mb10 span.bold.yellow');
        let forms = document.querySelectorAll('.mb1 .ml70');
        let boats = [];
        for (let i = 0; i < nums.length; i++) {
          boats[i] = +nums[i].innerText;
        }
        boats = boats.reverse();
        for (let i = 0; i < boats.length; i++) {
          let form = forms[i];
          let boatType = form.querySelector('div.uppercase.bold').innerText;
          console.log(boatType, boats[i]);
          if (!boats[i] || boats[i] > 10) {
            continue;
          }
          let price = toInteger(form.querySelector('.price_num').innerText);
          if (crystals >= price) {
            console.log('Уверены, что хотите купить ' + boatType + '? Ждём 15 секунд. Кристаллов хватает: ', price <= crystals);
            await delay(15 * 1e3);
            closeMenuRow(73,0);
            form.querySelector('input[type=submit]').click();
            return true;
          }
        }
        return false;
      }

      // TODO: bOk('Команда вышла в море за добычей уже 15 раз. Без управляющего работать круглосуточно они не хотят.');

      let button = document.querySelector('.send_ship input[type=submit]');
      if (button && !button.disabled) {
        button.click();
        return 'harbour_pier';
      }
      let text = document.querySelector('#wait_ship');
      if (text) {
        if (text.innerText.includes('с добытыми пирашками')) {
          console.log('Waiting ~1 min and click the button.');
          await delay(randomInteger(45 * 1e3, 75 * 1e3));
          doReload();
        } else {
          console.log('Cooldown: nothing to do.');
          return false;
        }
      }
      console.log('Nothing to do!');
      return false;
    }
    async function destinyWorkshop() {
      if (isInGuild('trade')) {
        return destinyForeign();
      }
      let timer = document.querySelector('.workshop .js_timer');
      let button = document.querySelector('.workshop .workshop_button input[type=submit]');
      if (!timer && !button) {
        throw new Error('workshop: no timer or button');
      }
      if (button) {
        if (!isHidden(button)) {
          if (crystals < 20) {
            console.log('Sry, no crystals.');
            GM_setValue('main.timer.workshop', getNextDay());
            return false;
          }
          if (isInGuild('farm')) {
            let slavesSpan = document.querySelector('#slaves_count'); // for farmers!
            let slavesCount = toInteger(slavesSpan.innerText);
            if (!slavesCount) {
              console.log('No slaves.');
              GM_setValue('main.timer.workshop', getNextDay());
              return false;
            }
          }
          console.log('Click the button.');
          button.click();
          await delay(5000);
        }
        //return false;
      }
      if (timer || document.querySelector('#ws_work_timer')) {
        // WORKSHOP TIMER
        let timerWorkshopSpan = document.querySelector('#ws_work_timer span');
        if (timerWorkshopSpan) {
          let timerWorkshop = getDateFromSpan(timerWorkshopSpan);
          GM_setValue('main.timer.workshop', timerWorkshop);
          //console.log('timer workshop', timerWorkshop, getCountDownFromDate(timerWorkshop)/1000);
          return false;
        }
      }
      console.log('No button to click. Waiting reload.');
      return true;
    }
    async function destinyForeign() {
      let freeSpace = document.querySelector('.iconItem.ico_free');
      let fillAllButton = document.querySelector('.cmd_all.cmd_small_sl.cmd_asmall_sl');
      let timerDiv = document.querySelector('#guild_ships_timer');

      // Step 1. Fill up the hold.
      if (freeSpace && fillAllButton && !timerDiv) {
        let preservesCount = document.querySelector('.grbody p b.font_brown').innerText;
        let fillButtons = document.querySelectorAll('a[href^="?a=foreign&id=1&put=1"]');
        let fillButtonsLength = fillButtons.length;

        console.log('Step 1');
        if (preservesCount >= fillButtonsLength) {
          fillAllButton.click();
          return true;
        }
        fillButtons[0].click();
        return true;
      }
      // Step 2. Send the ship.
      if (!freeSpace && fillAllButton && !timerDiv) {
        console.log('Step 2');
        let shipForm = document.querySelector('#ship_form_4');
        let shipFormButton = shipForm.querySelector('input[type="submit"]');
        if (shipFormButton && !isHidden(shipFormButton) && !isDisabled(shipFormButton)) {
          shipFormButton.click();
          return true;
        }
      }
      // Step 3. Set the timer.
      if (!fillAllButton && timerDiv) {
        console.log('Step 3');
        let timerForeign = getDateFromDiv(timerDiv);
        //console.log('timer foreign', timerForeign, getCountDownFromDate(timerForeign)/1000);
        GM_setValue('main.timer.workshop', timerForeign);
        return false;
      }
      GM_setValue('main.timer.workshop', getNextDay());
      return true;
    }
    async function destinyTunnels() {
      let count = document.querySelector('.ml140 label .fl_r b');
      if (!count) {
        throw new Error('tunnels: no count');
      }

      let receiveBtn = document.querySelector('input[value="ЗАБРАТЬ ДОБЫЧУ"]');
      if (receiveBtn && !isHidden(receiveBtn)) {
        console.log('Get gold!!!');
        receiveBtn.click();
        await delay(randomInteger(1000, 2000));
        return false;
      }

      let [current, max] = count.innerText.split('/');
      console.log(`We have ${current} runs out of ${max}`);
      if (current === max) {
        console.log('Sry, no more runs.');
        GM_setValue('main.timer.tunnels', getNextDay());
        return false;
      }

      // TUNNELS TIMER
      let timer = document.querySelector('#fort_tunnels_next_monster');
      let description = document.querySelector('.ml140 .bar_brown.corner3.center');
      if (timer && description && description.innerText.includes('До следующего похода')) {
        console.log('Sry, cooldown.');
        let timerTunnels = getDateFromDiv(timer);
        GM_setValue('main.timer.tunnels', timerTunnels);
        //console.log('timer tunnels', timerTunnels, getCountDownFromDate(timerTunnels)/1000);
        return false;
      }
      if (current && timer && !description) {
        console.log('Run in progress.');
        GM_setValue('main.timer.tunnels', getNextDay());
        return false;
      }

      let startBtn = crystals >= 5
        ? document.querySelector('#fort_tunnels_start_2[value="ПО ЛЕБЕДКЕ"]')
        : document.querySelector('#fort_tunnels_start_1[value="ПО ВЕРЕВКЕ"]');
      if (isPetOutOfCage && startBtn && !isHidden(startBtn)) {
        await delay(randomInteger(5000, 10000));
        startBtn.click();
      }

      return false;
    }
    async function destinyLab() {
      let furnace1 = document.querySelector('#form_workshop_1 .workshop');
      let furnace2 = document.querySelector('#form_workshop_2 .workshop');

      let f1 = furnace1.querySelector('.info');
      let f2 = furnace2.querySelector('.info');

      let [_1, f1current, f1max] = f1.innerText.match(/([0-9]+)\/([0-9]+)/);
      let [_2, f2current, f2max] = f2.innerText.match(/([0-9]+)\/([0-9]+)/);

      f1current = +f1current;
      f2current = +f2current;
      f1max = +f1max;
      f2max = +f2max;

      let button1 = furnace1.querySelector('input[value="ОТЖИГ"]');
      let button2 = furnace2.querySelector('input[value="ОХЛАЖДЕНИЕ"]');

      if (isHidden(button1) && !isHidden(button2)) {
        return true;
      }

      if (f1current >= f1max && isHidden(button1)) {
        console.log('Sry, full lab 1. Closing the event.');
        closeMenuRow(36,0);
        closeMenuRow(37,0);
        return false;
      }

      if (f2current >= f2max && isHidden(button2)) {
        console.log('Sry, full lab 2. Closing the event.');
        closeMenuRow(36,0);
        closeMenuRow(37,0);
        return false;
      }

      if ((f2current < f2max) && (f1current < f1max) && !isHidden(button1)) {
        console.log('Click lab 1.');
        await delay(1000, 5000);
        button1.click();
      }
      if (!!f1current && (f2current < f2max) && !isHidden(button2)) {
        console.log('Click lab 2.');
        await delay(1000, 5000);
        button2.click();
      }
      let sec = randomInteger(1, 5);
      console.log(`Waiting ${sec} seconds.`);
      await delay(sec * 1000);
      return false;
    }
    async function destinyDozor() {
      if (attackEnabled) {
        let timerDozorAttackSpan = document.querySelector('.timer[href="dozor.php"] span');
        if (timerDozorAttackSpan) {
          let timerDozorAttack = getDateFromSpan(timerDozorAttackSpan);
          GM_setValue('main.timer.dozorAttack', timerDozorAttack);
          //console.log('timer dozor:', VALUES.main.timer.dozor, timerDozorAttack, getCountDownFromDate(timerDozorAttack)/1000);
        }

        let attackForm = document.querySelector('#attack_form');
        if (attackForm) {
          return destinyDozorAttack();
        }

        let dozorForm = document.querySelector('#watch_watch_select');
        if (!dozorForm) {
          throw new Error('Dozor: no health?!');
        }
      }

      if (arenaEnabled) {
        // ARENA TIMER
        let timerArenaScript = document.querySelector('.arena_wait_till + script');
        if (timerArenaScript) {
          let timerArena = getDateFromScript(timerArenaScript);
          GM_setValue('main.timer.arena', timerArena);
          //console.log('timer arena', timerArena, getCountDownFromDate(timerArena)/1000);
        }

        let arenaDiv = document.querySelector('.watch_main');
        let search = await destinyDozorArena1(arenaDiv);
        if (search) {
          return true;
        }

        let arenaEnemies = document.querySelector('#arena_enemies');
        let fight = await destinyDozorArena2(arenaEnemies);
        if (fight) {
          return true;
        }
      }

      // DOZOR MONSTER TIMER
      let timerDozorMonsterSpan = document.querySelector('.watch_no_monster + div span');
      if (timerDozorMonsterSpan) {
        let timerDozorMonster = getDateFromSpan(timerDozorMonsterSpan);
        GM_setValue('main.timer.dozorMonster', timerDozorMonster);
        //console.log('timer dozor monster:', timerDozorMonster, getCountDownFromDate(timerDozorMonster)/1000);
      }

      let monsterButton = document.querySelector('input[value="ИСКАТЬ СТРАШИЛКУ"]');
      if (monsterButton && isPetOutOfCage && !isHidden(monsterButton) && !isDisabled(monsterButton)) {
        console.log('Just clicking the monster button.');
        await delay(randomInteger(0, 500));
        monsterButton.click();
        return true;
      }

      if (attackEnabled) {
        let zorroAttack = document.querySelector('#form_zorro_advanced');
        if (zorroAttack && isPetOutOfCage) {
          await delay(randomInteger(2000, 4000));
          let button = zorroAttack.querySelector('input[value="ПОИСК"]');
          if (button && !isHidden(button) && !isDisabled(button)) {
            button.click();
            return true;
          }
        }

        let attack = document.querySelector('.watch_attack_level');
        if (attack && isPetOutOfCage) {
          await delay(randomInteger(2000, 4000));
          let button = attack.querySelector('input[value="ПОИСК"]');
          if (button && !isHidden(button) && !isDisabled(button)) {
            button.click();
            return true;
          }
        }
      }

      return false;
    }
    async function destinyDozorArena1(arenaDiv) { // Step 1: search
      if (!arenaDiv) {
        return false;
      }
      let arenaButton = arenaDiv.querySelector('a.arena_search');
      if (arenaButton && crystals >= 3) {
        console.log('click the arena button');
        arenaButton.click();
        return true;
      }
    }
    async function destinyDozorArena2(arenaEnemies) { // Step 2: fight
      if (!arenaEnemies) {
        return false;
      }
      if (randomInteger(0, 100) === 1) {
        VALUES.main.blackList.arena.cleanup(30);
      }
      let enemiesDiv = arenaEnemies.querySelectorAll('.arena_enemy');
      let enemies = [];
      for (let i = 0; i < enemiesDiv.length; i++) {
        let enemy = enemies[i] = {};
        enemy.name = enemiesDiv[i].querySelector('.arena_enemy_name').innerText;
        enemy.rep = toInteger(enemiesDiv[i].querySelector('.arena_enemy_stat div:first-child').innerText);
        enemy.link = enemiesDiv[i];
      }

      enemies = enemies.sort((a, b) => a.rep - b.rep);

      let preferredEnemies = enemies.filter(item => !VALUES.main.blackList.arena.existsBy('name', item.name))
      if (!preferredEnemies[0]) {
        let seriesCountSpan = document.querySelector('#t_help_102 span');
        let seriesCount = seriesCountSpan ? +seriesCountSpan.innerText.match(/Серия побед: (\d+)\./i)[1] : 0;
        let preferredSeriesCount = GM_setValue('main.arena.preferredSeriesCount', 25);
        if (seriesCount > preferredSeriesCount) {
          console.log('All enemies are in blacklist. Skip them by a leaf.');
          let leafButton = document.querySelector('.cmd_small_sl.cmd_asmall_sl.fl_r.can_disable');
          if (leafButton && !isHidden(leafButton) && !isDisabled(leafButton)) {
            leafButton.click();
            return true;
          }
        }
        preferredEnemies = enemies;
      }
      await delay(randomInteger(2000, 4000));
      preferredEnemies[0].link.click();
      return true;
    }
    async function destinyDozorAttack() {
      let stat = document.querySelector('.profile_statistic tr:last-child td:last-child');
      if (stat) {
        let bm = toInteger(stat.innerText);
        if (bm <= BM && bm >= 1000) {
          let attackButton = document.querySelector('input[value="НАПАСТЬ"]');
          if (attackButton && !isHidden(attackButton) && !isDisabled(attackButton)) {
            attackButton.click();
            return true;
          }
        }
        let nextButton = document.querySelector('input[value="НОВЫЙ ПОИСК"]');
        if (nextButton && !isHidden(nextButton) && !isDisabled(nextButton)) {
          nextButton.click();
          return true;
        }
      }
      throw new Error('dozor_attack: no stat to choose!');
    }
    async function destinyDozorMonster() {
      let dozorButton = document.querySelector('input[value="ИСКАТЬ СТРАШИЛКУ"]');
      if (dozorButton) {
        return destinyDozor();
      }
      let monsterButton = document.querySelector('input[value="НАПАСТЬ"]');
      if (monsterButton && !isHidden(monsterButton) && !isDisabled(monsterButton)) {
        console.log('Just clicking the monster button.');
        await delay(randomInteger(0, 500));
        monsterButton.click();
      }
      return true;
    }

    async function destinyChanneling() {
      let button = document.querySelector('.channeling_cmd[data-cmd="feed_free"] .w100');
      if (button && !isHidden(button) && !isDisabled(button)) {
        console.log('Just clicking the button.');
        await delay(randomInteger(0, 500));
        button.click();
        await delay(2000);
      }
      // CHANNELING TIMER
      let timerChannelingSpan = document.querySelector('.w100 span.js_timer');
      if (timerChannelingSpan) {
        let timerChanneling = getDateFromSpan(timerChannelingSpan);
        GM_setValue('main.timer.channeling', timerChanneling);
        //console.log('timer channeling:', timerChanneling, getCountDownFromDate(timerChanneling)/1000);
      }
      return false;
    }

    async function checkEvents(destiny = '') {
      console.log('Checking events...', destiny);
      let eventsBtn = document.querySelector('.tabs_right div[name="106"]');
      let currentBtn = document.querySelector('.tabs_right div.open');
      if (eventsBtn !== currentBtn) {
        eventsBtn.click();
        await delay(randomInteger(500, 1000));
      }
      let eventsDiv = document.querySelector('#events_scroll');
      let templeLink = eventsDiv.querySelector('a.clink[href="/temple.php?a=services"]');
      if (templeLink && !destiny.includes('temple')) {
        templeLink.click();
      }
      let eventArray = [
        18, // harbour_pier
        36, // lab
        73, // harbour_pier (buy_boat)
        95, // tunnels
      ];
      if (arenaEnabled && crystals >= 3 && !destiny.includes('dozor')) {
        eventArray.unshift(2); // arena
      }
      if (crystals >= 20 && !destiny.includes('workshop')) { // 10 or 20 - depends on potions and a guild
        eventArray.unshift(25); // farm_soap
        eventArray.unshift(26); // crystal_dust
      }
      if (isPetOutOfCage && !destiny.includes('dozor')) {
        eventArray.push(63); // dozor_monster
        if (attackEnabled) {
          eventArray.push(71); // dozor_attack
        }
      }
      let eventString = '#event_' + eventArray.join(', #event_');
      let events = eventsDiv.querySelectorAll(eventString);
      if (events.length) {
        for (let i = 0; i < events.length; i++) {
          let link = events[i].querySelector('a');
          if (!link) {
            throw new Error('events: no link event');
          }
          if (!isHidden(link)) {
            await delay(randomInteger(500, 2000));
            link.click();
            return;
          }
        }
      }
      if (eventsBtn !== currentBtn) {
        await delay(randomInteger(500, 2000));
        currentBtn.click();
      }
    }

    async function uncagePet(type = 7) {
      console.log('Uncaging a pet...');
      let pets = document.querySelectorAll('#pet');
      if (!pets) {
        if (crystals >= 50) {
          location.href = '/shop.php?g=7';
        }
        return false;
      }
      let petTypes = Array.from(pets).map(pet => {
        return {
          link: pet.querySelector('a.ico_cage_2'),
          requiredType: Array.from(pet.querySelector('.icon').classList).includes('pet' + type),
        }
      });
      let petToUncage = petTypes.filter(pet => pet.requiredType);
      if (!petToUncage || !petToUncage.length) {
        if (crystals >= 50) {
          console.log('No pet to uncage. Go to shop!');
          await delay(randomInteger(500, 2000));
          location.href = '/shop.php?g=7';
        }
        return false;
      }
      console.log('Have a pet to uncage...');
      petToUncage[0].link.click();
      await delay(randomInteger(2000, 4000));
      let linkToUncage = document.querySelector('a#mobile_pet_pricebtn');
      if (!linkToUncage) {
        throw new Error('no link to uncage a pet!');
      }
      let price = toInteger(document.querySelector('#mobile_pet_price').innerText);
      if (crystals >= price) {
        console.log('We\'re ready to uncage.');
        await delay(randomInteger(500, 2000));
        linkToUncage.click();
        return true;
      }
      console.log('We can\'t buy a pet.');
      return false;
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  function randomInteger(min, max) { // случайное число от min до (max+1)
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
  }
  function isDisabled(el) {
    return typeof el.disabled === 'string';
  }
  function isHidden(el) {
    if (!el) {
      return true;
    }
    return el.offsetParent === null;
  }
  function toInteger(int) {
    if (typeof int !== 'string') {
      return int;
    }
    return +(int.trim().split('.').join(''));
  }
  function getDateFromSpan(timerSpan) {
    return timerSpan
      ? new Date(+(timerSpan.attributes.timer.value.split('|')[0]) * 1e3)
      : 0;
  }
  function getDateFromScript(timerScript) {
    if (!timerScript) {
      return 0;
    }
    let timestampArray = timerScript.innerText.trim().replace(/[\r\n\t]+/g, '').match(/\d{10}/);
    if (timestampArray.length) {
      return new Date(+timestampArray[0] * 1e3);
    }
  }
  function getDateFromDiv(timerDiv) {
    if (!timerDiv) {
      return 0;
    }
    return new Date(timerDiv.getAttribute('timer_end') * 1e3);
  }
  function getCountDownFromDate(date) {
    return +date - +new Date;
  }
  function getNextDay() {
    let today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate()+1);
    tomorrow.setUTCHours(21,0,0,0); // MSK 00:00 is UTC+3
    return tomorrow;
  }
  function getGuild() {
    let list = document.querySelector('.guilds div a').classList;
    if (!list) {
      throw new Error('No guild list.');
    }
    if (list.contains('guild_4')) {
      return 'farm';
    }
    if (list.contains('guild_3')) {
      return 'mine';
    }
    if (list.contains('guild_2')) {
      return 'smith';
    }
    if (list.contains('guild_1')) {
      return 'trade';
    }
    return false;
  }
  function isInGuild(guild) {
    if (Array.isArray(guild)) {
      return guild.includes(getGuild());
    }
    return getGuild() === guild;
  }

  if (document.title.includes('Ведутся работы.')) {
    console.log('Maintenance.');
    return setTimeout(()=>location.reload(), randomInteger(600 * 1e3, 1200 * 1e3));
  }
  await destinyInit();
})();
