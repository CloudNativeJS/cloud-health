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

enum State {
  UNKNOWN = "UNKNOWN",
  STARTING = "STARTING",
  UP = "UP",
  DOWN = "DOWN",
  STOPPING = "STOPPING",
  STOPPED = "STOPPED",
}

class HealthStatus {
  status: State;
  checks: PluginStatus[];

  constructor(state: State) {
    this.status = state;
    this.checks = [];
  }

  public addStatus(status: PluginStatus) {
    this.checks.push(status)
    if (this.status === State.UNKNOWN) {
      this.status = status.state
    }
    else if (this.status === State.STARTING) {
      if (status.state === State.STARTING) this.status = State.STARTING;
      if (status.state === State.DOWN) this.status = State.DOWN;
      return;
    }
    else if (this.status === State.UP) {
      if (status.state === State.STARTING) this.status = State.STARTING;
      if (status.state === State.UP) this.status = State.UP;
      if (status.state === State.DOWN) this.status = State.DOWN;
      return;
    }
    else if (this.status === State.DOWN) {
      return;
    }
    else if (this.status === State.STOPPING) {
      if (status.state === State.STOPPING) this.status = State.STOPPING;
      if (status.state === State.DOWN) this.status = State.STOPPED;
      if (status.state === State.STOPPED) this.status = State.STOPPED;
      return;
    }
    else if (this.status === State.STOPPED) {
      if (status.state === State.STOPPING) this.status = State.STOPPING;
      if (status.state === State.DOWN) this.status = State.STOPPED;
      return;
    }
  }
}

class HealthChecker {
  protected startupComplete: boolean;
  private healthPlugins: LivenessCheck[];
  private readinessPlugins: ReadinessCheck[];
  private shutdownEnabled: boolean;
  public shutdownRequested: boolean;
  private shutdownPlugins: ShutdownCheck[];

  private onShutdownRequest: () => void;

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
          this.shutdownPlugins[plugin].runCheck()
        }
      }
    }
  }

  public registerReadinessCheck(plugin: ReadinessCheck) {
    this.readinessPlugins.push(plugin);
    this.startupComplete = false;
    return plugin.runCheck()
  }

  public registerLivenessCheck(plugin: LivenessCheck) {
    this.healthPlugins.push(plugin);
  }

  public registerShutdownCheck(plugin: ShutdownCheck) {
    if (this.shutdownEnabled === false) {
      this.shutdownEnabled = true;
      process.on('SIGTERM', this.onShutdownRequest);
    }
    this.shutdownPlugins.push(plugin);
  }

  public getStatus(): Promise<HealthStatus> {
    let statusResponse: HealthStatus;

    // Handle shutdown case
    if (this.shutdownRequested === true) {
      statusResponse = new HealthStatus(State.STOPPING)
      for (let check in this.shutdownPlugins) {
        statusResponse.addStatus(this.shutdownPlugins[check].getStatus())
      }
      return Promise.resolve(statusResponse)
    }

    // Handle startup case
    if (this.startupComplete === false) {
      statusResponse = new HealthStatus(State.UNKNOWN)
      for (let check in this.readinessPlugins) {
        statusResponse.addStatus(this.readinessPlugins[check].getStatus())
      }
      if (statusResponse.status !== State.UP) {
        return Promise.resolve(statusResponse)
      }
    }
    // Startup completed, move onto liveness checks
    this.startupComplete = true;

    // Handle liveness
    statusResponse = new HealthStatus(State.UP)

    let filteredPromises = this.healthPlugins.filter(element => element !== undefined)
    if (filteredPromises.length === 0) {
      return Promise.resolve(statusResponse)
    } else if (filteredPromises.length === 1) {
      return filteredPromises[0].runCheck()
        .then(() => {
          statusResponse.addStatus(filteredPromises[0].getStatus());
          return statusResponse
})
    } else {
      return Promise.all(filteredPromises)
        .then(() => {
          filteredPromises.forEach((promise) => {
            statusResponse.addStatus(promise.getStatus())
          });
          return statusResponse
        })
    }
  }
}

class Plugin {
  protected name: string
  protected status: State = State.DOWN
  protected statusReason: string = ""
  protected promise!: Promise<null>;

  public getStatus(): PluginStatus {
    return new PluginStatus(this.name, this.status, this.statusReason)
  }

  constructor(name: string) {
    this.name = name;
  }

  public wrapPromise(promise: Promise<null>, success: State, failure: State) {
    let wrappedPromise = new Promise<null>((resolve, reject) => {
      Promise.resolve(promise)
        .then(() => {
        this.status = success;
          resolve()
        })
        .catch((error) => {
          this.status = failure;
          this.statusReason = error.message;
          resolve();
        })
    })
    return wrappedPromise;
  }
}

class LivenessCheck extends Plugin {

  constructor(name: string, promise: Promise<null>) {
    super(name)
    this.promise = this.wrapPromise(promise, State.UP, State.DOWN)
  }

  public runCheck() {
    return Promise.resolve(this.promise)
  }
}

class ReadinessCheck extends Plugin {
  constructor(name: string, promise: Promise<null>) {
    super(name)
    this.promise = this.wrapPromise(promise, State.UP, State.DOWN)
    this.status = State.STARTING;
    Promise.resolve(this.promise)
  }

  public runCheck() {
    return Promise.resolve(this.promise)
  }
}

class ShutdownCheck extends Plugin {
  constructor(name: string, promise: Promise<null>) {
    super(name)
    this.promise = this.wrapPromise(promise, State.STOPPED, State.DOWN)
    this.status = State.STOPPING;
  }

  public runCheck() {
    return Promise.resolve(this.promise)
  }
}

class PluginStatus {
  name: string;
  state: State;
  data: { [key: string]: string; };

  constructor(name: string, state: State, reason: string) {
    this.name = name;
    this.state = state;
    this.data = { "reason": reason };
  }
}

export { HealthChecker, HealthStatus, Plugin, ReadinessCheck, LivenessCheck, ShutdownCheck, State, PluginStatus };
