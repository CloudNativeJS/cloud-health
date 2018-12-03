# Cloud Health
<p align=center>
<a href='http://CloudNativeJS.io/'><img src='https://img.shields.io/badge/homepage-CloudNativeJS-blue.svg'></a>
<a href="http://travis-ci.org/CloudNativeJS/cloud-health"><img src="https://secure.travis-ci.org/CloudNativeJS/cloud-health.svg?branch=master" alt="Build status"></a>
<a href='https://coveralls.io/github/CloudNaitveJS/cloud-health?branch=master'><img src='https://coveralls.io/repos/github/CloudNativeJS/cloud-health/badge.svg?branch=master' alt='Coverage Status' /></a>
<a href='http://github.com/CloudNativeJS/ModuleLTS'><img src='https://img.shields.io/badge/Module%20LTS-Adopted-brightgreen.svg?style=flat' alt='Module LTS Adopted' /></a> 
<a href='http://ibm.biz/node-support'><img src='https://img.shields.io/badge/IBM%20Support-Frameworks-brightgreen.svg?style=flat' alt='IBM Support' /></a>   
</p>

A core library to provide application lifecycle handling and liveness checks for Node.js applications.

Cloud Health is used by [Cloud Health Connect](http://github.com/CloudNativeJS/cloud-health-connect) to provide a Connect Middleware for use in Express.js, Loopback and other frameworks that provides:

* Readiness checks
* Liveness checks
* Shutdown handling

for use with Kubernetes and Cloud Foundry based clouds.


## Using Cloud Health

Cloud Health allows you to register promises which are executed during the three phases of your application, and allows you to call `getStatus()` to return a promise which resolves to whether the application is `STARTING`, `UP`, `DOWN`, `STOPPING` or `STOPPED`.

1. At startup for "readiness"  
 Promises that are created as part of a `ReadinessCheck` and registered using `registerReadinessCheck` are executed at startup and can be used to execute any code that must complete before your application is ready. If the startup promises are still running, calls to `getStatus()` return `STARTING`. Once the promises complete, `DOWN` is reported if there were any failures, or the "liveness" promises are then executed.
  
2. At runtimes for "liveness"  
 Promises that are created as part of a `LivenessCheck` and registered using `registerLivenessCheck` are executed on calls to `getStatus()`. These can be used to ensure that the application is still running correctly. If no promises are registered, or the complete successfully, `UP` is reported. If there are any failures, `DOWN` is reported.
 
3. On a `SIGTERM` signal for shutdown  
 Promises that are created as part of a `ShutdownCheck` and registered using `registerShutdownCheck` are executed when the process receives a `SIGTERM` making it possible to clean up any resources used by the application. If the shutdown promises are still running, calls to `getStatus()` return `STOPPING`. Once the promises complete, `STOPPED` is reported.



### Using Cloud Health with Node.js
1. Set up a HealthChecker:
  ```js
  const health = require('@cloudnative/health');
  let healthcheck = new health.HealthChecker();
  ```
2. Register a readinessCheck promise:
  ```js
  const readyPromise = new Promise(function (resolve, _reject) {
    setTimeout(function () {
      console.log('READY!');
      resolve();
    }, 10);
  });
  let readyCheck = new health.ReadinessCheck("readyCheck", readyPromise);
  healthcheck.registerReadinessCheck(readyCheck);
  ```
  Note that `registerReadinessCheck()` also returns a promise which can be used to wait until the promise is resolved.  
  
3. Register a livenessCheck promise:
  ```js
  const livePromise = new Promise(function (resolve, _reject) {
    setTimeout(function () {
      console.log('ALIVE!');
      resolve();
    }, 10);
  });
  let liveCheck = new health.LivenessCheck("liveCheck", livePromise);
  healthcheck.registerLivenessCheck(liveCheck);
  ```
4. Register a shutdownCheck promise:
  ```js
  const shutdownPromise = new Promise(function (resolve, _reject) {
    setTimeout(function () {
      console.log('DONE!');
      resolve();
    }, 10);
  });
  let shutdownCheck = new health.ShutdownCheck("shutdownCheck", shutdownPromise);
  healthcheck.registerShutdownCheck(shutdownCheck);
  ```
5. Check the applications status:
  ```js
  healthcheck.getStatus()
  .then((result) => console.log('STATUS: ' + JSON.stringify(result)));
  ```
  Note that [Cloud Health Connect](http://github.com/CloudNativeJS/cloud-health-connect) provides a Connect Middleware for use in Express.js, Loopback and other frameworks that exposes the results as an endpoint for us in Cloud Foundry and Kubernetes based clouds.
  
### Using Cloud Health with Typescript
The Cloud Health module is created in TypeScript and as such provides out of the box TypeScript support.

## Module Long Term Support Policy

This module adopts the [Module Long Term Support (LTS)](http://github.com/CloudNativeJS/ModuleLTS) policy, with the following End Of Life (EOL) dates:

| Module Version   | Release Date | Minimum EOL | EOL With     | Status  |
|------------------|--------------|-------------|--------------|---------|
| 1.x.x	         | July 2018    | Dec 2019    |              | Current |


## License

  [Apache-2.0](LICENSE)
