mergeInto(LibraryManager.library, {
  TaalufSendToPage: function (ptr) {
    var msg = UTF8ToString(ptr);
    try {
      var data = JSON.parse(msg);
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, window.location.origin || '*');
      }
      window.dispatchEvent(new CustomEvent('taaluf-little-hero', { detail: data }));
    } catch (e) {
      console.warn('TaalufSendToPage', e);
    }
  }
});
