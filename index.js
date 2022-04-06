const { spawn, spawnSync, execSync, exec } = require("child_process");

const axios = require("axios");

let currentFilename = null;
function runServer1(command, cb) {
  const commands = command.trim().split(" ");
  const filename = commands[commands.length - 1];
  currentFilename = filename;
  return exec(command, cb);
}

// const result = exec('pm2 start server0.js', (err, stdio) => {
//   console.log(stdio.toString());
// })
// setTimeout(() => {
//   exec('pm2 delete server0.js')
// }, 5000)

function runServer(successFn, errFn, ...args) {
  const command = spawn(...args);

  command.stdout.on("data", successFn);

  command.stderr.on("data", errFn);

  command.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
  });

  return command;
}

// let server = runServer(
//   (data) => {
//     console.log("cdn版本");
//     console.log(`stdout: ${data}`);
//   },
//   (err) => {
//     console.error(`stderr: ${data}`);
//   },
//   "pm2 start",
//   ["server0.js"]
// );

let server = runServer1("pm2 start server0.js");

// 成功次数
let successTime = 0;
// 成功定时器回调函数的返回值
let successTimer;

// 0代表使用cdn，1代表没有使用
let flag = 0;

let errTime = 0;
const maxErrTime = 5;

async function recurse(i) {
  if (i >= 5) return;

  try {
    const { status } = await axios.get("http://121.40.18.63:8080");

    if ((status >= 200 && status < 300) || status === 304) {
      console.log("success", i);
      successTime++;
      if (successTime === 4) {
        successTime = 0;
        if (successTimer) clearTimeout(successTimer);

        if (flag === 1) {
          // 执行命令切换到cdn版本
          // console.log("cdn恢复正常,切换为cdn版本", successTime);
          // server.kill();
          // server = runServer(
          //   (data) => {
          //     console.log("cdn版本已启动");
          //     console.log(`stdout: ${data}`);
          //     flag = 0;
          //     errTime = 0;
          //   },
          //   (err) => {
          //     console.error(`stderr: ${data}`);
          //   },
          //   "pm2",
          //   ["start", "server0.js"]
          // );
          runServer1(`pm2 delete ${currentFilename}`);
          runServer1("pm2 start server0.js");
          console.log("cdn版本已启动");
          flag = 0;
          errTime = 0;
        }

        setTimeout(() => {
          console.log("重新检测");
          recurse(0);
        }, 10000);
      } else {
        recurse(i + 1);
      }
    }
  } catch (err) {
    errTime++;
    if (errTime === maxErrTime && flag === 0) {
      // 请求错误次数大于最大限度，并且当前是cdn模式
      if (successTimer) clearTimeout(successTimer);
      // 执行命令，切换到本地版本
      console.log("cdn异常,切换到本地版本");
      // server.kill();
      // server = runServer(
      //   (data) => {
      //     console.log("cdn异常，切换为本地版本");
      //     console.log(`stdout: ${data}`);

      //     flag = 1;

      //     recurse(0);
      //   },
      //   (err) => {
      //     console.error(`stderr: ${data}`);
      //   },
      //   "pm2",
      //   ["start", "server1.js"]
      // );
      runServer1(`pm2 delete ${currentFilename}`);
      runServer1("pm2 start server1.js");
      flag = 1;

      recurse(0);
    } else if (errTime < maxErrTime) {
      // 请求次数小于最大限度
      recurse(i);
    } else {
      // 请求次数大于最大限度
      console.log("检测cdn是否正常", i);
      setTimeout(() => {
        recurse(0);
      }, 10000);
    }
  }
}

recurse(0);

// process.stdin.resume();//so the program will not close instantly

// function exitHandler(options, exitCode) {
//   console.log('退出');
//     if (options.cleanup) console.log('clean');
//     if (exitCode || exitCode === 0) console.log(exitCode);
//     if (options.exit) process.exit();
// }

// //do something when app is closing
// process.on('exit', exitHandler.bind(null,{cleanup:true}));

// //catches ctrl+c event
// process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// // catches "kill pid" (for example: nodemon restart)
// process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
// process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

// //catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

process.on("SIGINT", () => {
  runServer1(`pm2 delete ${currentFilename}`, (err, stdout) => {
    process.exit()
  });
});


process.on('SIGUSR1', () => {
  runServer1(`pm2 delete ${currentFilename}`, (err, stdout) => {
    process.exit()
  });
});
process.on('SIGUSR2',  () => {
  runServer1(`pm2 delete ${currentFilename}`, (err, stdout) => {
    process.exit()
  });
});

