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
import { HealthChecker, State, Plugin, StartupCheck, ReadinessCheck, LivenessCheck, ShutdownCheck, PingCheck } from '../../index';
import { HealthStatus } from '../../src/healthcheck/HealthChecker';
should();

describe('Health Checker test suite', () => {

  
  it('Startup reports DOWN', async () => {
    let healthCheck = new HealthChecker();
    const promise = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("Startup Failure");
    });
    let check = new StartupCheck("check", promise);

    await healthCheck.registerStartupCheck(check);
    const status = await healthCheck.getStatus();
    const result = status.status;
    expect(result).to.equal(State.DOWN, `Should return: ${State.DOWN} , but returned: ${result}`);
  });

  it('Startup reports UP', async () => {
    let healthCheck = new HealthChecker();
    // tslint:disable-next-line:no-shadowed-variable
    const promise = () => new Promise<void>((resolve, _reject) => {
      resolve();
    });
    let check = new StartupCheck("check", promise);
    await healthCheck.registerStartupCheck(check);
    const status = await healthCheck.getStatus();
    const result = status.status;
    expect(result).to.equal(State.UP, `Should return: ${State.UP} , but returned: ${result}`);
  });

  it('Startup reports STARTING when first is starting and second is up', async () => {
    let healthCheck = new HealthChecker();

    const Check1 = () => new Promise<void>((resolve, _reject) => {
      setTimeout(resolve, 1000, 'foo');
    });

    let check1 = new StartupCheck('Check1', Check1);
    healthCheck.registerStartupCheck(check1);

    const Check2 = () => new Promise<void>((resolve, _reject) => {
      resolve();
    });

    let check2 = new StartupCheck('Check2', Check2);

    //don't await as the check should not be resolved or rejected -> resembles an app starting
    healthCheck.registerStartupCheck(check2);
    const status = await healthCheck.getStatus();
    const result = status.status;
    const expected = State.STARTING;
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Health reports STARTING with a pending startUp check', async() => {
    let healthCheck = new HealthChecker();

    const Check1 = () => new Promise<void>((resolve,_reject) => {
      setTimeout(resolve, 100, 'foo');
    });

    let startCheck = new StartupCheck('StartCheck',Check1);
    healthCheck.registerStartupCheck(startCheck);
    const status = await healthCheck.getStatus();
    const result = status.status;
    const expected = State.STARTING;
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Liveness reports UP with a pending startUp check that will resolve', async() => {
    let healthCheck = new HealthChecker();

    const Check1 = () => new Promise<void>((resolve,_reject) => {
      setTimeout(resolve, 100, 'foo');
    });

    let startCheck = new StartupCheck('StartCheck',Check1);
    healthCheck.registerStartupCheck(startCheck);
    const status = await healthCheck.getLivenessStatus();
    const result = status.status;
    const expected = State.UP;
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Liveness reports DOWN with a pending startUp check that will fail', async() => {
    let healthCheck = new HealthChecker();

    const Check1 = () => new Promise<void>((_resolve,reject) => {
      setTimeout(reject, 1000, 'foo');
    });

    let startCheck = new StartupCheck('StartCheck',Check1);
    healthCheck.registerStartupCheck(startCheck);
    const status = await healthCheck.getLivenessStatus();
    const result = status.status;
    const expected = State.DOWN;
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Readiness reports UP with a pending startUp check that will resolve', async() => {
    let healthCheck = new HealthChecker();

    const Check1 = () => new Promise<void>((resolve,_reject) => {
      setTimeout(resolve, 100, 'foo');
    });

    let startCheck = new StartupCheck('StartCheck',Check1);
    healthCheck.registerStartupCheck(startCheck);
    const status = await healthCheck.getReadinessStatus();
    const result = status.status;
    const expected = State.UP;
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Readiness reports DOWN with a pending startUp check that will fail', async() => {
    let healthCheck = new HealthChecker();

    const Check1 = () => new Promise<void>((resolve,reject) => {
      setTimeout(reject, 100, 'foo');
    });

    let startCheck = new StartupCheck('StartCheck',Check1);
    healthCheck.registerStartupCheck(startCheck);
    const status = await healthCheck.getReadinessStatus();
    const result = status.status;
    const expected = State.DOWN;
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Startup reports STARTING when first is up and the second is starting', async () => {
    let healthCheck = new HealthChecker();

    const Check1 = () => new Promise<void>((resolve, _reject) => {
      resolve();
    });

    let check1 = new StartupCheck('Check1', Check1);
    healthCheck.registerStartupCheck(check1);

    const Check2 = () => new Promise<void>((resolve, _reject) => {
      setTimeout(resolve,1000,'foo');
    });

    let check2 = new StartupCheck('Check2', Check2);
    healthCheck.registerStartupCheck(check2);   //do not await as its starting but not complete
    const status = await healthCheck.getStatus();
    const result = status.status;
    const expected = State.STARTING;
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Startup reports STARTING with returned Promise', async () => {  //check this bad boi
    let healthCheck = new HealthChecker();

    const promise = () => new Promise<void>((_resolve, _reject) => {
      // tslint:disable-next-line:no-shadowed-variable no-unused-expression
      new Promise((resolve, _reject) => {
        setTimeout(resolve, 1000, 'foo');
      });
    });
    let check = new StartupCheck("check", promise);
    healthCheck.registerStartupCheck(check)
    .then(async () => {
      const status = await healthCheck.getStatus();
      const result = status.status;
      expect(result).to.equal(State.STARTING, `Should return: ${State.STARTING} , but returned: ${result}`);
    });
  });

  it('Startup reports STARTING without returned Promise', async () => { //check this bad boi
    let healthCheck = new HealthChecker()
    const promise = () => new Promise<void>((_resolve, _reject) => {
    // tslint:disable-next-line:no-unused-expression no-shadowed-variable
      new Promise((resolve, _reject) => {
        setTimeout(resolve, 1000, 'foo');
      });
    });
    let check = new StartupCheck("check", promise)
    healthCheck.registerStartupCheck(check)
    .then(async () => {
      const status = await healthCheck.getStatus();
      const result = status.status;
      expect(result).to.equal(State.STARTING, `Should return: ${State.STARTING} , but returned: ${result}`);
    });
  });

  it('Startup reports STARTING when multiple checks are still starting', async () => {  //check this bad boi
    let healthCheck = new HealthChecker()
    const promise1 = () => new Promise<void>((_resolve, _reject) => {
      // tslint:disable-next-line:no-unused-expression no-shadowed-variable
      new Promise((resolve, _reject) => {
        setTimeout(resolve, 1000, 'foo');
      });
    });
    let check1 = new StartupCheck("check", promise1);

    const promise2 = () => new Promise<void>((_resolve, _reject) => {
      // tslint:disable-next-line:no-unused-expression no-shadowed-variable
      new Promise((resolve, _reject) => {
        setTimeout(resolve, 100, 'foo');
      });
    });
    let check2 = new StartupCheck("check", promise2)

    healthCheck.registerStartupCheck(check1);
    healthCheck.registerStartupCheck(check2)
    .then(async() => {
      const status = await healthCheck.getStatus()
      const result = status.status
       expect(result).to.equal(State.STARTING, `Should return: ${State.STARTING} , but returned: ${result}`)
    });
  });

  it('Liveness reports DOWN if startup is DOWN', async () => {
    let healthCheck = new HealthChecker();

    const promiseOne = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("Liveness Failure");
    })

    let checkOne = new LivenessCheck("checkOne", promiseOne);

    healthCheck.registerLivenessCheck(checkOne);

    const status = await healthCheck.getLivenessStatus();
    const result = status.status;
    expect(result).to.equal(State.DOWN, `Should return: ${State.DOWN} , but returned: ${result}`)
  })

  it('Startup is UP and Liveness is DOWN, calling Liveness status should report DOWN', async () => {
    let healthCheck = new HealthChecker();

    const LivenessPromise = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("error");
    })

    const StartupPromise = () => new Promise<void>((resolve, _reject) => {
      resolve();
    });

    let checkOne = new LivenessCheck("checkOne", LivenessPromise);
    let checkTwo = new StartupCheck("checkTwo",StartupPromise);   
    //startup check promise is resolved so liveness should not fallback to get startupStatus

    await healthCheck.registerStartupCheck(checkTwo);
    healthCheck.registerLivenessCheck(checkOne);

    const status = await healthCheck.getLivenessStatus();
    const result = status.status;
    expect(result).to.equal(State.DOWN, `Should return: ${State.DOWN} , but returned: ${result}`);
  });

  it('Startup is UP and Liveness is DOWN, calling getStatus should report DOWN', async () => {
    let healthCheck = new HealthChecker();

    const LivenessPromise = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("error");
    })

    const StartupPromise = () => new Promise<void>((resolve, _reject) => {
      resolve();
    });

    let checkOne = new LivenessCheck("checkOne", LivenessPromise);
    let checkTwo = new StartupCheck("checkTwo",StartupPromise);

    await healthCheck.registerStartupCheck(checkTwo);
    healthCheck.registerLivenessCheck(checkOne);
    
    const status = await healthCheck.getStatus();
    const result = status.status;
    expect(result).to.equal(State.DOWN, `Should return: ${State.DOWN} , but returned: ${result}`);
  });
  

  it('Startup is UP and Liveness is UP, calling Liveness status should report UP', async () => {
    let healthCheck = new HealthChecker();

    const LivenessPromise = () => new Promise<void>((resolve, _reject) => {
      resolve();
    })

    const StartupPromise = () => new Promise<void>((resolve, _reject) => {
      resolve();
    });

    let checkOne = new LivenessCheck("checkOne", LivenessPromise);
    let checkTwo = new StartupCheck("checkTwo",StartupPromise);   

    await healthCheck.registerStartupCheck(checkTwo);
    healthCheck.registerLivenessCheck(checkOne);

    const status = await healthCheck.getLivenessStatus();
    const result = status.status
    expect(result).to.equal(State.UP, `Should return: ${State.UP} , but returned: ${result}`)
  });

  it('Startup is UP and Readiness is DOWN, calling Readiness status should report DOWN', async () => {
    let healthCheck = new HealthChecker();

    const ReadinessPromise = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("error")
    })

    const StartupPromise = () => new Promise<void>((resolve, _reject) => {
      resolve();
    });

    let checkOne = new ReadinessCheck("checkOne", ReadinessPromise);
    let checkTwo = new StartupCheck("checkTwo",StartupPromise);

    await healthCheck.registerStartupCheck(checkTwo);
    healthCheck.registerReadinessCheck(checkOne);

    const status = await healthCheck.getReadinessStatus();
    const result = status.status
    expect(result).to.equal(State.DOWN, `Should return: ${State.DOWN} , but returned: ${result}`)
  });

  it('Startup is UP and Readiness is DOWN, calling getSatus should report DOWN', async () => {
    let healthcheck = new HealthChecker();

    const ReadinessPromise = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("error")
    })

    const StartupPromise = () => new Promise<void>((resolve, _reject) => {
      resolve();
    });

    let checkone = new ReadinessCheck("checkone", ReadinessPromise);
    let checktwo = new StartupCheck("checktwo",StartupPromise);

    await healthcheck.registerStartupCheck(checktwo);
    healthcheck.registerReadinessCheck(checkone);
    
    const status = await healthcheck.getStatus();
    const result = status.status
    expect(result).to.equal(State.DOWN, `Should return: ${State.DOWN} , but returned: ${result}`)
  });
  
  it('Startup is UP, getStartupComplete should return true with a liveness check', async() => {
    let healthcheck = new HealthChecker();
  
    const StartupPromise = () => new Promise<void>((resolve, _reject) => {
      resolve();
    });
  
    let check = new LivenessCheck("check",StartupPromise);
  
    healthcheck.registerLivenessCheck(check);
    let status = await healthcheck.getLivenessStatus();  
  
    let result = await healthcheck.getStartUpComplete();
  
    expect(result).to.equal(true, `Should return that startupComplete is true, but returned ${result}`)
  });

  it('Startup is DOWN, getStartupComplete should return false with a getStatus call', async() => {
    let healthcheck = new HealthChecker();
  
    const StartupPromise = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("Startup failed");
    });
  
    let check = new StartupCheck("check",StartupPromise);
  
    healthcheck.registerStartupCheck(check);
    await healthcheck.getStatus();  
    
    let result = healthcheck.getStartUpComplete();
  
    expect(result).to.equal(false, `Should return that startupComplete is false, but returned ${result}`)
  });

  it('Startup is DOWN and should return DOWN with a liveness check', async() => {
    let healthcheck = new HealthChecker();

    const StartupPromise = () => new Promise<void>((_resolve,_reject) => {
      throw new Error("Startup failed");
    });

    const LivenessPromise = () => new Promise<void>((resolve,_reject) => {
      resolve();
    });

    let check = new StartupCheck("check",StartupPromise);
    let check2 = new ReadinessCheck("check2",LivenessPromise);

    await healthcheck.registerStartupCheck(check)
    healthcheck.registerLivenessCheck(check2) 

    let status = await healthcheck.getLivenessStatus()
    let result = status.status
    expect(result).to.equal(State.DOWN, `Should return ${State.DOWN} but returned ${result}`)
  });

  it('Health reports UP by default', async () => {
    let healthcheck = new HealthChecker()
    const status = await healthcheck.getStatus();
    let result = status.status;
    expect(result).to.equal(State.UP, `Should return: ${State.UP}, but returned: ${result}`);
  });

  it('Health reports UP and empty checks array no registered liveness checks', async () => {
    let healthcheck = new HealthChecker()
    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"UP\",\"checks\":[]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Health reports UP and check result with single registered liveness check', async () => {
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

  it('Health reports UP and check result with two registered liveness checks', async () => {
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

  it('Health reports DOWN and check result with single failed liveness check', async () => {
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

  it('Health reports DOWN and check result with single rejected liveness check', async () => {
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

  it('Health reports UP with running Liveness PingCheck', async () => {
    let healthcheck = new HealthChecker();

    let check = new PingCheck("google.com")

    healthcheck.registerLivenessCheck(check)
    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"PingCheck HEAD:google.com:80/\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Health reports DOWN with failing Liveness PingCheck', async () => {
    let healthcheck = new HealthChecker();

    let check = new PingCheck("not-an-address.com")

    healthcheck.registerLivenessCheck(check)
    const status = await healthcheck.getStatus();

    let expected = 'PingCheck HEAD:not-an-address.com:80/'
    const statusVal = status.status
    const checksState = status.checks[0].state
    const checkName = status.checks[0].name
    expect(statusVal).to.equal(State.DOWN, `Should return: ${State.DOWN}, but returned: ${statusVal}`);
    expect(checksState).to.equal(State.DOWN, `Should return: ${State.DOWN}, but returned: ${checksState}`);
    expect(checkName).to.equal(expected, `Should return: ${expected}, but returned: ${checkName}`);
  });

  it('Health reports DOWN on second invocation of a liveness check', async () => {
    let healthcheck = new HealthChecker();

    let count = 0;
    const promise = () => new Promise<void>((resolve, reject) => {
      if (count > 0) {
        reject(new Error("Liveness failure"));
      } else {
        count = count + 1;
        resolve()
      }
    });

    let check = new LivenessCheck("check", promise)
    healthcheck.registerLivenessCheck(check)
    let status = await healthcheck.getStatus();
    status = await healthcheck.getStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"\DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Liveness failure\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Health reports UP on second invocation of a liveness check', async () => {
    let healthcheck = new HealthChecker();

    let count = 0;
    const promise = () => new Promise<void>((resolve, reject) => {
      if (count > 0) {
        resolve()
      } else {
        count = count + 1;
        reject(new Error("Liveness failure"));
      }
    });

    let check = new LivenessCheck("check", promise)
    healthcheck.registerLivenessCheck(check)
    let status = await healthcheck.getStatus();
    status = await healthcheck.getStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"\UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Health reports DOWN and check result with one passed and one failed Liveness checks', async () => {
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

  it('Health reports DOWN and check result with one passed Liveness and one failed Readiness checks', async () => {
    let healthcheck = new HealthChecker();

    const promiseone = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("Readiness Failure");
    })
    let checkone = new ReadinessCheck("checkone", promiseone)

    const promisetwo = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let checktwo = new LivenessCheck("checktwo", promisetwo)

    healthcheck.registerReadinessCheck(checkone)
    healthcheck.registerLivenessCheck(checktwo)

    const status = await healthcheck.getStatus();
    const result = JSON.stringify(status);

    let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Readiness Failure\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Readiness reports UP by default', async () => {
    let healthcheck = new HealthChecker()
    const status = await healthcheck.getReadinessStatus();
    let result = status.status;
    expect(result).to.equal(State.UP, `Should return: ${State.UP}, but returned: ${result}`);
  });

  it('Readiness reports UP and empty checks array no registered checks', async () => {
    let healthcheck = new HealthChecker()
    const status = await healthcheck.getReadinessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"UP\",\"checks\":[]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Readiness reports UP and check result with single registered check', async () => {
    let healthcheck = new HealthChecker();
    // tslint:disable-next-line:no-shadowed-variable
    const promise = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let check = new ReadinessCheck("check", promise)
    healthcheck.registerReadinessCheck(check)

    const status = await healthcheck.getReadinessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  })

  it('Readiness reports UP and check result with two registered checks', async () => {
    let healthcheck = new HealthChecker();
    // tslint:disable-next-line:no-shadowed-variable
    const promiseone = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let checkone = new ReadinessCheck("checkone", promiseone)

    // tslint:disable-next-line:no-shadowed-variable
    const promisetwo = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let checktwo = new ReadinessCheck("checktwo", promisetwo)

    healthcheck.registerReadinessCheck(checkone)
    healthcheck.registerReadinessCheck(checktwo)

    const status = await healthcheck.getReadinessStatus();
    const result = JSON.stringify(status);

    let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"checkone\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  })

  it('Readiness reports DOWN and check result with single failed check', async () => {
    let healthcheck = new HealthChecker();
    const promise = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("Readiness Failure");
    });
    let check = new ReadinessCheck("check", promise);
    healthcheck.registerReadinessCheck(check);

    const status = await healthcheck.getReadinessStatus();
    const result = JSON.stringify(status);

    let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Readiness Failure\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Readiness reports DOWN and check result with single rejected check', async () => {
    let healthcheck = new HealthChecker();
    const promise = () => new Promise<void>((_resolve, reject) => {
      reject(new Error("Readiness Failure"));
    });
    let check = new ReadinessCheck("check", promise)
    healthcheck.registerReadinessCheck(check)

    const status = await healthcheck.getReadinessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Readiness Failure\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Readiness reports UP with running PingCheck', async () => {
    let healthcheck = new HealthChecker();

    let check = new PingCheck("google.com")

    healthcheck.registerReadinessCheck(check)
    const status = await healthcheck.getReadinessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"PingCheck HEAD:google.com:80/\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Readiness reports DOWN with failing PingCheck', async () => {
    let healthcheck = new HealthChecker();

    let check = new PingCheck("not-an-address.com")

    healthcheck.registerReadinessCheck(check)
    const status = await healthcheck.getReadinessStatus();

    let expected = 'PingCheck HEAD:not-an-address.com:80/'
    const statusVal = status.status
    const checksState = status.checks[0].state
    const checkName = status.checks[0].name
    expect(statusVal).to.equal(State.DOWN, `Should return: ${State.DOWN}, but returned: ${statusVal}`);
    expect(checksState).to.equal(State.DOWN, `Should return: ${State.DOWN}, but returned: ${checksState}`);
    expect(checkName).to.equal(expected, `Should return: ${expected}, but returned: ${checkName}`);
  });

  it('Readiness reports DOWN and check result with one passed and one failed registered checks', async () => {
    let healthcheck = new HealthChecker();

    const promiseone = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("Readiness Failure");
    })
    let checkone = new ReadinessCheck("checkone", promiseone)

    const promisetwo = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let checktwo = new ReadinessCheck("checktwo", promisetwo)

    healthcheck.registerReadinessCheck(checkone)
    healthcheck.registerReadinessCheck(checktwo)

    const status = await healthcheck.getReadinessStatus();
    const result = JSON.stringify(status);

    let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Readiness Failure\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Readiness reports DOWN on second invocation of a readiness check', async () => {
    let healthcheck = new HealthChecker();

    let count = 0;
    const promise = () => new Promise<void>((resolve, reject) => {
      if (count > 0) {
        reject(new Error("Readiness failure"));
      } else {
        count = count + 1;
        resolve()
      }
    });

    let check = new ReadinessCheck("check", promise)
    healthcheck.registerReadinessCheck(check)
    let status = await healthcheck.getReadinessStatus();
    status = await healthcheck.getReadinessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"\DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Readiness failure\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Readiness reports UP on second invocation of a readiness check', async () => {
    let healthcheck = new HealthChecker();

    let count = 0;
    const promise = () => new Promise<void>((resolve, reject) => {
      if (count > 0) {
        resolve()
      } else {
        count = count + 1;
        reject(new Error("Readiness failure"));
      }
    });

    let check = new ReadinessCheck("check", promise)
    healthcheck.registerReadinessCheck(check)
    let status = await healthcheck.getReadinessStatus();
    status = await healthcheck.getReadinessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"\UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Liveness reports UP by default', async () => {
    let healthcheck = new HealthChecker()
    const status = await healthcheck.getLivenessStatus();
    let result = status.status;
    expect(result).to.equal(State.UP, `Should return: ${State.UP}, but returned: ${result}`);
  });

  it('Liveness reports UP and empty checks array no registered checks', async () => {
    let healthcheck = new HealthChecker()
    const status = await healthcheck.getLivenessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"UP\",\"checks\":[]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Liveness reports UP and check result with single registered check', async () => {
    let healthcheck = new HealthChecker();
    // tslint:disable-next-line:no-shadowed-variable
    const promise = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let check = new LivenessCheck("check", promise)
    healthcheck.registerLivenessCheck(check)

    const status = await healthcheck.getLivenessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  })

  it('Liveness reports UP and check result with two registered checks', async () => {
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

    const status = await healthcheck.getLivenessStatus();
    const result = JSON.stringify(status);

    let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"checkone\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  })

  it('Liveness reports DOWN and check result with single failed check', async () => {
    let healthcheck = new HealthChecker();
    const promise = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("Liveness Failure");
    });
    let check = new LivenessCheck("check", promise);
    healthcheck.registerLivenessCheck(check);

    const status = await healthcheck.getLivenessStatus();
    const result = JSON.stringify(status);

    let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Liveness Failure\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Liveness reports DOWN and check result with single rejected check', async () => {
    let healthcheck = new HealthChecker();
    const promise = () => new Promise<void>((_resolve, reject) => {
      reject(new Error("Liveness Failure"));
    });
    let check = new LivenessCheck("check", promise)
    healthcheck.registerLivenessCheck(check)

    const status = await healthcheck.getLivenessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Liveness Failure\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Liveness reports UP with running PingCheck', async () => {
    let healthcheck = new HealthChecker();

    let check = new PingCheck("google.com")

    healthcheck.registerLivenessCheck(check)
    const status = await healthcheck.getLivenessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"PingCheck HEAD:google.com:80/\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Liveness reports DOWN with failing PingCheck', async () => {
    let healthcheck = new HealthChecker();

    let check = new PingCheck("not-an-address.com")

    healthcheck.registerLivenessCheck(check)
    const status = await healthcheck.getLivenessStatus();
    
    let expected = 'PingCheck HEAD:not-an-address.com:80/'
    const statusVal = status.status
    const checksState = status.checks[0].state
    const checkName = status.checks[0].name
    expect(statusVal).to.equal(State.DOWN, `Should return: ${State.DOWN}, but returned: ${statusVal}`);
    expect(checksState).to.equal(State.DOWN, `Should return: ${State.DOWN}, but returned: ${checksState}`);
    expect(checkName).to.equal(expected, `Should return: ${expected}, but returned: ${checkName}`);
  });

  it('Liveness reports DOWN and check result with one passed and one failed registered checks', async () => {
    let healthcheck = new HealthChecker();

    const promiseone = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("Liveness Failure");
    })
    let checkone = new LivenessCheck("checkone", promiseone)

    const promisetwo = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });
    let checktwo = new LivenessCheck("checktwo", promisetwo)

    healthcheck.registerLivenessCheck(checkone)
    healthcheck.registerLivenessCheck(checktwo)

    const status = await healthcheck.getLivenessStatus();
    const result = JSON.stringify(status);

    let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Liveness Failure\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Liveness reports DOWN on second invocation of a liveness check', async () => {
    let healthcheck = new HealthChecker();

    let count = 0;
    const promise = () => new Promise<void>((resolve, reject) => {
      if (count > 0) {
        reject(new Error("Liveness failure"));
      } else {
        count = count + 1;
        resolve()
      }
    });

    let check = new LivenessCheck("check", promise)
    healthcheck.registerLivenessCheck(check)
    let status = await healthcheck.getLivenessStatus();
    status = await healthcheck.getLivenessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"\DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Liveness failure\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Liveness reports UP on second invocation of a liveness check', async () => {
    let healthcheck = new HealthChecker();

    let count = 0;
    const promise = () => new Promise<void>((resolve, reject) => {
      if (count > 0) {
        resolve()
      } else {
        count = count + 1;
        reject(new Error("Liveness failure"));
      }
    });

    let check = new LivenessCheck("check", promise)
    healthcheck.registerLivenessCheck(check)
    let status = await healthcheck.getLivenessStatus();
    status = await healthcheck.getLivenessStatus();
    const result = JSON.stringify(status)

    let expected = "{\"status\":\"\UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}"
    expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
  });

  it('Shutdown reports STOPPED once stopped', async () => {
    process.removeAllListeners('SIGTERM');
    let healthcheck = new HealthChecker();
    // tslint:disable-next-line:no-shadowed-variable
    const promiseone = () => new Promise<void>((resolve, _reject) => {
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

    const promiseone = () => new Promise<void>((_resolve, _reject) => {
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

    const promise = () => new Promise<void>((_resolve, _reject) => {
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

    const promiseone = () => new Promise<void>((_resolve, _reject) => {
      throw new Error("Shutdown Failure");
    });
    let checkone = new ShutdownCheck("checkone", promiseone)
    healthcheck.registerShutdownCheck(checkone)

    const promisetwo = () => new Promise<void>((_resolve, _reject) => {
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
    const promiseone = () => new Promise<void>((resolve, _reject) => {
      resolve()
    });

    let checkone = new ShutdownCheck("checkone", promiseone)
    healthcheck.registerShutdownCheck(checkone)

    const promisetwo = () => new Promise<void>((_resolve, _reject) => {
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

describe('Should convert any promise reject to return an error message as a string' , () => {
  {
    class foo {
      get message() {
        return "bar"
      }
    }
    
    // array of errors and their expected return values when passed to promise reject
    
    [
      [new Error("Readiness Failure"), "Readiness Failure"],
      [null, ""],
      [undefined, ""],
      [1, "1"],
      [new Error(), "Error"],
      [new foo(), "bar"]
    ].forEach(([err,str]) => {

      it(`When err is ${err} should return ${str}`, async() => {
        
        let healthcheck = new HealthChecker();
        const readinessPromise = () => new Promise<void>((resolve, reject) => {
          reject(err);
        });
    
        let check = new ReadinessCheck("readinessCheck", readinessPromise);
        healthcheck.registerReadinessCheck(check);
        let status = await healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
    
        let expected = { 
          "status":"DOWN",
          "checks":
          [{ 
            "name":"readinessCheck",
            "state":"DOWN",
            "data": { 
              "reason": str
            }
          }] 
        };
        expect(result).to.equal(JSON.stringify(expected), `Should return: ${expected}, but returned: ${result}`);
      });
  })};
});
