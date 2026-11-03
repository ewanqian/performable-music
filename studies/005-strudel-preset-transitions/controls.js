// Original page controls using the public StrudelMirror API.
const panels = [...document.querySelectorAll('main section')];
const statusOf = panel => panel.querySelector('.status');
const loadTimer = setTimeout(() => {
  for (const panel of panels) statusOf(panel).textContent = 'Strudel 加载失败或较慢，请检查网络后刷新。';
}, 30000);

async function stopAll() {
  for (const panel of panels) {
    await panel.querySelector('strudel-editor').editor?.stop();
    statusOf(panel).textContent = '已停止';
  }
}

customElements.whenDefined('strudel-editor').then(() => {
  clearTimeout(loadTimer);
  for (const panel of panels) {
    const repl = panel.querySelector('strudel-editor');
    const play = panel.querySelector('.play');
    const stop = panel.querySelector('.stop');
    play.disabled = false;
    stop.disabled = false;
    statusOf(panel).textContent = '点击播放；开头两小节为留白。';
    repl.addEventListener('update', event => {
      if (event.detail?.error) statusOf(panel).textContent = `播放错误：${event.detail.error.message || event.detail.error}`;
    });
    play.addEventListener('click', async () => {
      play.disabled = true;
      try {
        await stopAll();
        statusOf(panel).textContent = '播放中；修改代码后点击此按钮更新。';
        await repl.editor.evaluate();
      } catch (error) {
        statusOf(panel).textContent = `播放失败：${error.message}`;
      } finally {
        play.disabled = false;
      }
    });
    stop.addEventListener('click', stopAll);
  }
});
