async function destinyAvatar() {
  let uptimeBtn = document.querySelector('#uptime_get_prize .uptime_btn div');
  if (uptimeBtn && !isHidden(uptimeBtn)) {
    console.log('Just clicking the button');
    uptimeBtn.click();
    await delay(randomInteger(1000, 5000));
    let submitBtn = document.querySelector('form.submit_by_ajax_popup_completed[action^="ajax.php?m=item_win&id=uptime"] .button_new:not(.green) input[type="submit"]');
    if (submitBtn) {
      await delay(randomInteger(1000, 5000));
      submitBtn.click();
    }
    let overlay = document.querySelector('#overlay_lPopup');
    if (overlay) {
      overlay.click();
    } else {
      await delay(randomInteger(1000, 5000));
      doReload();
    }
  }
  /*
    DRAGONS
    let link = document.querySelector('#menu a[href="event.php?a=dragons"]');
    if (link) {
      VALUES.avatar.dragons = true;
      location.href = '/event.php?a=dragons';
    }
    if (location.href.startsWith('/event.php?a=dragons')) {
      // DRAGONS TIMER
      let timerSpan = document.querySelector('#counter_1');
      if (timerSpan) {
        let timerDragons = getDateFromSpan(timerSpan);
        GM_setValue('avatar.timer.dragons', timerDragons);
        //console.log('timer dragons', timerDragons, getCountDownFromDate(timerDragons)/1000);
        return false;
      }
      let button = document.querySelector('.button_new.ml10');
        console.log(button);
      //button.click();
    }
  */
}
