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
    private startupPlugins;
    private readinessPlugins;
    private healthPlugins;
    private shutdownEnabled;
    shutdownRequested: boolean;
    private shutdownPlugins;
    private onShutdownRequest;
    constructor();
    getStartUpComplete(): boolean;
    registerStartupCheck(plugin: StartupCheck): Promise<void>;
    registerReadinessCheck(plugin: ReadinessCheck): void;
    registerLivenessCheck(plugin: LivenessCheck): void;
    registerShutdownCheck(plugin: ShutdownCheck): void;
    getStatus(): Promise<HealthStatus>;
    private getPromiseStatus;
    private getStartupStatus;
    getReadinessStatus(): Promise<HealthStatus>;
    getLivenessStatus(): Promise<HealthStatus>;
    private getHealthStatus;
    private getShutdownStatus;
}
declare class Plugin {
    protected name: string;
    protected status: State;
    protected statusReason: string;
    protected promise: () => Promise<void>;
    getStatus(): PluginStatus;
    constructor(name: string);
    wrapPromise(promise: () => Promise<void>, success: State, failure: State): () => Promise<void>;
}
declare class LivenessCheck extends Plugin {
    constructor(name: string, livenessPromiseGen: () => Promise<void>);
    runCheck(): Promise<void>;
}
declare class StartupCheck extends Plugin {
    constructor(name: string, startupPromise: () => Promise<void>);
    runCheck(): Promise<void>;
}
declare class ReadinessCheck extends Plugin {
    constructor(name: string, ReadinessPromiseGen: () => Promise<void>);
    runCheck(): Promise<void>;
}
declare class ShutdownCheck extends Plugin {
    constructor(name: string, shutdownPromise: () => Promise<void>);
    runCheck(): Promise<void>;
}
declare class PluginStatus {
    name: string;
    state: State;
    data: {
        [key: string]: string;
    };
    constructor(name: string, state: State, reason: string);
}
export { HealthChecker, HealthStatus, Plugin, StartupCheck, ReadinessCheck, LivenessCheck, ShutdownCheck, State, PluginStatus };
