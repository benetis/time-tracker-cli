'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _flat = require('flat');

var _flat2 = _interopRequireDefault(_flat);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _Task = require('./Task');

var _Task2 = _interopRequireDefault(_Task);

var _utils = require('./utils');

var _constants = require('./constants');

var _output = require('./output');

var _dbMigrations = require('./dbMigrations');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Manager = function () {
    function Manager(cfg) {
        _classCallCheck(this, Manager);

        this.repositories = ['tasks', 'config'];

        this.cfg = cfg;
        this.tasks = cfg.all.tasks;
        this.config = cfg.all.config ? cfg.all.config : {};
    }

    _createClass(Manager, [{
        key: 'getTask',
        value: function getTask(key) {
            var task = this.tasks[key] ? this.tasks[key] : null;
            return new _Task2.default(task);
        }
    }, {
        key: 'storeTask',
        value: function storeTask(key, task) {
            var update = {};
            update[key] = task.get();
            this.tasks = Object.assign({}, this.tasks, update);
            this.cfg.set('tasks', this.tasks);
        }
    }, {
        key: 'startTask',
        value: function startTask(key, description) {
            var _this = this;

            var t = this.getTask(key);
            t.start(description).then(function () {
                _this.storeTask(key, t);
                console.log((0, _output.outputVertical)('Task:', key, _constants.STARTED, (0, _moment2.default)().toISOString()));
            }, _output.cliError).catch(_output.cliError);
        }
    }, {
        key: 'pauseTask',
        value: function pauseTask(key) {
            var _this2 = this;

            var t = this.getTask(key);
            t.pause().then(function () {
                _this2.storeTask(key, t);
                console.log((0, _output.outputVertical)('Task:', key, _constants.PAUSED, (0, _moment2.default)().toISOString()));
            }, _output.cliError).catch(_output.cliError);
        }
    }, {
        key: 'unpauseTask',
        value: function unpauseTask(key) {
            var _this3 = this;

            var t = this.getTask(key);
            t.unpause().then(function () {
                _this3.storeTask(key, t);
                console.log((0, _output.outputVertical)('Task:', key, _constants.UNPAUSED, (0, _moment2.default)().toISOString()));
            }, _output.cliError).catch(_output.cliError);
        }
    }, {
        key: 'stopTask',
        value: function stopTask(key, description) {
            var _this4 = this;

            var t = this.getTask(key);
            t.stop(description).then(function () {
                _this4.storeTask(key, t);
                console.log((0, _output.outputVertical)('Task:', key, _constants.FINISHED, (0, _moment2.default)().toISOString()));
            }, _output.cliError).catch(_output.cliError);
        }
    }, {
        key: 'addDescription',
        value: function addDescription(key, text) {
            var t = this.getTask(key);
            t.setDescription(text);
            this.storeTask(key, t);
        }
    }, {
        key: 'getTime',
        value: function getTime(name) {
            var t = this.getTask(name);
            return t.getSeconds();
        }
    }, {
        key: 'modifyTask',
        value: function modifyTask(operation, name, stringTime) {
            var _this5 = this;

            var t = this.getTask(name);
            t.makeOperationOverTime(operation, stringTime).then(function () {
                _this5.storeTask(name, t);
            }, _output.cliError).catch(_output.cliError);
        }
    }, {
        key: 'search',
        value: function search() {
            var _this6 = this;

            var string = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'all';

            var keys = Object.keys(this.tasks);
            var tasks = [];
            keys.forEach(function (key) {
                if (string === 'all' || key.indexOf(string) > -1) {
                    tasks.push({
                        name: key,
                        task: new _Task2.default(_this6.tasks[key])
                    });
                }
            });
            return tasks;
        }
    }, {
        key: 'delete',
        value: function _delete(string) {
            var _this7 = this;

            var tasks = this.search(string);

            console.log(tasks.map(function (k) {
                return k.name + ' \n';
            }).join(''));

            if (tasks.length === 0) {
                (0, _output.cliSuccess)('No tasks found to delete.');
                return;
            }

            _inquirer2.default.prompt([{
                type: 'confirm',
                name: 'cls',
                message: 'Are you sure you want to delete this tasks?',
                default: false
            }]).then(function (answers) {
                if (answers.cls) {
                    tasks.forEach(function (k) {
                        delete _this7.tasks[k.name];
                        _this7.cfg.set('tasks', _this7.tasks);
                    });
                    (0, _output.cliSuccess)('Tasks deleted.');
                }
            }).catch(_output.cliError);
        }
    }, {
        key: 'getTasksJson',
        value: function getTasksJson(key) {
            return _flat2.default.unflatten(key ? this.tasks[key] : this.tasks);
        }
    }, {
        key: 'getTasksMd',
        value: function getTasksMd(key, start, end, expanded) {
            var tasks = void 0;
            if (key) {
                tasks = this.search(key);
            } else {
                tasks = this.search();
            }

            tasks.map(function (task) {
                if (start || end) {
                    task = task.task.filterByDates(start, end);
                }
                return task;
            });

            return (0, _output.markdown)(tasks, expanded);
        }
    }, {
        key: 'getConfig',
        value: function getConfig() {
            return this.config;
        }
    }, {
        key: 'configure',
        value: function configure(element, value) {
            if (_constants.configElements.indexOf(element) < 0) {
                return (0, _output.cliError)('Config key (' + element + ') not allowed, allowed keys: ' + this.configElements.toString() + ' ');
            }

            var newCfg = _defineProperty({}, element, value);

            this.config = Object.assign({}, this.config, newCfg);
            this.cfg.set('config', this.config);

            return this.config;
        }
    }, {
        key: 'update',
        value: function update() {
            var _this8 = this;

            if (!this.config || this.config && this.config['config.version'] !== '2') {
                console.log('DB: Need to be updated');

                (0, _dbMigrations.migrateToV2)(this.tasks).then(function (tasks) {
                    var newTasks = {};
                    tasks.forEach(function (t) {
                        return newTasks[t.key] = t.task;
                    });
                    return newTasks;
                }).then(function (migratedTasks) {
                    _this8.cfg.set('tasks', migratedTasks);
                    _this8.cfg.set('config', Object.assign(_this8.config, {
                        'config.version': '2'
                    }));

                    (0, _output.cliSuccess)('Configuration migrated to version 2.');
                }, _output.cliError).catch(_output.cliError);
            } else {
                (0, _output.cliSuccess)('No need to update the DB.');
            }
        }
    }, {
        key: 'sumarize',
        value: function sumarize(key, rate) {
            var full = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            var tasks = this.search(key);
            tasks.sort(function (a, b) {
                return a.name > b.name;
            });
            (0, _output.sumarize)(key, tasks, rate, full, this.config['format.output']);
        }
    }]);

    return Manager;
}();

exports.default = Manager;
//# sourceMappingURL=Manager.js.map