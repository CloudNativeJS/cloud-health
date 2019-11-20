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
    this.checks.push(status);
    if (this.status === State.UNKNOWN) {
      this.status = status.state;
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
  private startupPlugins: StartupCheck[];
  private readinessPlugins: ReadinessCheck[];
  private healthPlugins: LivenessCheck[];
  private shutdownEnabled: boolean;
  public shutdownRequested: boolean;
  private shutdownPlugins: ShutdownCheck[];

  private onShutdownRequest: () => void;

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
    }
  }

  public getStartUpComplete() {
    return this.startupComplete;
  }

  public registerStartupCheck(plugin: StartupCheck) {
    this.startupPlugins.push(plugin);
    this.startupComplete = false;
    return plugin.runCheck();
  }

  public registerReadinessCheck(plugin: ReadinessCheck) {
    this.readinessPlugins.push(plugin);
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

  public async getStatus(): Promise<HealthStatus> {
    if (this.shutdownRequested === true) {
      return this.getShutdownStatus();
    }
    if (this.startupComplete === false) {
      return this.getStartupStatus();
    }
    return this.getHealthStatus();
  }

  private async getPromiseStatus(statusResponse: HealthStatus) {
    const runChecks = this.startupPlugins.map(check => check.runCheck());
    await Promise.all(runChecks);
    this.startupPlugins.forEach(check => statusResponse.addStatus(check.getStatus()));
  }

  private async getStartupStatus(): Promise<HealthStatus> {
    let statusResponse: HealthStatus;

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
  }

  public async getReadinessStatus(): Promise<HealthStatus> {
    let statusResponse: HealthStatus;

    if (this.shutdownRequested === true) {
      return this.getShutdownStatus();
    }
    if (this.startupComplete === false) {
      statusResponse = new HealthStatus(State.UNKNOWN);
      await this.getPromiseStatus(statusResponse);
      if(statusResponse.status === State.UP) {
        this.startupComplete = true;
      } else {
        return this.getStartupStatus();
      }
    }

    // Handle readiness
    statusResponse = new HealthStatus(State.UP);
    let filteredPromises = this.readinessPlugins.filter(element => element !== undefined);
    if (filteredPromises.length === 0) {
      return statusResponse;
    } else {
      await Promise.all(filteredPromises.map(async (check) => {
        const promiseCheck = await check.runCheck();
        statusResponse.addStatus(check.getStatus());
        return promiseCheck;
      }));
      return statusResponse;
    }
  }

  public async getLivenessStatus(): Promise<HealthStatus> {
    let statusResponse: HealthStatus;

    if (this.shutdownRequested === true) {
      return this.getShutdownStatus();
    }
    if (this.startupComplete === false) {
      statusResponse = new HealthStatus(State.UNKNOWN);
      await this.getPromiseStatus(statusResponse);
      if(statusResponse.status === State.UP) {
        this.startupComplete = true;
      } else {
        return this.getStartupStatus();
      }
    }
    // Handle liveness
    statusResponse = new HealthStatus(State.UP);

    let filteredPromises = this.healthPlugins.filter(element => element !== undefined);
    if (filteredPromises.length === 0) {
      return statusResponse;
    } else {
      await Promise.all(filteredPromises.map(async (check) => {
        const promiseCheck = await check.runCheck();
        statusResponse.addStatus(check.getStatus());
        return promiseCheck;
      }));
      return statusResponse;
    }
  }

  // Health is Liveness || Readiness
  private async getHealthStatus(): Promise<HealthStatus> {
    let statusResponse: HealthStatus;

    // Handle liveness
    statusResponse = new HealthStatus(State.UP);

    await Promise.all([this.getReadinessStatus(), this.getLivenessStatus()])
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
  }

  private async getShutdownStatus(): Promise<HealthStatus>  {
    let statusResponse: HealthStatus;

    // Handle shutdown case
    if (this.shutdownRequested === true) {
      statusResponse = new HealthStatus(State.STOPPING);
      const runChecks = this.shutdownPlugins.map((check) => {
        check.runCheck();
      });
      await Promise.all(runChecks);
      this.shutdownPlugins.forEach((check) => {
        statusResponse.addStatus(check.getStatus());
      });
      return statusResponse;
    } else {
      return this.getHealthStatus();
    }
  }
}

class Plugin {
  protected name: string;
  protected status: State = State.DOWN;
  protected statusReason: string = "";
  protected promise!: () => Promise<void>;

  public getStatus(): PluginStatus {
    return new PluginStatus(this.name, this.status, this.statusReason);
  }

  constructor(name: string) {
    this.name = name;
  }

  public wrapPromise(promise: () => Promise<void>, success: State, failure: State) {
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
          } catch(err) {
            this.statusReason = String();
          }
          return Promise.resolve();
        });
    }
    return wrappedPromise;
  }
}

class LivenessCheck extends Plugin {
  constructor(name: string, livenessPromiseGen: () => Promise<void>) {
    super(name);
    this.promise = this.wrapPromise(livenessPromiseGen, State.UP, State.DOWN);
  }

  public runCheck() {
    return this.promise();
  }
}

class StartupCheck extends Plugin {
  constructor(name: string, startupPromise: () => Promise<void>) {
    super(name);
    this.promise = this.wrapPromise(startupPromise, State.UP, State.DOWN);
    this.status = State.STARTING;
  }

  public runCheck() {
    return this.promise();
  }
}

class ReadinessCheck extends Plugin {
  constructor(name: string, ReadinessPromiseGen: () => Promise<void>) {
    super(name);
    this.promise = this.wrapPromise(ReadinessPromiseGen, State.UP, State.DOWN);
    this.status = State.STARTING;
  }

  public runCheck() {
    return this.promise();
  }
}

class ShutdownCheck extends Plugin {
  constructor(name: string, shutdownPromise: () => Promise<void>) {
    super(name);
    this.promise = this.wrapPromise(shutdownPromise, State.STOPPED, State.DOWN);
    this.status = State.STOPPING;
  }

  public runCheck() {
    return this.promise();
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

export { HealthChecker, HealthStatus, Plugin, StartupCheck, ReadinessCheck, LivenessCheck, ShutdownCheck, State, PluginStatus };
