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

async function checkTimers() {
  let list = updateTimers();

  let sortedEntries = Object.entries(list)
    .filter(a => a[1] !== -1) // exclude disabled timers
    .sort((prev, curr) => +prev[1] > +curr[1]);

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
  // noinspection FallThroughInSwitchStatementJS
  switch (name) {
    case "workshop":
      let url = '/castle.php?a=';
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
      let isPetOutOfCage = !!document.querySelector('#pet .ico_cage_1');
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

function chooseYourDestiny(href) {
  console.log(`Choosing the destiny by href: ${href}`);
  if (href.match(/\/(?:m|battle|battleground|wedding|page|tavern|game)\.php/)) {
    return 'none';
  }
  if (href.includes('fight_log.php')
    && !href.includes('fightplace')
    && !href.includes('catacomb')) {
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

async function destinyMain() {
  console.log('Destiny init.');
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

    let destiny = chooseYourDestiny(location.href);
    let stayOnPage = false;

    if (destiny !== 'buy_pet' && !isPetOutOfCage && preferredPet) {
      await delay(randomInteger(500, 2000));
      await uncagePet();
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
}
