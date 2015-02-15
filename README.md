# Fire starter

## Installation

Once you have cloned the project, you need to install
[Gulp](https://github.com/gulpjs/gulp/blob/master/docs/README.md) globally:

```bash
$ npm install -g gulp
```

And then install the dependencies:

```bash
$ npm install
```

## File structure

Organise your files in a component structure: JavaScript, template and styles
of a component should be in the same folder. (ex: `/app/components/menu`.)  
Then, they will be build in the `/static/build` folder.

Images, fonts and other assets have to be in the `/static/{images,fonts}` folders.

## Tasks

### Dev

Builds CSS & JS files and watches for changes.

```bash
$ npm run dev
```

### Server

Executes `dev` task and run a local server.

```bash
$ npm run server
```

### Production

Build the files and minify them.

```bash
$ npm run prod
```
