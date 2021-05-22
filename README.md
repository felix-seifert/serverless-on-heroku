# Serverless on Heroku [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

[Heroku](https://heroku.com/) is a webservice where users can run simple web applications for free for a limited number 
of hours per month. The obvious approach would be to run [Functions as a Service](https://www.sumologic.com/glossary/function-as-a-service/) 
to match resource supply from the server side and resource requirement from the end users' side. Such an implementation 
of a serverless application "sleeps" as long as there is no need for it. Once a user requests the function's results, 
the function is started and consumes only resources during its execution. However, Heroku does not offer the option to 
deploy serverless applications off-the-shelf to bill the customer per second.

In the following tutorial, we describe a way on how to use [Heroku's one-off dynos](https://devcenter.heroku.com/articles/one-off-dynos), 
which are usually [not addressable via HTTP requests](https://devcenter.heroku.com/articles/one-off-dynos#formation-dynos-vs-one-off-dynos), 
to process Functions as a Service with arguments provided via environment variables.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture](#architecture)
3. [Create One-off Dyno for Serverless Processing](#create-one-off-dyno-for-serverless-processing)
    * [Required Files](#required-files)
    * [Our Function](#our-function)
    * [Upload Code to Heroku](#upload-code-to-heroku)
4. [Trigger HTTP Request](#trigger-http-requests)
5. [Retrieve Log Session](#retrieve-log-session)
6. [Use With Frontend](#use-with-frontend)
7. [Copyright and License](#copyright-and-license)

## Prerequisites

To complete this tutorial, you will need:
* Around 15 minutes
* Free account on [heroku.com](http://heroku.com/) and access to it through web browser
* Working installation of the Heroku command-line interface (CLI) where you are already logged in. For information about 
  how to get started with the Heroku CLI and how to authenticate with it, [have a look at Herkou's Dev Center](https://devcenter.heroku.com/articles/heroku-cli).
* Shell with `curl`
* Some basic understanding of programming languages

## Architecture

We want to create a serverless function on Heroku which only starts and executes some code when it is requested. 
Therefore, it should not consume any resources when it is not used. 

Applications on Heroku are managed within app containers which are called dynos. Usually, each component of an 
application runs in such an isolated dyno. Scaling the application horizontally means increasing the number of dynos 
which run the same component. As the different dyno types offer different computing performance, vertical scaling means 
that the types of the dynos is changed.

The dynos can run in different configurations. One such configuration, the one-off dyno, runs detached from other dynos 
and runs only as long as it executes a task. One-off dynos have therefore the required functionality for a Function as a 
Service. However, one-off dynos are not addressable via HTTP requests and are usually attached to a terminal. 

We want to fire an external post request via Heroku's [Platform API](https://devcenter.heroku.com/articles/platform-api-reference) 
to start a one-off dyno which is then not bound to a visible terminal. A [simple Python script](https://github.com/felix-seifert/serverless-on-heroku/blob/main/one-off-dyno/serverless-task.py) 
on the dyno should read the environment variables provided by the post request. These environment variables can be 
considered as the function's arguments. If the functions return value is required, it can be read from the function 
logs.

To show that the caller of the function does not have to be in the same network or network region, we host a [static 
website on GitHub](https://felix-seifert.github.io/serverless-on-heroku/frontend/) which you can use to generate calls 
to your own one-off dyno. This static website creates a post request to invoke your one-off dyno and shows the logs.

Executing the tutorial does not result in any additional cost as a Heroku account does not cost any fee. Heroku offers 
some free computing resources which should be sufficient for this tutorial. However, if you request a very high amount 
of computing resources, be aware that Heroku might charge you some fees.

## Create One-off Dyno for Serverless Processing

The heart of our serverless application is a one-off dyno which only starts and executes some code when it is requested. 

### Required Files

The folder [one-off-dyno](https://github.com/felix-seifert/serverless-on-heroku/tree/main/one-off-dyno) includes a quite 
minimal setup required for a one-off-dyno.

* The [`Procfile`](https://github.com/felix-seifert/serverless-on-heroku/blob/main/one-off-dyno/Procfile) file specifies 
  to reach the dyno via the name `serverless` and what to execute on the command line when it is started. We decided to 
  run a Python script. You can also implement some other code which finds to an end (no specific framework needed).
* We chose to use a [Python script](https://github.com/felix-seifert/serverless-on-heroku/blob/main/one-off-dyno/serverless-task.py) 
  for our processing logic which can be modified to suit your needs.
* As we chose to execute a Python script, we need have a [`requirements.txt`](https://github.com/felix-seifert/serverless-on-heroku/blob/main/one-off-dyno/requirements.txt). 
  If there are no dependencies which the system has to install before executing the script, this file can also be empty.
  
The following paragraphs describe on how to implement these files and run them as a one-off dyno on Heroku.
  
### Our Function

The following function in pseudocode is an enhanced "hello world" version and should be run as a service. If we supply 
a `NAME`, it greets the name. Otherwise, it greets the world.

```
function hello_world(NAME)
    if (NAME is set and non-empty) then
        name = NAME;
    else
        name = 'World';
    end if
    
    return 'Hello ' + name + '!';
end function
```

The following Python implementation of the previous function does not use traditional function parameters. Instead, we 
have to request the values from the environment variables. We can also not use return statements and have to print the 
results to the console and read them from the logs later on. If we do not need any return values, we can even omit to 
read the function logs.

_serverless-task.py_
```python
import os

if 'NAME' in os.environ and len(os.environ['NAME'].strip()) > 0:
  name = os.environ['NAME'].strip()
else:
  name = 'World'

print('Hello ' + name + '!')
```

We add the Python implementation with the required `import` statement (see [example](https://github.com/felix-seifert/serverless-on-heroku/blob/main/one-off-dyno/serverless-task.py)
for reference), under the name `serverless-task.py` to the new folder `example-app` for the Heroku app.

### Upload Code to Heroku

For the interaction between our local machine and the Heroku platform, we use the Herkou CLI. The CLI allows us to 
perform most of the required interactions with the platform from the local command line.

A `Procfile` on Heroku is a text file which declares the dynos configurations and tells the platform which commands to 
execute on the dyno's startup. We have to create a `Procfile` in the folder `example-app` to tell Heroku what to do when 
we try to start our one-off dyno.

The syntax of a `Procfile` is quite simple: It should be called `Procfile` and after an identifier, it tells Heroku what 
to execute on the commandline. Our identifier is `serverless`, this is how our one-off dyno can be reached later on. We 
then tell Heroku to run our newly created Python script `serverless-task.py`. As our Python script is finite, the dyno 
will be a one-off dyno.

_Procfile_
```
serverless: python serverless-task.py
```

Do not forget to also create an empty `requirements.txt` in the app folder.

We now create an application in our Heroku account. At first, we have to initialise a Git repository with the programme 
code as Heroku usually manages deployments with Git. We do this by simply initialising a Git repo in `example-app` and 
then adding and committing the code to it.

```shell
$ cd example-app
$ git init
$ git add .
$ git commit -m "Initial commit"
```

Since the names of all Heroku apps are in a global namespace, lots of names are already taken and we cannot suggest a 
name. The Heroku CLI can be used to easily create a Heroku app for an initialised Git repository with an available name. 
Besides an app with a random name on the Heroku platform, this command results in creating a Heroku remote for the Git 
repository, i.e. a remote version of the repository on Heroku's servers.

```shell
$ heroku create
```

For ease of access, we add the newly created app's name to an environment variable called `$APP_NAME`.

```shell
$ APP_NAME=<YOUR_APP_NAME> # Replace <YOUR_APP_NAME> with name of your newly created app
```

When having a Git repository with the relevant programme code and a linked app on the Heroku platform, you just have to 
push the code to Heroku.


```shell
$ git push heroku main # Depending on your git version, main should be replaced with master
```

Read more about pushing code to Heroku in [Heroku's Dev Center](https://devcenter.heroku.com/articles/git).

Even though Heroku tries to find an appropriate buildpack and *deploys* the programme code, it cannot be reached via 
the web address of this app as only dynos of the type *web* can receive HTTP requests. However, you can already try to 
call the one-off dyno via the Heroku CLI: We just have to tell Heroku to `run` the dyno which we defined in the 
`Procfile`.

```shell
$ heroku run serverless
```

If you implement the function from above, you will see `Hello World!` on the console as we did not set any environment 
variable.

## Trigger HTTP Requests

Subsequently, we will explain how the request to trigger an HTTP request to the one-off dyno is composed. If you already 
feel confident enough with the Heroku Platform API, you can [skip this section and proceed with the final request](#final-request-and-response).

The Heroku Platform API gives the option to trigger service like the ones of the Heroku CLI via typical HTTP REST calls. 
It therefore frees authenticated entities from the need of an installed Heroku CLI and offers an 
[option to create dynos with a POST request](https://devcenter.heroku.com/articles/platform-api-reference#dyno-create), 
which can be used to start a one-off dyno. We just have to insert the name of the app for `$APP_NAME`, which we exported 
as an environment variable already.

```shell
$ curl -X POST https://api.heroku.com/apps/$APP_NAME/dynos
```

This POST request on its own, however, would not succeed. We have to specify the API's version in the header.

```shell
$ curl -X POST https://api.heroku.com/apps/$APP_NAME/dynos \
-H "Accept: application/vnd.heroku+json; version=3"
```

Additionally, we have to authenticate the caller (ourselves). One easy way of authentication is through an API key which 
we get from the Heroku CLI. We directly store it in the variable `$TOKEN` which we can then use as a Bearer token. 

```shell
$ TOKEN=$(heroku auth:token)
$ curl -X POST https://api.heroku.com/apps/$APP_NAME/dynos \
-H "Accept: application/vnd.heroku+json; version=3" \
-H "Authorization: Bearer $TOKEN"
```

However, this request still does not specify which dyno to start. Similar to the command we ran on the Heroku CLI, we 
also want to inform Heroku that it should `run` a specific command. The command should be the dyno defined in the 
`Procfile`: `serverless`. As we pass these data in JSON format, we also have to add this information to the header.

```shell
$ curl -X POST https://api.heroku.com/apps/$APP_NAME/dynos \
-H "Accept: application/vnd.heroku+json; version=3" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "command": "serverless",
  "type": "run"
}'
```

Finally, we can also set the environment variables in the body of the request and can therefore achieve arguments of 
the function.

### Final Request and Response

_Request_

```shell
$ curl -X POST https://api.heroku.com/apps/$APP_NAME/dynos \
-H "Accept: application/vnd.heroku+json; version=3" \
-H "Authorization: Bearer $TOKEN" \
-H "Content-Type: application/json" \
-d '{
  "command": "serverless",
  "type": "run",
  "env": {
    "NAME": "Daniela"
  }
}'
```

_Response_

```js
{
    ...
    "name": "<DYNO_NAME>",
    ...
}
```

The logs from the execution is however not included in the response of the request. To get the resulting logs, we have 
to request a specific URL for them. The prior response will include the name of the dyno under the JSON key `name` in 
the response, as well as additional information about the created dyno.

To make the following commands easier to execute, export the returned dyno name under the key `name` in the response 
object to an environment variable called `$DYNO_NAME`.

```shell
$ DYNO_NAME=<DYNO_NAME> # Replace <DYNO_NAME> with name of newly created dyno
```

## Retrieve Log Session

When we have invoked the command on Heroku, the API will respond with a JSON object containing the name of the dyno 
in which our command is being executed (see above).

To stream the log generated by the dyno, we can create a log session that will connect to the [log stream of the 
specified dyno and stream the result](https://devcenter.heroku.com/articles/platform-api-reference#log-session-create). 
We include the parameters `"source": "app"` and `"tail": true` to specify that we only want the logs generated by the 
command itself and that the ongoing logs should be streamed.

For passing our `$DYNO_NAME` environment variable as a JSON string, we need to surround it with single quotes 
surrounded by double quotes.

_Request_

```shell
$ curl -n -X POST https://api.heroku.com/apps/$APP_NAME/log-sessions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer $TOKEN" \
-H "Accept: application/vnd.heroku+json; version=3" \
-d '{
  "dyno": "'"$DYNO_NAME"'",
  "source": "app",
  "tail": true
}'
```

_Response_

```js
{
  ...
  "logplex_url": "<LOGPLEX_URL>",
  ...
}
```

The response from creating the log session will include a URL to the log session, specified under the key `logplex_url`. 
You can fetch this URL with `curl` and it does not require additional authentication. To ensure a correct output from 
calling the logplex URL on different devices, remember to put quotation marks (" ") around the URL.

_Request_

```shell
$ curl "<LOGPLEX_URL>" # Replace <LOGPLEX_URL> with value under key "logplex_url" in previous JSON response
```

_Response_
```shell
app[<DYNO_NAME>]: Hello Daniela!
```

If you cannot get such a response, proceed to the [next section](#use-with-frontend) as it will work with our frontend 
implementation.

## Use With Frontend

As the caller does not have to be in the same network or network region, we implemented an 
[example form on GitHub pages](https://felix-seifert.github.io/serverless-on-heroku/frontend/) which you can use to try 
out your one-off dyno and see how Heroku can be used to implement serverless Functions as a Service. You just have to 
provide the name of your Heroku app, your Heroku API key, the name of your dyno and the name which should be used in 
the Python function above. It will return the logs of the app in which you can see the return value.

You can also see a description on [how we managed to implement the calling site of the one-off dyno](https://felix-seifert.github.io/serverless-on-heroku/frontend). 
This approach can be used to trigger a function which runs independently of the calling service and process its result 
later on.

## Thank You

Thank you for reading this tutorial [⭐](https://github.com/felix-seifert/serverless-on-heroku/blob/easter-egg/easter-egg.md)! 

If you have valuable feedback you want to share, create a comment on [this issue](https://github.com/felix-seifert/serverless-on-heroku/issues/4) 
to inform us. If you have any questions or other thoughts, do not be afraid to create a [new issue](https://github.com/felix-seifert/serverless-on-heroku/issues/new).

## Copyright and License
Copyright © 2021, [Axel Pettersson](https://github.com/ackuq) and [Felix Seifert](https://www.felix-seifert.com/)

This tutorial is free. It is licensed under the [GNU GPL version 3](LICENSE). That means you are free to use this 
tutorial for any purpose; free to study and modify this tutorial to suit your needs; and free to share this tutorial or 
your modifications with anyone. If you share this tutorial or your modifications, you must grant the recipients the 
same freedoms. To be more specific: you must share the texts and the source code under the same license. For details 
see [https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html)
