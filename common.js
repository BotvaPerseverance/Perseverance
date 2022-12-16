// devs broke all popups
let popups = [];
if ($) {
  $(function () {
    $(document).ready(() => {
      jQuery.ajaxSetup({
        beforeSend: (() => {
        })
      });
    })
  });
}

(() => {
  if (document.title.includes('Ведутся работы.')) {
    console.log('Maintenance.');
    return setTimeout(()=>location.reload(), randomInteger(600 * 1e3, 1200 * 1e3));
  }
})();

// ---------------------------------
// COMMON FUNCTIONS
// ---------------------------------

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
    ? +new Date(+(timerSpan.attributes.timer.value.split('|')[0]) * 1e3)
    : 0;
}

function getDateFromScript(timerScript) {
  if (!timerScript) {
    return 0;
  }
  let timestampArray = timerScript.innerText.trim().replace(/[\r\n\t]+/g, '').match(/\d{10}/);
  if (timestampArray.length) {
    return +new Date(+timestampArray[0] * 1e3);
  }
}

function getDateFromDiv(timerDiv) {
  if (!timerDiv) {
    return 0;
  }
  return +new Date(timerDiv.getAttribute('timer_end') * 1e3);
}

function getCountDownFromDate(date) {
  return +date - +new Date;
}

function getNextDay() {
  let today = new Date();
  let tomorrow = new Date();
  tomorrow.setDate(today.getDate()+1);
  tomorrow.setUTCHours(21,0,0,0); // MSK 00:00 is UTC+3
  return +tomorrow;
}

function getNextHour() {
  let today = new Date();
  let future = new Date();
  future.setHours(today.getHours()+1);
  return +future;
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
      exists[0].updated = +new Date();
    } else {
      this._array.push({
        name,
        created: +new Date(),
        updated: +new Date()
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

// IDE workarounds
if (typeof closeMenuRow !== "function") closeMenuRow = () => {};
if (typeof doReload !== "function") doReload = () => location.reload();
if (typeof GM_getValue !== "function") GM_getValue = () => {};
if (typeof GM_setValue !== "function") GM_setValue = () => {};
if (typeof GM_notification !== "function") GM_notification = () => {};
