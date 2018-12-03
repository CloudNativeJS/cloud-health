declare enum State {
    UNKNOWN = "UNKNOWN",
    STARTING = "STARTING",
    UP = "UP",
    DOWN = "DOWN",
    STOPPING = "STOPPING",
    STOPPED = "STOPPED"
}
declare class HealthStatus {
    status: State;
    checks: PluginStatus[];
    constructor(state: State);
    addStatus(status: PluginStatus): void;
}
declare class HealthChecker {
    protected startupComplete: boolean;
    private healthPlugins;
    private readinessPlugins;
    private shutdownEnabled;
    shutdownRequested: boolean;
    private shutdownPlugins;
    private onShutdownRequest;
    constructor();
    registerReadinessCheck(plugin: ReadinessCheck): Promise<null>;
    registerLivenessCheck(plugin: LivenessCheck): void;
    registerShutdownCheck(plugin: ShutdownCheck): void;
    getStatus(): Promise<HealthStatus>;
}
declare class Plugin {
    protected name: string;
    protected status: State;
    protected statusReason: string;
    protected promise: Promise<null>;
    getStatus(): PluginStatus;
    constructor(name: string);
    wrapPromise(promise: Promise<null>, success: State, failure: State): Promise<null>;
}
declare class LivenessCheck extends Plugin {
    constructor(name: string, promise: Promise<null>);
    runCheck(): Promise<null>;
}
declare class ReadinessCheck extends Plugin {
    constructor(name: string, promise: Promise<null>);
    runCheck(): Promise<null>;
}
declare class ShutdownCheck extends Plugin {
    constructor(name: string, promise: Promise<null>);
    runCheck(): Promise<null>;
}
declare class PluginStatus {
    name: string;
    state: State;
    data: {
        [key: string]: string;
    };
    constructor(name: string, state: State, reason: string);
}
export { HealthChecker, HealthStatus, Plugin, ReadinessCheck, LivenessCheck, ShutdownCheck, State, PluginStatus };
