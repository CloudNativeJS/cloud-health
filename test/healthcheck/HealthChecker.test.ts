/*
 * Copyright IBM Corporation 2018
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { should, expect } from 'chai';
import { HealthChecker, State, Plugin, ReadinessCheck, LivenessCheck, ShutdownCheck, PingCheck } from '../../index';
should();

describe('Health Checker test suite', () => {

  it('Startup reports DOWN', async () => {
    let healthcheck = new HealthChecker()
    const promise = new Promise<void>((_resolve, _reject) => {
      throw new Error("Startup Failure");
    });
    let check = new ReadinessCheck("check", promise)

    await healthcheck.registerReadinessCheck(check);
    const status = await healthcheck.getStatus();
    const result = status.status

    expect(result).to.equal(State.DOWN, `Should return: ${State.DOWN} , but returned: ${result}`)
  });

  it('Startup reports UP', async () => {
    let healthcheck = new HealthChecker()
    // tslint:disable-next-line:no-shadowed-variable
    const promise = new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let check = new ReadinessCheck("check", promise)
    await healthcheck.registerReadinessCheck(check);
    const status = await healthcheck.getStatus();
    const result = status.status
    expect(result).to.equal(State.UP, `Should return: ${State.UP} , but returned: ${result}`)
  });

  it('Startup reports STARTING when first is starting and second is up', async () => {
    let healthcheck = new HealthChecker()

    const Check1 = new Promise<void>((resolve, _reject) => {
      setTimeout(() => {
        process.kill(process.pid, 'SIGTERM')
      }, 1000);
    });

    let check1 = new ReadinessCheck('Check1', Check1);
    healthcheck.registerReadinessCheck(check1);

    const Check2 = new Promise<void>((resolve, _reject) => {
      resolve();
    });

    let check2 = new ReadinessCheck('Check2', Check2);
    await healthcheck.registerReadinessCheck(check2)

    const status = await healthcheck.getStatus()
    const result = JSON.stringify(status);
    let expected = "{\"status\":\"STARTING\",\"checks\":[{\"name\":\"Check1\",\"state\":\"STARTING\",\"data\":{\"reason\":\"\"}},{\"name\":\"Check2\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Startup reports STARTING when first is up and the second is starting', async () => {
    let healthcheck = new HealthChecker()

    const Check1 = new Promise<void>((resolve, _reject) => {
      resolve();
    });

    let check1 = new ReadinessCheck('Check1', Check1);
    await healthcheck.registerReadinessCheck(check1);

    const Check2 = new Promise<void>((resolve, _reject) => {
      setTimeout(() => {
        process.kill(process.pid, 'SIGTERM')
      }, 1000);
    });
    let check2 = new ReadinessCheck('Check2', Check2);
    healthcheck.registerReadinessCheck(check2);

    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status);
    let expected = "{\"status\":\"STARTING\",\"checks\":[{\"name\":\"Check1\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}},{\"name\":\"Check2\",\"state\":\"STARTING\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Startup reports STARTING with returned Promise', async () => {
    let healthcheck = new HealthChecker()

    const promise = new Promise<void>((_resolve, _reject) => {
      // tslint:disable-next-line:no-shadowed-variable no-unused-expression
      new Promise((resolve, _reject) => {
        setTimeout(resolve, 100, 'foo');
      });
    });
    let check = new ReadinessCheck("check", promise)
    healthcheck.registerReadinessCheck(check)

    const status = await healthcheck.getStatus();
    const result = status.status
    expect(result).to.equal(State.STARTING, `Should return: ${State.STARTING} , but returned: ${result}`)
  });

  it('Startup reports STARTING without returned Promise', () => {
    let healthcheck = new HealthChecker()
    const promise = new Promise<void>((_resolve, _reject) => {
      // tslint:disable-next-line:no-unused-expression no-shadowed-variable
      new Promise((resolve, _reject) => {
        setTimeout(resolve, 100, 'foo');
      });
    });
    let check = new ReadinessCheck("check", promise)
    healthcheck.registerReadinessCheck(check)
      .then(() => {
        return healthcheck.getStatus().then((status) => {
          const result = status.status

          expect(result).to.equal(State.STARTING, `Should return: ${State.STARTING} , but returned: ${result}`)
        });
      });
  });

  it('Startup reports STARTING when multiple checks are still starting', async () => {
    let healthcheck = new HealthChecker()
    const promise1 = new Promise<void>((_resolve, _reject) => {
      // tslint:disable-next-line:no-unused-expression no-shadowed-variable
      new Promise((resolve, _reject) => {
        setTimeout(resolve, 100, 'foo');
      });
    });
    let check1 = new ReadinessCheck("check", promise1);

    const promise2 = new Promise<void>((_resolve, _reject) => {
      // tslint:disable-next-line:no-unused-expression no-shadowed-variable
      new Promise((resolve, _reject) => {
        setTimeout(resolve, 100, 'foo');
      });
    });
    let check2 = new ReadinessCheck("check", promise2)

    healthcheck.registerReadinessCheck(check1);
    healthcheck.registerReadinessCheck(check2);

    const status = await healthcheck.getStatus()
    const result = status.status
    expect(result).to.equal(State.STARTING, `Should return: ${State.STARTING} , but returned: ${result}`)
  });

  it('Health reports UP by default', async () => {
    let healthcheck = new HealthChecker()
    const status = await healthcheck.getStatus();
    let result = status.status;
    expect(result).to.equal(State.UP, `Should return: ${State.UP}, but returned: ${result}`);
  });

  it('Health reports UP and empty checks array no registered checks', async () => {
    let healthcheck = new HealthChecker()
    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"UP\",\"checks\":[]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Health reports UP and check result with single registered check', async () => {
    let healthcheck = new HealthChecker();
    // tslint:disable-next-line:no-shadowed-variable
    const promise = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let check = new LivenessCheck("check", promise)
    healthcheck.registerLivenessCheck(check)

    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  })

  it('Health reports UP and check result with two registered checks', async () => {
    let healthcheck = new HealthChecker();
    // tslint:disable-next-line:no-shadowed-variable
    const promiseone = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let checkone = new LivenessCheck("checkone", promiseone)

    // tslint:disable-next-line:no-shadowed-variable
    const promisetwo = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let checktwo = new LivenessCheck("checktwo", promisetwo)

    healthcheck.registerLivenessCheck(checkone)
    healthcheck.registerLivenessCheck(checktwo)

    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status);

    let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"checkone\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  })

  it('Health reports DOWN and check result with single failed check', async () => {
    let healthcheck = new HealthChecker();
    const promise = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("Startup Failure");
    });
    let check = new LivenessCheck("check", promise);
    healthcheck.registerLivenessCheck(check);

    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status);

    let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Startup Failure\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Health reports DOWN and check result with single rejected check', async () => {
    let healthcheck = new HealthChecker();
    const promise = () => new Promise<void>((_resolve, reject) => {
      reject(new Error("Startup Failure"));
    });
    let check = new LivenessCheck("check", promise)
    healthcheck.registerLivenessCheck(check)

    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Startup Failure\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Health reports UP with running PingCheck', async () => {
    let healthcheck = new HealthChecker();

    let check = new PingCheck("google.com")

    healthcheck.registerLivenessCheck(check)
    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"PingCheck HEAD:google.com:80/\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Health reports DOWN with failing PingCheck', async () => {
    let healthcheck = new HealthChecker();

    let check = new PingCheck("not-an-address.com")

    healthcheck.registerLivenessCheck(check)
    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"PingCheck HEAD:not-an-address.com:80/\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Failed to ping HEAD:not-an-address.com:80/: getaddrinfo ENOTFOUND not-an-address.com not-an-address.com:80\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Health reports DOWN and check result with one passed and one failed registered checks', async () => {
    let healthcheck = new HealthChecker();

    const promiseone = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("Startup Failure");
    })
    let checkone = new LivenessCheck("checkone", promiseone)

    const promisetwo = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let checktwo = new LivenessCheck("checktwo", promisetwo)

    healthcheck.registerLivenessCheck(checkone)
    healthcheck.registerLivenessCheck(checktwo)

    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status);

    let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Startup Failure\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Shutdown reports STOPPED once stopped', async () => {
    process.removeAllListeners('SIGTERM');
    let healthcheck = new HealthChecker();
    // tslint:disable-next-line:no-shadowed-variable
    const promiseone = new Promise<void>((resolve, _reject) => {
      setTimeout(resolve, 50);
    });
    let checkone = new ShutdownCheck("checkone", promiseone)
    healthcheck.registerShutdownCheck(checkone)

    let result;
    await new Promise((resolve) => {
      process.once('SIGTERM', async () => {
        // Give shutdown a chance to process
        await setTimeout(async () => {
          const status = await healthcheck.getStatus()
          result = status.status;
          resolve();
        }, 100);
      });
      process.kill(process.pid, 'SIGTERM');
    });

    const expected = State.STOPPED;
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  })

  it('Shutdown reports STOPPING whilst stopping', async () => {
    process.removeAllListeners('SIGTERM');
    let healthcheck = new HealthChecker();

    const promiseone = new Promise<void>((_resolve, _reject) => {
      // tslint:disable-next-line:no-shadowed-variable no-unused-expression
      new Promise((resolve, _reject) => {
        setTimeout(resolve, 1000, 'foo');
      });
    });

    let checkone = new ShutdownCheck("checkone", promiseone)
    healthcheck.registerShutdownCheck(checkone)

    let result;
    await new Promise(resolve => {
      process.once('SIGTERM', async () => {
        const status = await healthcheck.getStatus();
        result = status.status;
        resolve()
      });
      process.kill(process.pid, 'SIGTERM')
    });

    const expected = State.STOPPING;
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  })

  it('Shutdown reports STOPPED and DOWN for check for error during shutdown', async () => {
    process.removeAllListeners('SIGTERM');
    let healthcheck = new HealthChecker();

    const promise = new Promise<void>((_resolve, _reject) => {
      throw new Error("Shutdown Failure");
    });

    let checkone = new ShutdownCheck("checkone", promise)
    healthcheck.registerShutdownCheck(checkone)

    let result;
    await new Promise(resolve => {
      process.once('SIGTERM', async () => {
        // must be wrapped in timeout to simulate a node tick to ensure "process.on('SIGTERM', this.onShutdownRequest)" have been executed
        setTimeout(async () => {
          const status = await healthcheck.getStatus();
          result = JSON.stringify(status);
          resolve();
        });
      });
      process.kill(process.pid, 'SIGTERM')
    });

    const expected = "{\"status\":\"STOPPED\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Shutdown Failure\"}}]}";
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Shutdown reports STOPPED and DOWN/DOWN for check for error during shutdown', async () => {
    process.removeAllListeners('SIGTERM');
    let healthcheck = new HealthChecker();

    const promiseone = new Promise<void>((_resolve, _reject) => {
      throw new Error("Shutdown Failure");
    });
    let checkone = new ShutdownCheck("checkone", promiseone)
    healthcheck.registerShutdownCheck(checkone)

    const promisetwo = new Promise<void>((_resolve, _reject) => {
      throw new Error("Shutdown Failure");
    });
    let checktwo = new ShutdownCheck("checktwo", promisetwo)
    healthcheck.registerShutdownCheck(checktwo)

    let result;
    await new Promise(resolve => {
      process.once('SIGTERM', () => {
        // must be wrapped in timeout to simulate a node tick to ensure "process.on('SIGTERM', this.onShutdownRequest)" have been executed
        setTimeout(async () => {
          const status = await healthcheck.getStatus()
          result = JSON.stringify(status);
          resolve()
        });
      });
      process.kill(process.pid, 'SIGTERM')
    });

    let expected = "{\"status\":\"STOPPED\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Shutdown Failure\"}},{\"name\":\"checktwo\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Shutdown Failure\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  })

  it('Shutdown reports STOPPING and STOPPED/STOPPING for checks for one complete and one running shutdown', async () => {
    process.removeAllListeners('SIGTERM');
    let healthcheck = new HealthChecker();

    // tslint:disable-next-line:no-shadowed-variable
    const promiseone = new Promise<void>((resolve, _reject) => {
      resolve()
    });

    let checkone = new ShutdownCheck("checkone", promiseone)
    healthcheck.registerShutdownCheck(checkone)

    const promisetwo = new Promise<void>((_resolve, _reject) => {
      // tslint:disable-next-line:no-shadowed-variable no-unused-expression
      new Promise((resolve, _reject) => {
        setTimeout(resolve, 1000, 'foo');
      });
    });

    let checktwo = new ShutdownCheck("checktwo", promisetwo)
    healthcheck.registerShutdownCheck(checktwo)

    let result
    await new Promise(resolve => {
      process.once('SIGTERM', () => {
        setTimeout(async () => {
          const status = await healthcheck.getStatus();
          result = JSON.stringify(status);
          resolve();
        });
      });
      process.kill(process.pid, 'SIGTERM');
    });

    const expected = "{\"status\":\"STOPPING\",\"checks\":[{\"name\":\"checkone\",\"state\":\"STOPPED\",\"data\":{\"reason\":\"\"}},{\"name\":\"checktwo\",\"state\":\"STOPPING\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });
});
