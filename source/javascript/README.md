<h1 align="center"> Environ Me </h1>
<p align="center">
  <b >Environ Me is a node.js library for bringing peace and order to your configuration and static content files</b>
</p>

<br>

## Description :

<http://environ.me>

Environ Me is a utiliy tool that can be run from the command line, which helps you better organise your static files, by allowing you to separate out and group the parts that change, and hopefully get more of your application configuration into source control. 


It gives you:

* a command line utility that can combine multiple files based on arguments and generate ouput files.
* an npm package that can be used within your own code to produce the same merge functionality

## Installation

Stable version:
```bash
npm i -g @urbanantics/environme
```


## Usage :

### Simple Example

Environme uses the following convention to locate static files and update their content

Suppose I had the following 2 files:

static-page.template.html
```html
<!DOCTYPE html>
<html>
<body>
 <div>
   <img src="{$ config.url $}"/>
 </div>
  </body>
</html>
```

static-page.props.yml
``` yml
config:
  url: https://www.petguide.com/wp-content/uploads/2019/05/meanest-cat-breeds-bengal.jpg
  TEST:
    url: https://www.petguide.com/wp-content/uploads/2013/05/pitbull.jpg
  PROD:
    url: https://www.petguide.com/wp-content/uploads/2013/02/dalmatian-11-475x421.jpg
```

Environme will look for files that have **&ast;.template** in the name and then find the coresponding **&ast;.props.yml** file, and use these 2 files to produce the corespondin output file

So say we have a file called **static-page.template.html** and props file called **static-page.props.yml**, and both are in the folder static-content, running the following command:

```bash
environme --path static-content/* --env PROD
```

will match:
```
  static-content/static-page.template.html
  static-content/static-page.props.yml
```

and produce the following file:
```
  static-content/static-page.html
```

with the folowing content:

```html
<!DOCTYPE html>
<html>
<body>
 <div>
   <img src="https://www.petguide.com/wp-content/uploads/2013/02/dalmatian-11-475x421.jpg"/>
 </div>
  </body>
</html>
```

 <div>
   <img src="https://www.petguide.com/wp-content/uploads/2013/02/dalmatian-11-475x421.jpg"/>
 </div>

```bash
environme --path static-content/* -env TEST
```
will produce

 <div>
   <img src="https://www.petguide.com/wp-content/uploads/2013/05/pitbull.jpg"/>
 </div
  
  
and running the command with no --env will produce the default

```bash
environme --path static-content/*
```

 <div>
   <img src="https://www.petguide.com/wp-content/uploads/2019/05/meanest-cat-breeds-bengal.jpg"/>
 </div
 

## Community :

Having problems? want to contribute? email me@reubenhutton.com


