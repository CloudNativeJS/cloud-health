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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const HealthChecker_1 = require("../HealthChecker");
const http = __importStar(require("http"));
class PingCheck extends HealthChecker_1.LivenessCheck {
    constructor(host, path = '', port = '80', method = 'HEAD') {
        let options = {
            hostname: host,
            port: port,
            path: path,
            method: method
        };
        let promise = () => new Promise(function (resolve, reject) {
            const req = http.request(options, (res) => {
                res.on('data', () => {
                    //Ensures above promise is resolved
                });
                res.on('end', () => {
                    resolve();
                });
            });
            req.on('error', (e) => {
                reject(new Error(`Failed to ping ${options.method}:${options.hostname}:${options.port}/${options.path}: ${e.message}`));
            });
            req.end();
        });
        super("PingCheck " + options.method + ":" + options.hostname + ":" + options.port + "/" + options.path, promise);
    }
}
exports.PingCheck = PingCheck;
//# sourceMappingURL=PingCheck.js.map