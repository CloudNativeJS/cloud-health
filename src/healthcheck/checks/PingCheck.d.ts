import { LivenessCheck } from '../HealthChecker';
declare class PingCheck extends LivenessCheck {
    constructor(host: string, path?: string, port?: string, method?: string);
}
export { PingCheck };
