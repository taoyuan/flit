Flit
====
> A Flexable Javascript Task Runner.

## Getting Started

### 1. Install [flit-cli](https://github.com/taoyuan/flit-cli) globally:

```
npm install -g flit-cli
```

### 2. Install flit in your project devDependencies:

```
npm install --save-dev flit
```

### 3. Create a `flitfile.js` at the root of your project:

```javascript
module.exports = function (flit) {
	gulp.task('default', function() {
	  	// place code for your default task here
	});
};
```

### 4. Run flit:

```
flit
```

The default task will run and do nothing.

To run individual tasks, use `flit <task> <othertask>`.

## Plugins
#### [flit-contrib-flightplan](https://github.com/taoyuan/flit-contrib-flightplan)
> [Flightplan](https://github.com/pstadler/flightplan) plugin for using flightplan for streamlining application deployment or systems administration tasks.

## Reference
#### [orchestrator](https://github.com/orchestrator/orchestrator)



