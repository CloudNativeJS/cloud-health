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
        this.readinessPlugins = [];
        this.healthPlugins = [];
        this.shutdownEnabled = false;
        this.shutdownRequested = false;
        this.shutdownPlugins = [];
        // Force this to be an instance function so that it can access `this` fields
        this.onShutdownRequest = () => {
            this.shutdownRequested = true;
            for (let plugin in this.shutdownPlugins) {
                if (this.shutdownPlugins[plugin] != undefined) {
                    this.shutdownPlugins[plugin].runCheck();
                }
            }
        };
    }
    registerReadinessCheck(plugin) {
        this.readinessPlugins.push(plugin);
        this.startupComplete = false;
        return plugin.runCheck();
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
        let statusResponse;
        // Handle shutdown case
        if (this.shutdownRequested === true) {
            statusResponse = new HealthStatus(State.STOPPING);
            for (let check in this.shutdownPlugins) {
                statusResponse.addStatus(this.shutdownPlugins[check].getStatus());
            }
            return Promise.resolve(statusResponse);
        }
        // Handle startup case
        if (this.startupComplete === false) {
            statusResponse = new HealthStatus(State.UNKNOWN);
            for (let check in this.readinessPlugins) {
                statusResponse.addStatus(this.readinessPlugins[check].getStatus());
            }
            if (statusResponse.status !== State.UP) {
                return Promise.resolve(statusResponse);
            }
        }
        // Startup completed, move onto liveness checks
        this.startupComplete = true;
        // Handle liveness
        statusResponse = new HealthStatus(State.UP);
        let filteredPromises = this.healthPlugins.filter(element => element !== undefined);
        if (filteredPromises.length === 0) {
            return Promise.resolve(statusResponse);
        }
        else if (filteredPromises.length === 1) {
            return filteredPromises[0].runCheck()
                .then(() => {
                statusResponse.addStatus(filteredPromises[0].getStatus());
                return statusResponse;
            });
        }
        else {
            return Promise.all(filteredPromises)
                .then(() => {
                filteredPromises.forEach((promise) => {
                    statusResponse.addStatus(promise.getStatus());
                });
                return statusResponse;
            });
        }
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
        let wrappedPromise = new Promise((resolve, reject) => {
            Promise.resolve(promise)
                .then(() => {
                this.status = success;
                resolve();
            })
                .catch((error) => {
                this.status = failure;
                this.statusReason = error.message;
                resolve();
            });
        });
        return wrappedPromise;
    }
}
exports.Plugin = Plugin;
class LivenessCheck extends Plugin {
    constructor(name, promise) {
        super(name);
        this.promise = this.wrapPromise(promise, State.UP, State.DOWN);
    }
    runCheck() {
        return Promise.resolve(this.promise);
    }
}
exports.LivenessCheck = LivenessCheck;
class ReadinessCheck extends Plugin {
    constructor(name, promise) {
        super(name);
        this.promise = this.wrapPromise(promise, State.UP, State.DOWN);
        this.status = State.STARTING;
        Promise.resolve(this.promise);
    }
    runCheck() {
        return Promise.resolve(this.promise);
    }
}
exports.ReadinessCheck = ReadinessCheck;
class ShutdownCheck extends Plugin {
    constructor(name, promise) {
        super(name);
        this.promise = this.wrapPromise(promise, State.STOPPED, State.DOWN);
        this.status = State.STOPPING;
    }
    runCheck() {
        return Promise.resolve(this.promise);
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