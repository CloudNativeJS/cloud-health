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
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const index_1 = require("../../index");
chai_1.should();
describe('Health Checker test suite', function () {
    it('Startup reports DOWN', function () {
        let healthcheck = new index_1.HealthChecker();
        const promise = new Promise(function (_resolve, _reject) {
            throw new Error("Startup Failure");
        });
        let check = new index_1.ReadinessCheck("check", promise);
        healthcheck.registerReadinessCheck(check)
            .then(() => {
            return healthcheck.getStatus().then((status) => {
                const result = status.status;
                chai_1.expect(result).to.equal(index_1.State.DOWN, `Should return: ${index_1.State.DOWN} , but returned: ${result}`);
            });
        });
    });
    it('Startup reports UP', function () {
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promise = new Promise(function (resolve, _reject) {
            resolve();
        });
        let check = new index_1.ReadinessCheck("check", promise);
        healthcheck.registerReadinessCheck(check)
            .then(() => {
            return healthcheck.getStatus().then((status) => {
                const result = status.status;
                chai_1.expect(result).to.equal(index_1.State.UP, `Should return: ${index_1.State.UP} , but returned: ${result}`);
            });
        });
    });
    it('Startup reports STARTING when one check is up and the other is starting', function () {
        let healthcheck = new index_1.HealthChecker();
        const Check1 = new Promise(function (resolve, _reject) {
            setTimeout(() => {
                process.kill(process.pid, 'SIGTERM');
            }, 1000);
        });
        let check1 = new index_1.ReadinessCheck('Check1', Check1);
        healthcheck.registerReadinessCheck(check1);
        const Check2 = new Promise(function (resolve, _reject) {
            resolve();
        });
        let check2 = new index_1.ReadinessCheck('Check2', Check2);
        healthcheck.registerReadinessCheck(check2)
            .then(() => {
            return healthcheck.getStatus().then((status) => {
                const result = JSON.stringify(status);
                let expected = "{\"status\":\"STARTING\",\"checks\":[{\"name\":\"Check1\",\"state\":\"STARTING\",\"data\":{\"reason\":\"\"}},{\"name\":\"Check2\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
                chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
            });
        });
    });
    it('Startup reports STARTING with returned Promise', function () {
        let healthcheck = new index_1.HealthChecker();
        const promise = new Promise(function (_resolve, _reject) {
            // tslint:disable-next-line:no-shadowed-variable no-unused-expression
            new Promise(function (resolve, _reject) {
                setTimeout(resolve, 100, 'foo');
            });
        });
        let check = new index_1.ReadinessCheck("check", promise);
        healthcheck.registerReadinessCheck(check);
        return healthcheck.getStatus().then((status) => {
            const result = status.status;
            chai_1.expect(result).to.equal(index_1.State.STARTING, `Should return: ${index_1.State.STARTING} , but returned: ${result}`);
        });
    });
    it('Startup reports STARTING without returned Promise', function () {
        let healthcheck = new index_1.HealthChecker();
        const promise = new Promise(function (_resolve, _reject) {
            // tslint:disable-next-line:no-unused-expression no-shadowed-variable
            new Promise(function (resolve, _reject) {
                setTimeout(resolve, 100, 'foo');
            });
        });
        let check = new index_1.ReadinessCheck("check", promise);
        healthcheck.registerReadinessCheck(check)
            .then(() => {
            return healthcheck.getStatus().then((status) => {
                const result = status.status;
                chai_1.expect(result).to.equal(index_1.State.STARTING, `Should return: ${index_1.State.STARTING} , but returned: ${result}`);
            });
        });
    });
    it('Health reports UP by default', function () {
        let healthcheck = new index_1.HealthChecker();
        return healthcheck.getStatus().then((status) => {
            let result = status.status;
            chai_1.expect(result).to.equal(index_1.State.UP, `Should return: ${index_1.State.UP}, but returned: ${result}`);
        });
    });
    it('Health reports UP and empty checks array no registered checks', function () {
        let healthcheck = new index_1.HealthChecker();
        return healthcheck.getStatus().then((status) => {
            const result = JSON.stringify(status);
            let expected = "{\"status\":\"UP\",\"checks\":[]}";
            chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
        });
    });
    it('Health reports UP and check result with single registered check', function () {
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promise = new Promise(function (resolve, _reject) {
            resolve();
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        return healthcheck.getStatus().then((status) => {
            const result = JSON.stringify(status);
            let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"check\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
            chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
        });
    });
    it('Health reports UP and check result with two registered checks', function () {
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promiseone = new Promise(function (resolve, _reject) {
            resolve();
        });
        let checkone = new index_1.LivenessCheck("checkone", promiseone);
        healthcheck.registerLivenessCheck(checkone);
        // tslint:disable-next-line:no-shadowed-variable
        const promisetwo = new Promise(function (resolve, _reject) {
            resolve();
        });
        let checktwo = new index_1.LivenessCheck("checktwo", promisetwo);
        healthcheck.registerLivenessCheck(checktwo);
        return healthcheck.getStatus().then((status) => {
            const result = JSON.stringify(status);
            let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"checkone\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
            chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
        });
    });
    it('Health reports DOWN and check result with single failed check', function () {
        let healthcheck = new index_1.HealthChecker();
        const promise = new Promise(function (_resolve, _reject) {
            throw new Error("Startup Failure");
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        return healthcheck.getStatus().then((status) => {
            const result = JSON.stringify(status);
            let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Startup Failure\"}}]}";
            chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
        });
    });
    it('Health reports DOWN and check result with single rejected check', function () {
        let healthcheck = new index_1.HealthChecker();
        const promise = new Promise(function (_resolve, reject) {
            reject(new Error("Startup Failure"));
        });
        let check = new index_1.LivenessCheck("check", promise);
        healthcheck.registerLivenessCheck(check);
        return healthcheck.getStatus().then((status) => {
            const result = JSON.stringify(status);
            let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"check\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Startup Failure\"}}]}";
            chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
        });
    });
    it('Health reports UP with running PingCheck', function () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("google.com");
        healthcheck.registerLivenessCheck(check);
        return healthcheck.getStatus().then((status) => {
            const result = JSON.stringify(status);
            let expected = "{\"status\":\"UP\",\"checks\":[{\"name\":\"PingCheck HEAD:google.com:80/\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
            chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
        });
    });
    it('Health reports DOWN with failing PingCheck', function () {
        let healthcheck = new index_1.HealthChecker();
        let check = new index_1.PingCheck("not-an-address.com");
        healthcheck.registerLivenessCheck(check);
        return healthcheck.getStatus().then((status) => {
            const result = JSON.stringify(status);
            let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"PingCheck HEAD:not-an-address.com:80/\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Failed to ping HEAD:not-an-address.com:80/: getaddrinfo ENOTFOUND not-an-address.com not-an-address.com:80\"}}]}";
            chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
        });
    });
    it('Health reports DOWN and check result with one passed and one failed registered checks', function () {
        let healthcheck = new index_1.HealthChecker();
        const promiseone = new Promise(function (_resolve, _reject) {
            throw new Error("Startup Failure");
        });
        let checkone = new index_1.LivenessCheck("checkone", promiseone);
        healthcheck.registerLivenessCheck(checkone);
        // tslint:disable-next-line:no-shadowed-variable
        const promisetwo = new Promise(function (resolve, _reject) {
            resolve();
        });
        let checktwo = new index_1.LivenessCheck("checktwo", promisetwo);
        healthcheck.registerLivenessCheck(checktwo);
        return healthcheck.getStatus().then((status) => {
            const result = JSON.stringify(status);
            let expected = "{\"status\":\"DOWN\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Startup Failure\"}},{\"name\":\"checktwo\",\"state\":\"UP\",\"data\":{\"reason\":\"\"}}]}";
            chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
        });
    });
    it('Shutdown reports STOPPED once stopped', function () {
        process.removeAllListeners('SIGTERM');
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promiseone = new Promise(function (resolve, _reject) {
            resolve();
        });
        let checkone = new index_1.ShutdownCheck("checkone", promiseone);
        healthcheck.registerShutdownCheck(checkone);
        process.once('SIGTERM', () => {
            // Give shutdown a chance to process
            setTimeout(() => {
                return healthcheck.getStatus().then((status) => {
                    const result = status.status;
                    let expected = index_1.State.STOPPED;
                    chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
                });
            }, 100);
        });
        process.kill(process.pid, 'SIGTERM');
    });
    it('Shutdown reports STOPPING whilst stopping', function () {
        process.removeAllListeners('SIGTERM');
        let healthcheck = new index_1.HealthChecker();
        const promiseone = new Promise(function (_resolve, _reject) {
            // tslint:disable-next-line:no-shadowed-variable no-unused-expression
            new Promise(function (resolve, _reject) {
                setTimeout(resolve, 1000, 'foo');
            });
        });
        let checkone = new index_1.ShutdownCheck("checkone", promiseone);
        healthcheck.registerShutdownCheck(checkone);
        process.once('SIGTERM', () => {
            return healthcheck.getStatus().then((status) => {
                const result = status.status;
                let expected = index_1.State.STOPPING;
                chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
            });
        });
        process.kill(process.pid, 'SIGTERM');
    });
    it('Shutdown reports STOPPED and DOWN for check for error during shutdown', function () {
        process.removeAllListeners('SIGTERM');
        let healthcheck = new index_1.HealthChecker();
        const promise = new Promise(function (_resolve, _reject) {
            throw new Error("Shutdown Failure");
        });
        let checkone = new index_1.ShutdownCheck("checkone", promise);
        healthcheck.registerShutdownCheck(checkone);
        process.once('SIGTERM', () => {
            return healthcheck.getStatus().then((status) => {
                const result = JSON.stringify(status);
                let expected = "{\"status\":\"STOPPED\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Shutdown Failure\"}}]}";
                chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
            });
        });
        process.kill(process.pid, 'SIGTERM');
    });
    it('Shutdown reports STOPPED and DOWN/DOWN for check for error during shutdown', function () {
        process.removeAllListeners('SIGTERM');
        let healthcheck = new index_1.HealthChecker();
        const promiseone = new Promise(function (_resolve, _reject) {
            throw new Error("Shutdown Failure");
        });
        let checkone = new index_1.ShutdownCheck("checkone", promiseone);
        healthcheck.registerShutdownCheck(checkone);
        const promisetwo = new Promise(function (_resolve, _reject) {
            throw new Error("Shutdown Failure");
        });
        let checktwo = new index_1.ShutdownCheck("checktwo", promisetwo);
        healthcheck.registerShutdownCheck(checktwo);
        process.once('SIGTERM', () => {
            return healthcheck.getStatus().then((status) => {
                const result = JSON.stringify(status);
                let expected = "{\"status\":\"STOPPED\",\"checks\":[{\"name\":\"checkone\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Shutdown Failure\"}},{\"name\":\"checktwo\",\"state\":\"DOWN\",\"data\":{\"reason\":\"Shutdown Failure\"}}]}";
                chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
            });
        });
        process.kill(process.pid, 'SIGTERM');
    });
    it('Shutdown reports STOPPING and STOPPED/STOPPING for checks for one complete and one running shutdown', function () {
        process.removeAllListeners('SIGTERM');
        let healthcheck = new index_1.HealthChecker();
        // tslint:disable-next-line:no-shadowed-variable
        const promiseone = new Promise(function (resolve, _reject) {
            resolve();
        });
        let checkone = new index_1.ShutdownCheck("checkone", promiseone);
        healthcheck.registerShutdownCheck(checkone);
        const promisetwo = new Promise(function (_resolve, _reject) {
            // tslint:disable-next-line:no-shadowed-variable no-unused-expression
            new Promise(function (resolve, _reject) {
                setTimeout(resolve, 1000, 'foo');
            });
        });
        let checktwo = new index_1.ShutdownCheck("checktwo", promisetwo);
        healthcheck.registerShutdownCheck(checktwo);
        process.once('SIGTERM', () => {
            return healthcheck.getStatus().then((status) => {
                const result = JSON.stringify(status);
                let expected = "{\"status\":\"STOPPING\",\"checks\":[{\"name\":\"checkone\",\"state\":\"STOPPED\",\"data\":{\"reason\":\"\"}},{\"name\":\"checktwo\",\"state\":\"STOPPING\",\"data\":{\"reason\":\"\"}}]}";
                chai_1.expect(result).to.equal(expected, `Should return: ${expected}, but returned: ${result}`);
            });
        });
        process.kill(process.pid, 'SIGTERM');
    });
});
//# sourceMappingURL=HealthChecker.test.js.map