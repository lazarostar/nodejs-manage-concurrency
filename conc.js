let taskList = [], // list of names of tasks to process, e.g. ['a', 'b', 'c']
  activeTaskList = [], // list of promises for tasks being processed
  counter, // counter for iteration of tasks
  concurrencyMax, // maximum number of tasks that can be processed concurrently
  concurrencyPromise; // promise for processing tasks concurrently

/**
 * Returns new promise with resolve and reject function
 *
 * @param {Promise} promise promise to be wrapped
 * @returns {Promise} new promise with resolve and reject function
 */
function wrapPromise(promise) {
  let resolve, reject;
  let newPromise = Promise.race([
    promise,
    new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    }),
  ]);
  newPromise.resolve = resolve;
  newPromise.reject = reject;
  return newPromise;
}

/**
 * Setup keyboard listner to enable users to change concurrencyMax
 */
function setupKeyboardListner() {
  const readline = require("readline");
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on("keypress", (str, key) => {
    if (key.ctrl && key.name === "c") {
      process.exit();
    } else {
      const n = Number(str);
      // if the user types number then change conccurencyMax
      if (!isNaN(n)) {
        concurrencyMax = n;
        console.log(`**** changing concurrency to ${concurrencyMax} ****`);

        // force resolve the promise
        concurrencyPromise.resolve();
      }
    }
  });
}

/**
 * Initialize global variables, wait for all tasks to finish and then exit
 */
async function init() {
  console.log("INIT...");
  counter = 0;
  concurrencyMax = 4;
  const taskCount = 26;
  taskList = [...Array(taskCount)].map((_, i) => String.fromCharCode(97 + i));
  console.log("[init] Concurrency Algo Testing...");
  console.log("[init] Tasks to process:", "\x1b[36m", taskCount, "\x1b[0m");
  console.log("[init] Task list:", taskList.join(","));
  console.log(
    "[init] Maximum Concurrency:",
    "\x1b[36m",
    concurrencyMax,
    "\x1b[0m\n"
  );

  await manageConcurrency();

  console.log("All tasks successfully completed.");
  process.exit();
}

/**
 * Process tasks
 */
async function manageConcurrency() {
  while (counter < taskList.length || activeTaskList.length) {
    // make sure that maximum number of tasks are running
    while (
      activeTaskList.length < concurrencyMax &&
      counter < taskList.length
    ) {
      activeTaskList.push(doTask(taskList[counter++]));
    }

    // await until any of the active tasks finish (wrap promise in order to force resolve when changing concurrencyMax)
    concurrencyPromise = wrapPromise(Promise.race(activeTaskList));
    await concurrencyPromise;

    // filter out finished
    activeTaskList = activeTaskList.filter(
      (activeTask) => !activeTask.resolved()
    );
  }
}

/**
 * Create and return new promise of the task
 *
 * @param {string} taskName Name of the task to start
 * @returns {Promise} Promise created for the task
 */
function doTask(taskName) {
  const begin = Date.now();

  // Keep track of the status of the promise
  let isResolved = false;

  // Log
  console.log(
    "\x1b[31m[TASK] STARTING: %s\x1b[0m (Concurrency: \x1b[33m%d\x1b[0m of \x1b[33m%d\x1b[0m, Task count: \x1b[33m%d\x1b[0m of \x1b[33m%d\x1b[0m)",
    taskName,
    activeTaskList.length + 1,
    concurrencyMax,
    counter,
    taskList.length
  );

  const promise = new Promise(function (resolve, reject) {
    setTimeout(function () {
      const end = Date.now();
      const timeSpent = end - begin;

      // Log
      console.log(
        "\x1b[36m[TASK] FINISHED: %s in %dms\x1b[0m (Concurrency: \x1b[33m%d\x1b[0m of \x1b[33m%d\x1b[0m, Task count: \x1b[33m%d\x1b[0m of \x1b[33m%d\x1b[0m)",
        taskName,
        timeSpent,
        activeTaskList.length - 1,
        concurrencyMax,
        counter,
        taskList.length
      );

      resolve(true);
    }, Math.random() * 5000);
  }).then(() => {
    // Change the status of the promise to resolved
    isResolved = true;
  });

  // Add resolved function to the promise object for querying status of the promise, thanks to closure
  promise.resolved = () => isResolved;

  return promise;
}

setupKeyboardListner();
init();
