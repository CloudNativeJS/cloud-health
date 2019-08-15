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
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const index_1 = require("../../index");
chai_1.should();
describe('Health Checker test suite', () => {
    it('Startup reports DOWN', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, _reject) => {
            throw new Error("Startup Failure");
        });
        let check = new index_1.StartupCheck("check", promise);
        yield healthcheck.registerStartupCheck(check);
        const status = yield healthcheck.getStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN} , but returned: ${result}`);
    }));
    it('Startup reports UP', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promise = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let check = new index_1.StartupCheck("check", promise);
        yield healthcheck.registerReadinessCheck(check);
        const status = yield healthcheck.getStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.UP, `Should return: ${index_1.State.UP} , but returned: ${result}`);
    }));
    it('Startup reports STARTING when first is starting and second is up', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const Check1 = () => new Promise((resolve, _reject) => {
            setTimeout(() => {
                process.kill(process.pid, 'SIGTERM');
            }, 1000);
        });
        let check1 = new index_1.StartupCheck('Check1', Check1);
        healthcheck.registerStartupCheck(check1);
        const Check2 = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let check2 = new index_1.StartupCheck('Check2', Check2);
        yield healthcheck.registerStartupCheck(check2);
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"STARTING\",\"checks\":[{\"name\":\"Check1\",\"state\":\"STARTING\",\"data\":{\"reason\":\"\"}},{\"name\":\"Check2\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Startup reports STARTING when first is up and the second is starting', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const Check1 = () => new Promise((resolve, _reject) => {
            resolve();
        });
        let check1 = new index_1.StartupCheck('Check1', Check1);
        yield healthcheck.registerStartupCheck(check1);
        const Check2 = () => new Promise((resolve, _reject) => {
            setTimeout(() => {
                process.kill(process.pid, 'SIGTERM');
            }, 1000);
        });
        let check2 = new index_1.StartupCheck('Check2', Check2);
        healthcheck.registerStartupCheck(check2);
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"STARTING\",\"checks\":[{\"name\":\"Check1\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}},{\"name\":\"Check2\",\"state\":\"STARTING\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Startup reports STARTING with returned Promise', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, _reject) => {
            // tslint:disable-next-line:no-shadowed-variable no-unused-expression
            new Promise((resolve, _reject) => {
                setTimeout(resolve, 100, 'foo');
            });
        });
        let check = new index_1.StartupCheck("check", promise);
        healthcheck.registerStartupCheck(check);
        const status = yield healthcheck.getStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.STARTING, `Should return: ${index_1.State.STARTING} , but returned: ${result}`);
    }));
    it('Startup reports STARTING without returned Promise', () => {
        let healthcheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, _reject) => {
            // tslint:disable-next-line:no-unused-expression no-shadowed-variable
            new Promise((resolve, _reject) => {
                setTimeout(resolve, 100, 'foo');
            });
        });
        let check = new index_1.StartupCheck("check", promise);
        healthcheck.registerStartupCheck(check)
            .then(() => {
            return healthcheck.getStatus().then((status) => {
                const result = status.status;
                chai_1.expect(result).to.equal(index_1.State.STARTING, `Should return: ${index_1.State.STARTING} , but returned: ${result}`);
            });
        });
    });
    it('Startup reports STARTING when multiple checks are still starting', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const promise1 = () => new Promise((_resolve, _reject) => {
            // tslint:disable-next-line:no-unused-expression no-shadowed-variable
            new Promise((resolve, _reject) => {
                setTimeout(resolve, 100, 'foo');
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
        healthcheck.registerStartupCheck(check1);
        healthcheck.registerStartupCheck(check2);
        const status = yield healthcheck.getStatus();
        const result = status.status;
        chai_1.expect(result).to.equal(index_1.State.STARTING, `Should return: ${index_1.State.STARTING} , but returned: ${result}`);
    }));
    it('Health reports UP by default', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getStatus();
        let result = status.status;
        chai_1.expect(result).to.equal(index_1.State.UP, `Should return: ${index_1.State.UP}, but returned: ${result}`);
    }));
    it('Health reports UP and empty checks array no registered liveness checks', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports UP and check result with single registered liveness check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Health reports UP and check result with two registered liveness checks', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Health reports DOWN and check result with single failed liveness check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Health reports DOWN and check result with single rejected liveness check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Health reports UP with running Liveness PingCheck', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("google.com");
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"PingCheck HEAD:google.com:80/\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports DOWN with failing Liveness PingCheck', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("not-an-address.com");
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"PingCheck HEAD:not-an-address.com:80/\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Failed to ping HEAD:not-an-address.com:80/: getaddrinfo ENOTFOUND not-an-address.com\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Health reports DOWN on second invocation of a liveness check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Health reports UP on second invocation of a liveness check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Health reports DOWN and check result with one passed and one failed Liveness checks', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Health reports DOWN and check result with one passed Liveness and one failed Readiness checks', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Readiness reports UP by default', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getReadinessStatus();
        let result = status.status;
        chai_1.expect(result).to.equal(index_1.State.UP, `Should return: ${index_1.State.UP}, but returned: ${result}`);
    }));
    it('Readiness reports UP and empty checks array no registered checks', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports UP and check result with single registered check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Readiness reports UP and check result with two registered checks', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Readiness reports DOWN and check result with single failed check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Readiness reports DOWN and check result with single rejected check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Readiness reports UP with running PingCheck', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("google.com");
        healthcheck.registerReadinessCheck(check);
        const status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"PingCheck HEAD:google.com:80/\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports DOWN with failing PingCheck', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("not-an-address.com");
        healthcheck.registerReadinessCheck(check);
        const status = yield healthcheck.getReadinessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"PingCheck HEAD:not-an-address.com:80/\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Failed to ping HEAD:not-an-address.com:80/: getaddrinfo ENOTFOUND not-an-address.com\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Readiness reports DOWN and check result with one passed and one failed registered checks', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Readiness reports DOWN on second invocation of a readiness check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Readiness reports UP on second invocation of a readiness check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Liveness reports UP by default', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getLivenessStatus();
        let result = status.status;
        chai_1.expect(result).to.equal(index_1.State.UP, `Should return: ${index_1.State.UP}, but returned: ${result}`);
    }));
    it('Liveness reports UP and empty checks array no registered checks', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        const status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports UP and check result with single registered check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Liveness reports UP and check result with two registered checks', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Liveness reports DOWN and check result with single failed check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Liveness reports DOWN and check result with single rejected check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Liveness reports UP with running PingCheck', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("google.com");
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"PingCheck HEAD:google.com:80/\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports DOWN with failing PingCheck', () => __awaiter(this, void 0, void 0, function* () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("not-an-address.com");
        healthcheck.registerLivenessCheck(check);
        const status = yield healthcheck.getLivenessStatus();
        const result = JSON.stringify(status);
        let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"PingCheck HEAD:not-an-address.com:80/\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Failed to ping HEAD:not-an-address.com:80/: getaddrinfo ENOTFOUND not-an-address.com\"}}]}";
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Liveness reports DOWN and check result with one passed and one failed registered checks', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Liveness reports DOWN on second invocation of a liveness check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Liveness reports UP on second invocation of a liveness check', () => __awaiter(this, void 0, void 0, function* () {
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
    it('Shutdown reports STOPPED once stopped', () => __awaiter(this, void 0, void 0, function* () {
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
            process.once('SIGTERM', () => __awaiter(this, void 0, void 0, function* () {
                // Give shutdown a chance to process
                yield setTimeout(() => __awaiter(this, void 0, void 0, function* () {
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
    it('Shutdown reports STOPPING whilst stopping', () => __awaiter(this, void 0, void 0, function* () {
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
            process.once('SIGTERM', () => __awaiter(this, void 0, void 0, function* () {
                const status = yield healthcheck.getStatus();
                result = status.status;
                resolve();
            }));
            process.kill(process.pid, 'SIGTERM');
        });
        const expected = index_1.State.STOPPING;
        chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
    }));
    it('Shutdown reports STOPPED and DOWN for check for error during shutdown', () => __awaiter(this, void 0, void 0, function* () {
        process.removeAllListeners('SIGTERM');
        let healthcheck = new index_1.HealthChecker();
        const promise = () => new Promise((_resolve, _reject) => {
            throw new Error("Shutdown Failure");
        });
        let checkone = new index_1.ShutdownCheck("checkone", promise);
        healthcheck.registerShutdownCheck(checkone);
        let result;
        yield new Promise(resolve => {
            process.once('SIGTERM', () => __awaiter(this, void 0, void 0, function* () {
                // must be wrapped in timeout to simulate a node tick to ensure "process.on('SIGTERM', this.onShutdownRequest)" have been executed
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
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
    it('Shutdown reports STOPPED and DOWN/DOWN for check for error during shutdown', () => __awaiter(this, void 0, void 0, function* () {
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
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
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
    it('Shutdown reports STOPPING and STOPPED/STOPPING for checks for one complete and one running shutdown', () => __awaiter(this, void 0, void 0, function* () {
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
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
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
//# sourceMappingURL=HealthChecker.test.js.map