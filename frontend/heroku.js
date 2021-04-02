const baseURL = "https://api.heroku.com/apps/";

const decoder = new TextDecoder();

const createUrl = (endpoint, herokuApp) => `${baseURL}${herokuApp}${endpoint}`;

const makeHerokuRequest = (
    endpoint,
    herokuApp,
    apiToken,
    method = "GET",
    body = {}
) => {
    return fetch(createUrl(endpoint, herokuApp), {
        method,
        headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.heroku+json; version=3",
        },
        body: JSON.stringify(body),
    });
};

const setError = (message = "") => {
    const error = document.getElementById("error");
    error.textContent = message;
};

const setLog = (message = "") => {
    const log = document.getElementById("output");
    log.textContent = message;
};

const readStream = (reader) => {
    const log = document.getElementById("output");
    reader.read().then(({ done, value }) => {
        if (done) {
            console.log("Stream complete");
            return;
        }
        setLog(log.textContent + decoder.decode(value));

        return readStream(reader);
    });
};

const getLogStream = (dyno, herokuApp, apiToken) => {
    makeHerokuRequest("/log-sessions", herokuApp, apiToken, "POST", {
        dyno,
        tail: true,
    }).then(async (res) => {
        const content = await res.json();
        if (res.ok) {
            fetch(content.logplex_url)
                .then((response) => response.body.getReader())
                .then(readStream);
        } else {
            setError(content.message);
        }
    });
};

const startDyno = () => {
    setError();
    setLog();

    const herokuApp = document.getElementById("herokuApp").value;
    const herokuApiKey = document.getElementById("herokuApiKey").value;
    const name = document.getElementById("name").value;

    makeHerokuRequest("/dynos", herokuApp, herokuApiKey, "POST", {
        command: "serverless",
        env: {
            NAME: name,
        },
    }).then(async (res) => {
        const content = await res.json();
        if (res.ok) {
            getLogStream(content.name, herokuApp, herokuApiKey);
        } else {
            setError(content.message);
        }
    });
};
