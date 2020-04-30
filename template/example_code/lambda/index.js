"use strict";
exports.handler = (event, context, callback) => {
  var request = event.Records[0].cf.request;
  const headers = request.headers;

  const reactVersion = "version=react";
  const angularVersion = "version=angular";

  const reactVersionDomain = "";
  const angularVersionDomain = "";

  let domain = "";

  if (headers.cookie) {
    for (let i = 0; i < headers.cookie.length; i++) {
      if (headers.cookie[i].value.indexOf(reactVersion) >= 0) {
        domain = reactVersionDomain;
        break;
      } else if (headers.cookie[i].value.indexOf(angularVersion) >= 0) {
        domain = angularVersionDomain;
        break;
      }
    }

    request.origin = {
      custom: {
        domainName: domain,
        port: 80,
        protocol: "http",
        path: "",
        sslProtocols: ["TLSv1", "TLSv1.1"],
        readTimeout: 5,
        keepaliveTimeout: 5,
        customHeaders: {},
      }
    };

    request.headers["host"] = [{ key: "host", value: domain }];
    callback(null, request);
  } else {
    callback(null, request);
    return;
  }
};