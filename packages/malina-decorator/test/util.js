exports.asyncTest = test => done => {
  let isDone = false;
  try {
    (async () => {
      let queue = [];
      let wake = null;
      let lock = new Promise(resolve => { wake = resolve; });

      await test(fn => (...args) => {
        queue.push(fn(...args).catch(err => {
          if (!isDone) {
            isDone = true;
            done(err);
          }
        }));
        if (wake != null)
          wake();
      });

      await lock;
      wake = null;

      while (queue.length > 0) {
        await Promise.all(queue);
        queue = [];
      }

      if (!isDone) {
        isDone = true;
        done();
      }
    })().catch(err => {
      if (!isDone) {
        isDone = true;
        done(err);
      }
    });
  } catch (err) {
    if (!isDone) {
      isDone = true;
      done(err);
    }
  }
};
