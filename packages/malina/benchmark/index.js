const tests = require('./test');

tests.forEach(test => test
  .on('complete start', event => {
    console.log('');
  })
  .on('cycle', event => {
    console.log(`${event.target}`);
  })
  .run({ async: true }));
