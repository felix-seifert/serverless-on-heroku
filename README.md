# Serverless on Heroku [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

[Heroku](https://heroku.com/) is a webservice where users can run simple web applications for free for a limited number 
of hours per month. The obvious approach would to run serverless applications (Functions-as-a-Service) which are billed 
per second and run only when end users request them. However, Heroku does not offer the option to deploy serverless 
applications off-the-shelf.

In the following tutorial, we describe a way on how to use [Heroku's One-off Dynos](https://devcenter.heroku.com/articles/one-off-dynos), 
which are usually [not addressable via HTTP requests](https://devcenter.heroku.com/articles/one-off-dynos#formation-dynos-vs-one-off-dynos), 
to process Functions-as-a-Service with arguments provided via environment variables.

## Prerequisites

To complete this tutorial, you will need:
* **add time estimate**
* A free account on [heroku.com](http://heroku.com/)
* A free account on [github.com](https://github.com/)
* Some basic understanding of programming languages

## Architecture

We want to create a static website which invokes our serverless function on Heroku. Heroku offers One-off Dynos which 
basically has the required functionality for a Function-as-a-Service: It starts to process only when it is invoked and 
the costs are therefore only billed when run. To show that the caller of the function does not have to be in the same 
network or network region, we host our static website on GitHub. This static website creates a post request via Heroku's 
[Platform API](https://devcenter.heroku.com/articles/platform-api-reference). The post request results in starting the 
One-off Dyno which reads the environment variables provided by the post request, which can be considered as the 
function's arguments.

The static website will ask you to key in your Heroku API key and your name. After providing key and name, you can 
click on the button to send the request to the One-off Dyno. The One-off Dyno will read your name from the environment 
variables and return a result based on your name.

Executing the tutorial does not result in any additional cost as neither a GitHub nor a Heroku account cost any fee. 
Heroku offers some free computing resources which should be sufficient for this tutorial. However, if you request a 
very high amount of computing resources, be aware that Heroku might charge you some fees.

## Copyright and License
Copyright © 2021, [Axel Pettersson](https://github.com/ackuq) and [Felix Seifert](https://github.com/felix-seifert)
This tutorial is free. It is licensed under the [GNU GPL version 3](LICENSE). That means you are free to use this 
tutorial for any purpose; free to study and modify this tutorial to suit your needs; and free to share this tutorial or 
your modifications with anyone. If you share this tutorial or your modifications, you must grant the recipients the 
same freedoms. To be more specific: you must share the texts and the source code under the same license. For details 
see [https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html)