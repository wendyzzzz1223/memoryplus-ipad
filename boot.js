(function () {
  'use strict';
  // Preferences must not stop the app if the browser disables persistent storage.
  try {
    var key = 'memoryplus-storage-check';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
  } catch (_) {
    var memory = Object.create(null);
    try {
      Object.defineProperty(window, 'localStorage', { configurable: true, value: {
        getItem: function (key) { return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null; },
        setItem: function (key, value) { memory[key] = String(value); },
        removeItem: function (key) { delete memory[key]; },
        clear: function () { memory = Object.create(null); }
      }});
    } catch (_) {}
  }
  function showFailure(detail) {
    if (document.getElementById('memoryplus-load-error')) return;
    var box = document.createElement('section');
    box.id = 'memoryplus-load-error';
    box.style.cssText = 'position:fixed;inset:0;z-index:999999;background:#fdfaf5;color:#294e40;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:36px;text-align:center;font:24px/1.6 sans-serif';
    var title = document.createElement('h1'); title.textContent = '页面没有加载完整';
    var text = document.createElement('p'); text.textContent = '请确认上传了整个解压文件夹，再刷新一次。';
    var info = document.createElement('p'); info.textContent = detail; info.style.cssText = 'font-size:16px;max-width:800px;overflow-wrap:anywhere;margin:20px';
    var button = document.createElement('button'); button.textContent = '重新加载'; button.style.cssText = 'background:#345a4d;color:white;padding:16px 32px;border:0;border-radius:16px;font:24px sans-serif';
    button.onclick = function () { location.reload(); };
    box.append(title, text, info, button); document.body.append(box);
  }
  window.addEventListener('error', function (event) {
    var target = event.target;
    if (target && target.tagName === 'SCRIPT') {
      showFailure('脚本加载失败：' + (target.getAttribute('src') || '入口脚本'));
    }
  }, true);
  window.MemoryPlusBoot = {fail: function(error) {showFailure(error && error.message ? error.message : String(error));}};
  var delay;
  function ready() {
    var stage = document.getElementById('stage');
    if (!stage || stage.children.length) return;
    var loading = document.createElement('p'); loading.id = 'memoryplus-starting'; loading.textContent = 'Memory+ 正在加载…';
    loading.style.cssText = 'position:fixed;inset:40% 20px auto;text-align:center;color:#345a4d;font:28px sans-serif'; document.body.append(loading);
    var observer = new MutationObserver(function () {
      if (stage.children.length) { loading.remove(); observer.disconnect(); clearTimeout(delay); }
    }); observer.observe(stage, {childList:true});
    delay = setTimeout(function () { if (!stage.children.length) { loading.remove(); showFailure('入口页面未能启动，请将此页面截图反馈。'); } }, 15000);
  }
  document.addEventListener('DOMContentLoaded', ready);
}());
