/* Runs before first paint: show the video intro once per browser session. */
(function () {
  try {
    var force = /[?&]intro=1/.test(location.search);
    if (force || !sessionStorage.getItem('vicora_intro_seen')) document.documentElement.classList.add('intro-on');
  } catch (e) { document.documentElement.classList.add('intro-on'); }
})();
