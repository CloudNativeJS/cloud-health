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
var State;
(function (State) {
    State["UNKNOWN"] = "UNKNOWN";
    State["STARTING"] = "STARTING";
    State["UP"] = "UP";
    State["DOWN"] = "DOWN";
    State["STOPPING"] = "STOPPING";
    State["STOPPED"] = "STOPPED";
})(State || (State = {}));
exports.State = State;
class HealthStatus {
    constructor(state) {
        this.status = state;
        this.checks = [];
    }
    addStatus(status) {
        this.checks.push(status);
        if (this.status === State.UNKNOWN) {
            this.status = status.state;
        }
        else if (this.status === State.STARTING) {
            if (status.state === State.STARTING)
                this.status = State.STARTING;
            if (status.state === State.DOWN)
                this.status = State.DOWN;
            return;
        }
        else if (this.status === State.UP) {
            if (status.state === State.STARTING)
                this.status = State.STARTING;
            if (status.state === State.UP)
                this.status = State.UP;
            if (status.state === State.DOWN)
                this.status = State.DOWN;
            return;
        }
        else if (this.status === State.DOWN) {
            return;
        }
        else if (this.status === State.STOPPING) {
            if (status.state === State.STOPPING)
                this.status = State.STOPPING;
            if (status.state === State.DOWN)
                this.status = State.STOPPED;
            if (status.state === State.STOPPED)
                this.status = State.STOPPED;
            return;
        }
        else if (this.status === State.STOPPED) {
            if (status.state === State.STOPPING)
                this.status = State.STOPPING;
            if (status.state === State.DOWN)
                this.status = State.STOPPED;
            return;
        }
    }
}
exports.HealthStatus = HealthStatus;
class HealthChecker {
    constructor() {
        this.startupComplete = true;
        this.startupPlugins = [];
        this.readinessPlugins = [];
        this.healthPlugins = [];
        this.shutdownEnabled = false;
        this.shutdownRequested = false;
        this.shutdownPlugins = [];
        // Force this to be an instance function so that it can access `this` fields
        this.onShutdownRequest = () => {
            this.shutdownRequested = true;
            this.shutdownPlugins.map((check) => {
                check.runCheck();
            });
        };
    }
    getStartUpComplete() {
        return this.startupComplete;
    }
    registerStartupCheck(plugin) {
        this.startupPlugins.push(plugin);
        this.startupComplete = false;
        return plugin.runCheck();
    }
    registerReadinessCheck(plugin) {
        this.readinessPlugins.push(plugin);
    }
    registerLivenessCheck(plugin) {
        this.healthPlugins.push(plugin);
    }
    registerShutdownCheck(plugin) {
        if (this.shutdownEnabled === false) {
            this.shutdownEnabled = true;
            process.on('SIGTERM', this.onShutdownRequest);
        }
        this.shutdownPlugins.push(plugin);
    }
    getStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.shutdownRequested === true) {
                return this.getShutdownStatus();
            }
            if (this.startupComplete === false) {
                return this.getStartupStatus();
            }
            return this.getHealthStatus();
        });
    }
    getPromiseStatus(statusResponse) {
        return __awaiter(this, void 0, void 0, function* () {
            const runChecks = this.startupPlugins.map(check => check.runCheck());
            yield Promise.all(runChecks);
            this.startupPlugins.forEach(check => statusResponse.addStatus(check.getStatus()));
        });
    }
    getStartupStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            let statusResponse;
            // Handle startup case
            if (this.startupComplete === false) {
                statusResponse = new HealthStatus(State.UNKNOWN);
                this.startupPlugins.map((check) => {
                    const promiseCheck = check.runCheck();
                    statusResponse.addStatus(check.getStatus());
                    return promiseCheck;
                });
                if (statusResponse.status !== State.UP) {
                    return statusResponse;
                }
                this.startupComplete = true;
            }
            return this.getHealthStatus();
        });
    }
    getReadinessStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            let statusResponse;
            if (this.shutdownRequested === true) {
                return this.getShutdownStatus();
            }
            if (this.startupComplete === false) {
                statusResponse = new HealthStatus(State.UNKNOWN);
                yield this.getPromiseStatus(statusResponse);
                if (statusResponse.status === State.UP) {
                    this.startupComplete = true;
                }
                else {
                    return this.getStartupStatus();
                }
            }
            // Handle readiness
            statusResponse = new HealthStatus(State.UP);
            let filteredPromises = this.readinessPlugins.filter(element => element !== undefined);
            if (filteredPromises.length === 0) {
                return statusResponse;
            }
            else {
                yield Promise.all(filteredPromises.map((check) => __awaiter(this, void 0, void 0, function* () {
                    const promiseCheck = yield check.runCheck();
                    statusResponse.addStatus(check.getStatus());
                    return promiseCheck;
                })));
                return statusResponse;
            }
        });
    }
    getLivenessStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            let statusResponse;
            if (this.shutdownRequested === true) {
                return this.getShutdownStatus();
            }
            if (this.startupComplete === false) {
                statusResponse = new HealthStatus(State.UNKNOWN);
                yield this.getPromiseStatus(statusResponse);
                if (statusResponse.status === State.UP) {
                    this.startupComplete = true;
                }
                else {
                    return this.getStartupStatus();
                }
            }
            // Handle liveness
            statusResponse = new HealthStatus(State.UP);
            let filteredPromises = this.healthPlugins.filter(element => element !== undefined);
            if (filteredPromises.length === 0) {
                return statusResponse;
            }
            else {
                yield Promise.all(filteredPromises.map((check) => __awaiter(this, void 0, void 0, function* () {
                    const promiseCheck = yield check.runCheck();
                    statusResponse.addStatus(check.getStatus());
                    return promiseCheck;
                })));
                return statusResponse;
            }
        });
    }
    // Health is Liveness || Readiness
    getHealthStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            let statusResponse;
            // Handle liveness
            statusResponse = new HealthStatus(State.UP);
            yield Promise.all([this.getReadinessStatus(), this.getLivenessStatus()])
                .then((values) => {
                let readiness = values[0];
                let liveness = values[1];
                readiness.checks.map((check) => {
                    statusResponse.addStatus(check);
                });
                liveness.checks.map((check) => {
                    statusResponse.addStatus(check);
                });
                return statusResponse;
            });
            return statusResponse;
        });
    }
    getShutdownStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            let statusResponse;
            // Handle shutdown case
            if (this.shutdownRequested === true) {
                statusResponse = new HealthStatus(State.STOPPING);
                const runChecks = this.shutdownPlugins.map((check) => {
                    check.runCheck();
                });
                yield Promise.all(runChecks);
                this.shutdownPlugins.forEach((check) => {
                    statusResponse.addStatus(check.getStatus());
                });
                return statusResponse;
            }
            else {
                return this.getHealthStatus();
            }
        });
    }
}
exports.HealthChecker = HealthChecker;
class Plugin {
    constructor(name) {
        this.status = State.DOWN;
        this.statusReason = "";
        this.name = name;
    }
    getStatus() {
        return new PluginStatus(this.name, this.status, this.statusReason);
    }
    wrapPromise(promise, success, failure) {
        let wrappedPromise = () => {
            return promise()
                .then(() => {
                this.status = success;
                this.statusReason = "";
                return Promise.resolve();
            })
                .catch((err) => {
                this.status = failure;
                try {
                    this.statusReason = String(err.message || err);
                }
                catch (err) {
                    this.statusReason = String();
                }
                return Promise.resolve();
            });
        };
        return wrappedPromise;
    }
}
exports.Plugin = Plugin;
class LivenessCheck extends Plugin {
    constructor(name, livenessPromiseGen) {
        super(name);
        this.promise = this.wrapPromise(livenessPromiseGen, State.UP, State.DOWN);
    }
    runCheck() {
        return this.promise();
    }
}
exports.LivenessCheck = LivenessCheck;
class StartupCheck extends Plugin {
    constructor(name, startupPromise) {
        super(name);
        this.promise = this.wrapPromise(startupPromise, State.UP, State.DOWN);
        this.status = State.STARTING;
    }
    runCheck() {
        return this.promise();
    }
}
exports.StartupCheck = StartupCheck;
class ReadinessCheck extends Plugin {
    constructor(name, ReadinessPromiseGen) {
        super(name);
        this.promise = this.wrapPromise(ReadinessPromiseGen, State.UP, State.DOWN);
        this.status = State.STARTING;
    }
    runCheck() {
        return this.promise();
    }
}
exports.ReadinessCheck = ReadinessCheck;
class ShutdownCheck extends Plugin {
    constructor(name, shutdownPromise) {
        super(name);
        this.promise = this.wrapPromise(shutdownPromise, State.STOPPED, State.DOWN);
        this.status = State.STOPPING;
    }
    runCheck() {
        return this.promise();
    }
}
exports.ShutdownCheck = ShutdownCheck;
class PluginStatus {
    constructor(name, state, reason) {
        this.name = name;
        this.state = state;
        this.data = { "reason": reason };
    }
}
exports.PluginStatus = PluginStatus;
//# sourceMappingURL=HealthChecker.js.map