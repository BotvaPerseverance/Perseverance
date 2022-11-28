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
// @match        https://avatar.botva.ru/*
// @run-at       document-end
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @require      common.js
// @require      avatar.js
// @require      main.destinies.js
// @require      main.js
// ==/UserScript==

(async () => {
  try {
    if (location.host.toLocaleLowerCase() === 'avatar.botva.ru') {
      let min = randomInteger(5, 15);
      setTimeout(() => {
        console.log(`We have ${min} minutes to complete all the tasks!`);
        location.href = 'https://avatar.botva.ru/avatara.php?a=jump';
      }, min*60000);
      return await destinyAvatar();
    }
    await destinyMain();
  } catch (e) {
    //console.error(e);
    //alert('Oopsie, something is wrong!\n' + e);
    GM_notification({
      title: 'Autobot error!!1',
      text: e.toString(),
      //image: ''
    });
  }
})();
