let crystalsSpan = document.querySelector('#crystal_upd_data');
let crystals = crystalsSpan ? toInteger(crystalsSpan.innerText) : 0;
let isPetOutOfCage = !!document.querySelector('#pet .ico_cage_1');

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
    channeling: GM_getValue('main.timer.channeling', -1)
  };
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
  inputs.forEach(input => { // TODO: click in series
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
        GM_setValue('main.timer.workshop', getNextHour());
        return false;
      }
      if (isInGuild('farm')) {
        let slavesSpan = document.querySelector('#slaves_count'); // for farmers!
        let slavesCount = toInteger(slavesSpan.innerText);
        if (!slavesCount) {
          console.log('No slaves.');
          GM_setValue('main.timer.workshop', getNextHour());
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
    GM_setValue('main.timer.tunnels', getNextHour());
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

  let [, f1current, f1max] = f1.innerText.match(/([0-9]+)\/([0-9]+)/);
  let [, f2current, f2max] = f2.innerText.match(/([0-9]+)\/([0-9]+)/);

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
  let count = document.querySelector('.borderb.mb10.pb10 b:first-child');
  if (count && +count.innerText >= 300) {
    console.log('Channeling: complete');
    GM_setValue('main.timer.channeling', 0);
    return false;
  }
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