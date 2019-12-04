"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const index_1 = require("../../index");
chai_1.should();
describe('Health Checker test suite', () => {
    it('Startup reports DOWN', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, _reject) => {
            throw new Error("Startup Failure");
        });
        let check = new index_1.StartupCheck("check", promise);
        yield healthCheck.registerStartupCheck(check);
        const status = yield healthCheck.getStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN} , but returned: ${result}`);
    }));
    it('Startup reports UP', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let check = new index_1.StartupCheck("check", promise);
        yield healthCheck.registerStartupCheck(check);
        const status = yield healthCheck.getStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.UP, `Should return: ${index_1.State.UP} , but returned: ${result}`);
    }));
    it('Startup reports STARTING when first is starting and second is up', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const Check1 = () => new Promise((resolve, _reject) => {
            setTimeout(resolve, 1000, 'foo');
        });
        let check1 = new index_1.StartupCheck('Check1', Check1);
        healthCheck.registerStartupCheck(check1);
        const Check2 = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let check2 = new index_1.StartupCheck('Check2', Check2);
        //don't await as the check should not be resolved or rejected -> resembles an app starting
        healthCheck.registerStartupCheck(check2);
        const status = yield healthCheck.getStatus();
        const result = status.status;
        const expected = index_1.State.STARTING;
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports STARTING with a pending startUp check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const Check1 = () => new Promise((resolve, _reject) => {
            setTimeout(resolve, 100, 'foo');
        });
        let startCheck = new index_1.StartupCheck('StartCheck', Check1);
        healthCheck.registerStartupCheck(startCheck);
        const status = yield healthCheck.getStatus();
        const result = status.status;
        const expected = index_1.State.STARTING;
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports UP with a pending startUp check that will resolve', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const Check1 = () => new Promise((resolve, _reject) => {
            setTimeout(resolve, 100, 'foo');
        });
        let startCheck = new index_1.StartupCheck('StartCheck', Check1);
        healthCheck.registerStartupCheck(startCheck);
        const status = yield healthCheck.getLivenessStatus();
        const result = status.status;
        const expected = index_1.State.UP;
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports DOWN with a pending startUp check that will fail', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const Check1 = () => new Promise((_resolve, reject) => {
            setTimeout(reject, 1000, 'foo');
        });
        let startCheck = new index_1.StartupCheck('StartCheck', Check1);
        healthCheck.registerStartupCheck(startCheck);
        const status = yield healthCheck.getLivenessStatus();
        const result = status.status;
        const expected = index_1.State.DOWN;
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports UP with a pending startUp check that will resolve', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const Check1 = () => new Promise((resolve, _reject) => {
            setTimeout(resolve, 100, 'foo');
        });
        let startCheck = new index_1.StartupCheck('StartCheck', Check1);
        healthCheck.registerStartupCheck(startCheck);
        const status = yield healthCheck.getReadinessStatus();
        const result = status.status;
        const expected = index_1.State.UP;
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports DOWN with a pending startUp check that will fail', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const Check1 = () => new Promise((resolve, reject) => {
            setTimeout(reject, 100, 'foo');
        });
        let startCheck = new index_1.StartupCheck('StartCheck', Check1);
        healthCheck.registerStartupCheck(startCheck);
        const status = yield healthCheck.getReadinessStatus();
        const result = status.status;
        const expected = index_1.State.DOWN;
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Startup reports STARTING when first is up and the second is starting', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const Check1 = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let check1 = new index_1.StartupCheck('Check1', Check1);
        healthCheck.registerStartupCheck(check1);
        const Check2 = () => new Promise((resolve, _reject) => {
            setTimeout(resolve, 1000, 'foo');
        });
        let check2 = new index_1.StartupCheck('Check2', Check2);
        healthCheck.registerStartupCheck(check2); //do not await as its starting but not complete
        const status = yield healthCheck.getStatus();
        const result = status.status;
        const expected = index_1.State.STARTING;
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Startup reports STARTING with returned Promise', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, _reject) => {
            // tslint:disable-next-line:no-shadowed-variable no-unused-expression
            new Promise((resolve, _reject) => {
                setTimeout(resolve, 1000, 'foo');
            });
        });
        let check = new index_1.StartupCheck("check", promise);
        healthCheck.registerStartupCheck(check)
            .then(() => __awaiter(void 0, void 0, void 0, function* () {
            const status = yield healthCheck.getStatus();
            const result = status.status;
            chai_1.expect(result).to.equal(index_1.State.STARTING, `Should return: ${index_1.State.STARTING} , but returned: ${result}`);
        }));
    }));
    it('Startup reports STARTING without returned Promise', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, _reject) => {
            // tslint:disable-next-line:no-unused-expression no-shadowed-variable
            new Promise((resolve, _reject) => {
                setTimeout(resolve, 1000, 'foo');
            });
        });
        let check = new index_1.StartupCheck("check", promise);
        healthCheck.registerStartupCheck(check)
            .then(() => __awaiter(void 0, void 0, void 0, function* () {
            const status = yield healthCheck.getStatus();
            const result = status.status;
            chai_1.expect(result).to.equal(index_1.State.STARTING, `Should return: ${index_1.State.STARTING} , but returned: ${result}`);
        }));
    }));
    it('Startup reports STARTING when multiple checks are still starting', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const promise1 = () => new Promise((_resolve, _reject) => {
            // tslint:disable-next-line:no-unused-expression no-shadowed-variable
            new Promise((resolve, _reject) => {
                setTimeout(resolve, 1000, 'foo');
            });
        });
        let check1 = new index_1.StartupCheck("check", promise1);
        const promise2 = () => new Promise((_resolve, _reject) => {
            // tslint:disable-next-line:no-unused-expression no-shadowed-variable
            new Promise((resolve, _reject) => {
                setTimeout(resolve, 100, 'foo');
            });
        });
        let check2 = new index_1.StartupCheck("check", promise2);
        healthCheck.registerStartupCheck(check1);
        healthCheck.registerStartupCheck(check2)
            .then(() => __awaiter(void 0, void 0, void 0, function* () {
            const status = yield healthCheck.getStatus();
            const result = status.status;
            chai_1.expect(result).to.equal(index_1.State.STARTING, `Should return: ${index_1.State.STARTING} , but returned: ${result}`);
        }));
    }));
    it('Liveness reports DOWN if startup is DOWN', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const promiseOne = () => new Promise((_resolve, _reject) => {
            throw new Error("Liveness Failure");
        });
        let checkOne = new index_1.LivenessCheck("checkOne", promiseOne);
        healthCheck.registerLivenessCheck(checkOne);
        const status = yield healthCheck.getLivenessStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN} , but returned: ${result}`);
    }));
    it('Startup is UP and Liveness is DOWN, calling Liveness status should report DOWN', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const LivenessPromise = () => new Promise((_resolve, _reject) => {
            throw new Error("error");
        });
        const StartupPromise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checkOne = new index_1.LivenessCheck("checkOne", LivenessPromise);
        let checkTwo = new index_1.StartupCheck("checkTwo", StartupPromise);
        //startup check promise is resolved so liveness should not fallback to get startupStatus
        yield healthCheck.registerStartupCheck(checkTwo);
        healthCheck.registerLivenessCheck(checkOne);
        const status = yield healthCheck.getLivenessStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN} , but returned: ${result}`);
    }));
    it('Startup is UP and Liveness is DOWN, calling getStatus should report DOWN', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const LivenessPromise = () => new Promise((_resolve, _reject) => {
            throw new Error("error");
        });
        const StartupPromise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checkOne = new index_1.LivenessCheck("checkOne", LivenessPromise);
        let checkTwo = new index_1.StartupCheck("checkTwo", StartupPromise);
        yield healthCheck.registerStartupCheck(checkTwo);
        healthCheck.registerLivenessCheck(checkOne);
        const status = yield healthCheck.getStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN} , but returned: ${result}`);
    }));
    it('Startup is UP and Liveness is UP, calling Liveness status should report UP', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const LivenessPromise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        const StartupPromise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checkOne = new index_1.LivenessCheck("checkOne", LivenessPromise);
        let checkTwo = new index_1.StartupCheck("checkTwo", StartupPromise);
        yield healthCheck.registerStartupCheck(checkTwo);
        healthCheck.registerLivenessCheck(checkOne);
        const status = yield healthCheck.getLivenessStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.UP, `Should return: ${index_1.State.UP} , but returned: ${result}`);
    }));
    it('Startup is UP and Readiness is DOWN, calling Readiness status should report DOWN', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthCheck = new index_1.HealthChecker();
        const ReadinessPromise = () => new Promise((_resolve, _reject) => {
            throw new Error("error");
        });
        const StartupPromise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checkOne = new index_1.ReadinessCheck("checkOne", ReadinessPromise);
        let checkTwo = new index_1.StartupCheck("checkTwo", StartupPromise);
        yield healthCheck.registerStartupCheck(checkTwo);
        healthCheck.registerReadinessCheck(checkOne);
        const status = yield healthCheck.getReadinessStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN} , but returned: ${result}`);
    }));
    it('Startup is UP and Readiness is DOWN, calling getSatus should report DOWN', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const ReadinessPromise = () => new Promise((_resolve, _reject) => {
            throw new Error("error");
        });
        const StartupPromise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checkone = new index_1.ReadinessCheck("checkone", ReadinessPromise);
        let checktwo = new index_1.StartupCheck("checktwo", StartupPromise);
        yield healthcheck.registerStartupCheck(checktwo);
        healthcheck.registerReadinessCheck(checkone);
        const status = yield healthcheck.getStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN} , but returned: ${result}`);
    }));
    it('Startup is UP, getStartupComplete should return true with a liveness check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const StartupPromise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let check = new index_1.LivenessCheck("check", StartupPromise);
        healthcheck.registerLivenessCheck(check);
        let status = yield healthcheck.getLivenessStatus();
        let result = yield healthcheck.getStartUpComplete();
        chai_1.expect(result).to.equal(true, `Should return that startupComplete is true, but returned ${result}`);
    }));
    it('Startup is DOWN, getStartupComplete should return false with a getStatus call', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const StartupPromise = () => new Promise((_resolve, _reject) => {
            throw new Error("Startup failed");
        });
        let check = new index_1.StartupCheck("check", StartupPromise);
        healthcheck.registerStartupCheck(check);
        yield healthcheck.getStatus();
        let result = healthcheck.getStartUpComplete();
        chai_1.expect(result).to.equal(false, `Should return that startupComplete is false, but returned ${result}`);
    }));
    it('Startup is DOWN and should return DOWN with a liveness check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const StartupPromise = () => new Promise((_resolve, _reject) => {
            throw new Error("Startup failed");
        });
        const LivenessPromise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let check = new index_1.StartupCheck("check", StartupPromise);
        let check2 = new index_1.ReadinessCheck("check2", LivenessPromise);
        yield healthcheck.registerStartupCheck(check);
        healthcheck.registerLivenessCheck(check2);
        let status = yield healthcheck.getLivenessStatus();
        let result = status.status;
        chai_1.expect(result).to.equal(index_1.State.DOWN, `Should return ${index_1.State.DOWN} but returned ${result}`);
    }));
    it('Health reports UP by default', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getStatus();
        let result = status.status;
        chai_1.expect(result).to.equal(index_1.State.UP, `Should return: ${index_1.State.UP}, but returned: ${result}`);
    }));
    it('Health reports UP and empty checks array no registered liveness checks', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports UP and check result with single registered liveness check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports UP and check result with two registered liveness checks', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promiseone = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checkone = new index_1.LivenessCheck("checkone", promiseone);
        // tslint:disable-next-line:no-shadowed-variable
        const promisetwo = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checktwo = new index_1.LivenessCheck("checktwo", promisetwo);
        healthcheck.registerLivenessCheck(checkone);
        healthcheck.registerLivenessCheck(checktwo);
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"checkone\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports DOWN and check result with single failed liveness check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, _reject) => {
            throw new Error("Startup Failure");
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Startup Failure\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports DOWN and check result with single rejected liveness check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, reject) => {
            reject(new Error("Startup Failure"));
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Startup Failure\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports UP with running Liveness PingCheck', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("google.com");
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"PingCheck HEAD:google.com:80/\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports DOWN with failing Liveness PingCheck', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("not-an-address.com");
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getStatus();
        let expected = 'PingCheck HEAD:not-an-address.com:80/';
        const statusVal = status.status;
        const checksState = status.checks[0].state;
        const checkName = status.checks[0].name;
        chai_1.expect(statusVal).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN}, but returned: ${statusVal}`);
        chai_1.expect(checksState).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN}, but returned: ${checksState}`);
        chai_1.expect(checkName).to.equal(expected, `Should return: ${expected}, but returned: ${checkName}`);
    }));
    it('Health reports DOWN on second invocation of a liveness check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let count = 0;
        const promise = () => new Promise((resolve, reject) => {
            if (count > 0) {
                reject(new Error("Liveness failure"));
            }
            else {
                count = count + 1;
                resolve();
            }
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        let status = yield healthcheck.getStatus();
        status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"\DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Liveness failure\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports UP on second invocation of a liveness check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let count = 0;
        const promise = () => new Promise((resolve, reject) => {
            if (count > 0) {
                resolve();
            }
            else {
                count = count + 1;
                reject(new Error("Liveness failure"));
            }
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        let status = yield healthcheck.getStatus();
        status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"\UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports DOWN and check result with one passed and one failed Liveness checks', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promiseone = () => new Promise((_resolve, _reject) => {
            throw new Error("Startup Failure");
        });
        let checkone = new index_1.LivenessCheck("checkone", promiseone);
        const promisetwo = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checktwo = new index_1.LivenessCheck("checktwo", promisetwo);
        healthcheck.registerLivenessCheck(checkone);
        healthcheck.registerLivenessCheck(checktwo);
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Startup Failure\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports DOWN and check result with one passed Liveness and one failed Readiness checks', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promiseone = () => new Promise((_resolve, _reject) => {
            throw new Error("Readiness Failure");
        });
        let checkone = new index_1.ReadinessCheck("checkone", promiseone);
        const promisetwo = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checktwo = new index_1.LivenessCheck("checktwo", promisetwo);
        healthcheck.registerReadinessCheck(checkone);
        healthcheck.registerLivenessCheck(checktwo);
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Readiness Failure\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports UP by default', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getReadinessStatus();
        let result = status.status;
        chai_1.expect(result).to.equal(index_1.State.UP, `Should return: ${index_1.State.UP}, but returned: ${result}`);
    }));
    it('Readiness reports UP and empty checks array no registered checks', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports UP and check result with single registered check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let check = new index_1.ReadinessCheck("check", promise);
        healthcheck.registerReadinessCheck(check);
        const status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports UP and check result with two registered checks', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promiseone = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checkone = new index_1.ReadinessCheck("checkone", promiseone);
        // tslint:disable-next-line:no-shadowed-variable
        const promisetwo = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checktwo = new index_1.ReadinessCheck("checktwo", promisetwo);
        healthcheck.registerReadinessCheck(checkone);
        healthcheck.registerReadinessCheck(checktwo);
        const status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"checkone\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports DOWN and check result with single failed check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, _reject) => {
            throw new Error("Readiness Failure");
        });
        let check = new index_1.ReadinessCheck("check", promise);
        healthcheck.registerReadinessCheck(check);
        const status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Readiness Failure\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports DOWN and check result with single rejected check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, reject) => {
            reject(new Error("Readiness Failure"));
        });
        let check = new index_1.ReadinessCheck("check", promise);
        healthcheck.registerReadinessCheck(check);
        const status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Readiness Failure\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports UP with running PingCheck', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("google.com");
        healthcheck.registerReadinessCheck(check);
        const status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"PingCheck HEAD:google.com:80/\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports DOWN with failing PingCheck', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("not-an-address.com");
        healthcheck.registerReadinessCheck(check);
        const status = yield healthcheck.getReadinessStatus();
        let expected = 'PingCheck HEAD:not-an-address.com:80/';
        const statusVal = status.status;
        const checksState = status.checks[0].state;
        const checkName = status.checks[0].name;
        chai_1.expect(statusVal).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN}, but returned: ${statusVal}`);
        chai_1.expect(checksState).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN}, but returned: ${checksState}`);
        chai_1.expect(checkName).to.equal(expected, `Should return: ${expected}, but returned: ${checkName}`);
    }));
    it('Readiness reports DOWN and check result with one passed and one failed registered checks', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promiseone = () => new Promise((_resolve, _reject) => {
            throw new Error("Readiness Failure");
        });
        let checkone = new index_1.ReadinessCheck("checkone", promiseone);
        const promisetwo = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checktwo = new index_1.ReadinessCheck("checktwo", promisetwo);
        healthcheck.registerReadinessCheck(checkone);
        healthcheck.registerReadinessCheck(checktwo);
        const status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Readiness Failure\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports DOWN on second invocation of a readiness check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let count = 0;
        const promise = () => new Promise((resolve, reject) => {
            if (count > 0) {
                reject(new Error("Readiness failure"));
            }
            else {
                count = count + 1;
                resolve();
            }
        });
        let check = new index_1.ReadinessCheck("check", promise);
        healthcheck.registerReadinessCheck(check);
        let status = yield healthcheck.getReadinessStatus();
        status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"\DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Readiness failure\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports UP on second invocation of a readiness check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let count = 0;
        const promise = () => new Promise((resolve, reject) => {
            if (count > 0) {
                resolve();
            }
            else {
                count = count + 1;
                reject(new Error("Readiness failure"));
            }
        });
        let check = new index_1.ReadinessCheck("check", promise);
        healthcheck.registerReadinessCheck(check);
        let status = yield healthcheck.getReadinessStatus();
        status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"\UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports UP by default', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getLivenessStatus();
        let result = status.status;
        chai_1.expect(result).to.equal(index_1.State.UP, `Should return: ${index_1.State.UP}, but returned: ${result}`);
    }));
    it('Liveness reports UP and empty checks array no registered checks', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports UP and check result with single registered check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports UP and check result with two registered checks', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promiseone = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checkone = new index_1.LivenessCheck("checkone", promiseone);
        // tslint:disable-next-line:no-shadowed-variable
        const promisetwo = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checktwo = new index_1.LivenessCheck("checktwo", promisetwo);
        healthcheck.registerLivenessCheck(checkone);
        healthcheck.registerLivenessCheck(checktwo);
        const status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"checkone\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports DOWN and check result with single failed check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, _reject) => {
            throw new Error("Liveness Failure");
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Liveness Failure\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports DOWN and check result with single rejected check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, reject) => {
            reject(new Error("Liveness Failure"));
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Liveness Failure\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports UP with running PingCheck', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("google.com");
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"PingCheck HEAD:google.com:80/\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports DOWN with failing PingCheck', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("not-an-address.com");
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getLivenessStatus();
        let expected = 'PingCheck HEAD:not-an-address.com:80/';
        const statusVal = status.status;
        const checksState = status.checks[0].state;
        const checkName = status.checks[0].name;
        chai_1.expect(statusVal).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN}, but returned: ${statusVal}`);
        chai_1.expect(checksState).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN}, but returned: ${checksState}`);
        chai_1.expect(checkName).to.equal(expected, `Should return: ${expected}, but returned: ${checkName}`);
    }));
    it('Liveness reports DOWN and check result with one passed and one failed registered checks', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promiseone = () => new Promise((_resolve, _reject) => {
            throw new Error("Liveness Failure");
        });
        let checkone = new index_1.LivenessCheck("checkone", promiseone);
        const promisetwo = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checktwo = new index_1.LivenessCheck("checktwo", promisetwo);
        healthcheck.registerLivenessCheck(checkone);
        healthcheck.registerLivenessCheck(checktwo);
        const status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Liveness Failure\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports DOWN on second invocation of a liveness check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let count = 0;
        const promise = () => new Promise((resolve, reject) => {
            if (count > 0) {
                reject(new Error("Liveness failure"));
            }
            else {
                count = count + 1;
                resolve();
            }
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        let status = yield healthcheck.getLivenessStatus();
        status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"\DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Liveness failure\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports UP on second invocation of a liveness check', () => __awaiter(void 0, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let count = 0;
        const promise = () => new Promise((resolve, reject) => {
            if (count > 0) {
                resolve();
            }
            else {
                count = count + 1;
                reject(new Error("Liveness failure"));
            }
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        let status = yield healthcheck.getLivenessStatus();
        status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"\UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Shutdown reports STOPPED once stopped', () => __awaiter(void 0, void 0, void 0, function* () {
        process.removeAllListeners('SIGTERM');
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promiseone = () => new Promise((resolve, _reject) => {
            setTimeout(resolve, 50);
        });
        let checkone = new index_1.ShutdownCheck("checkone", promiseone);
        healthcheck.registerShutdownCheck(checkone);
        let result;
        yield new Promise((resolve) => {
            process.once('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
                // Give shutdown a chance to process
                yield setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                    const status = yield healthcheck.getStatus();
                    result = status.status;
                    resolve();
                }), 100);
            }));
            process.kill(process.pid, 'SIGTERM');
        });
        const expected = index_1.State.STOPPED;
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Shutdown reports STOPPING whilst stopping', () => __awaiter(void 0, void 0, void 0, function* () {
        process.removeAllListeners('SIGTERM');
        let healthcheck = new index_1.HealthChecker();
        const promiseone = () => new Promise((_resolve, _reject) => {
            // tslint:disable-next-line:no-shadowed-variable no-unused-expression
            new Promise((resolve, _reject) => {
                setTimeout(resolve, 1000, 'foo');
            });
        });
        let checkone = new index_1.ShutdownCheck("checkone", promiseone);
        healthcheck.registerShutdownCheck(checkone);
        let result;
        yield new Promise(resolve => {
            process.once('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
                const status = yield healthcheck.getStatus();
                result = status.status;
                resolve();
            }));
            process.kill(process.pid, 'SIGTERM');
        });
        const expected = index_1.State.STOPPING;
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Shutdown reports STOPPED and DOWN for check for error during shutdown', () => __awaiter(void 0, void 0, void 0, function* () {
        process.removeAllListeners('SIGTERM');
        let healthcheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, _reject) => {
            throw new Error("Shutdown Failure");
        });
        let checkone = new index_1.ShutdownCheck("checkone", promise);
        healthcheck.registerShutdownCheck(checkone);
        let result;
        yield new Promise(resolve => {
            process.once('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
                // must be wrapped in timeout to simulate a node tick to ensure "process.on('SIGTERM', this.onShutdownRequest)" have been executed
                setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                    const status = yield healthcheck.getStatus();
                    result = JSON.stringify(status);
                    resolve();
                }));
            }));
            process.kill(process.pid, 'SIGTERM');
        });
        const expected = "{\"status\":\"STOPPED\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Shutdown Failure\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Shutdown reports STOPPED and DOWN/DOWN for check for error during shutdown', () => __awaiter(void 0, void 0, void 0, function* () {
        process.removeAllListeners('SIGTERM');
        let healthcheck = new index_1.HealthChecker();
        const promiseone = () => new Promise((_resolve, _reject) => {
            throw new Error("Shutdown Failure");
        });
        let checkone = new index_1.ShutdownCheck("checkone", promiseone);
        healthcheck.registerShutdownCheck(checkone);
        const promisetwo = () => new Promise((_resolve, _reject) => {
            throw new Error("Shutdown Failure");
        });
        let checktwo = new index_1.ShutdownCheck("checktwo", promisetwo);
        healthcheck.registerShutdownCheck(checktwo);
        let result;
        yield new Promise(resolve => {
            process.once('SIGTERM', () => {
                // must be wrapped in timeout to simulate a node tick to ensure "process.on('SIGTERM', this.onShutdownRequest)" have been executed
                setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                    const status = yield healthcheck.getStatus();
                    result = JSON.stringify(status);
                    resolve();
                }));
            });
            process.kill(process.pid, 'SIGTERM');
        });
        let expected = "{\"status\":\"STOPPED\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Shutdown Failure\"}},{\"name\":\"checktwo\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Shutdown Failure\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Shutdown reports STOPPING and STOPPED/STOPPING for checks for one complete and one running shutdown', () => __awaiter(void 0, void 0, void 0, function* () {
        process.removeAllListeners('SIGTERM');
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promiseone = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let checkone = new index_1.ShutdownCheck("checkone", promiseone);
        healthcheck.registerShutdownCheck(checkone);
        const promisetwo = () => new Promise((_resolve, _reject) => {
            // tslint:disable-next-line:no-shadowed-variable no-unused-expression
            new Promise((resolve, _reject) => {
                setTimeout(resolve, 1000, 'foo');
            });
        });
        let checktwo = new index_1.ShutdownCheck("checktwo", promisetwo);
        healthcheck.registerShutdownCheck(checktwo);
        let result;
        yield new Promise(resolve => {
            process.once('SIGTERM', () => {
                setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                    const status = yield healthcheck.getStatus();
                    result = JSON.stringify(status);
                    resolve();
                }));
            });
            process.kill(process.pid, 'SIGTERM');
        });
        const expected = "{\"status\":\"STOPPING\",\"checks\":[{\"name\":\"checkone\",\"state\":\"STOPPED\",\"data\":{\"reason\":\"\"}},{\"name\":\"checktwo\",\"state\":\"STOPPING\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
});
describe('Should convert any promise reject to return an error message as a string', () => {
    {
        class foo {
            get message() {
                return "bar";
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
        ].forEach(([err, str]) => {
            it(`When err is ${err} should return ${str}`, () => __awaiter(void 0, void 0, void 0, function* () {
                let healthcheck = new index_1.HealthChecker();
                const readinessPromise = () => new Promise((resolve, reject) => {
                    reject(err);
                });
                let check = new index_1.ReadinessCheck("readinessCheck", readinessPromise);
                healthcheck.registerReadinessCheck(check);
                let status = yield healthcheck.getReadinessStatus();
                const result = JSON.stringify(status);
                let expected = {
                    "status": "DOWN",
                    "checks": [{
                            "name": "readinessCheck",
                            "state": "DOWN",
                            "data": {
                                "reason": str
                            }
                        }]
                };
                chai_1.expect(result).to.equal(JSON.stringify(expected), `Should return: ${expected}, but returned: ${result}`);
            }));
        });
    }
    ;
});
//# sourceMappingURL=HealthChecker.test.js.map