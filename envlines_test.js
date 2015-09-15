var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var tsUnit;
(function (tsUnit) {
    var Test = (function () {
        function Test() {
            var testModules = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                testModules[_i - 0] = arguments[_i];
            }
            this.tests = [];
            this.reservedMethodNameContainer = new TestClass();
            this.createTestLimiter();
            for (var i = 0; i < testModules.length; i++) {
                var testModule = testModules[i];
                for (var testClass in testModule) {
                    this.addTestClass(new testModule[testClass](), testClass);
                }
            }
        }
        Test.prototype.addTestClass = function (testClass, name) {
            if (name === void 0) { name = 'Tests'; }
            this.tests.push(new TestDefintion(testClass, name));
        };
        Test.prototype.run = function (testRunLimiter) {
            if (testRunLimiter === void 0) { testRunLimiter = null; }
            var parameters = null;
            var testContext = new TestContext();
            var testResult = new TestResult();
            if (testRunLimiter == null) {
                testRunLimiter = this.testRunLimiter;
            }
            for (var i = 0; i < this.tests.length; ++i) {
                var testClass = this.tests[i].testClass;
                var dynamicTestClass = testClass;
                var testsGroupName = this.tests[i].name;
                if (testRunLimiter && !testRunLimiter.isTestsGroupActive(testsGroupName)) {
                    continue;
                }
                for (var unitTestName in testClass) {
                    if (this.isReservedFunctionName(unitTestName)
                        || (typeof dynamicTestClass[unitTestName] !== 'function')
                        || (testRunLimiter && !testRunLimiter.isTestActive(unitTestName))) {
                        continue;
                    }
                    if (typeof dynamicTestClass[unitTestName].parameters !== 'undefined') {
                        parameters = dynamicTestClass[unitTestName].parameters;
                        for (var parameterIndex = 0; parameterIndex < parameters.length; parameterIndex++) {
                            if (testRunLimiter && !testRunLimiter.isParametersSetActive(parameterIndex)) {
                                continue;
                            }
                            this.runSingleTest(testResult, testClass, unitTestName, testsGroupName, parameters, parameterIndex);
                        }
                    }
                    else {
                        this.runSingleTest(testResult, testClass, unitTestName, testsGroupName);
                    }
                }
            }
            return testResult;
        };
        Test.prototype.showResults = function (target, result) {
            var template = '<article>' +
                '<h1>' + this.getTestResult(result) + '</h1>' +
                '<p>' + this.getTestSummary(result) + '</p>' +
                this.testRunLimiter.getLimitCleaner() +
                '<section id="tsFail">' +
                '<h2>Errors</h2>' +
                '<ul class="bad">' + this.getTestResultList(result.errors) + '</ul>' +
                '</section>' +
                '<section id="tsOkay">' +
                '<h2>Passing Tests</h2>' +
                '<ul class="good">' + this.getTestResultList(result.passes) + '</ul>' +
                '</section>' +
                '</article>' +
                this.testRunLimiter.getLimitCleaner();
            target.innerHTML = template;
        };
        Test.prototype.getTapResults = function (result) {
            var newLine = '\r\n';
            var template = '1..' + (result.passes.length + result.errors.length).toString() + newLine;
            for (var i = 0; i < result.errors.length; i++) {
                template += 'not ok ' + result.errors[i].message + ' ' + result.errors[i].testName + newLine;
            }
            for (var i = 0; i < result.passes.length; i++) {
                template += 'ok ' + result.passes[i].testName + newLine;
            }
            return template;
        };
        Test.prototype.createTestLimiter = function () {
            try {
                if (typeof window !== 'undefined') {
                    this.testRunLimiter = new TestRunLimiter();
                }
            }
            catch (ex) { }
        };
        Test.prototype.isReservedFunctionName = function (functionName) {
            for (var prop in this.reservedMethodNameContainer) {
                if (prop === functionName) {
                    return true;
                }
            }
            return false;
        };
        Test.prototype.runSingleTest = function (testResult, testClass, unitTestName, testsGroupName, parameters, parameterSetIndex) {
            if (parameters === void 0) { parameters = null; }
            if (parameterSetIndex === void 0) { parameterSetIndex = null; }
            if (typeof testClass['setUp'] === 'function') {
                testClass['setUp']();
            }
            try {
                var dynamicTestClass = testClass;
                var args = (parameterSetIndex !== null) ? parameters[parameterSetIndex] : null;
                dynamicTestClass[unitTestName].apply(testClass, args);
                testResult.passes.push(new TestDescription(testsGroupName, unitTestName, parameterSetIndex, 'OK'));
            }
            catch (err) {
                testResult.errors.push(new TestDescription(testsGroupName, unitTestName, parameterSetIndex, err.toString()));
            }
            if (typeof testClass['tearDown'] === 'function') {
                testClass['tearDown']();
            }
        };
        Test.prototype.getTestResult = function (result) {
            return result.errors.length === 0 ? 'Test Passed' : 'Test Failed';
        };
        Test.prototype.getTestSummary = function (result) {
            return 'Total tests: <span id="tsUnitTotalCout">' + (result.passes.length + result.errors.length).toString() + '</span>. ' +
                'Passed tests: <span id="tsUnitPassCount" class="good">' + result.passes.length + '</span>. ' +
                'Failed tests: <span id="tsUnitFailCount" class="bad">' + result.errors.length + '</span>.';
        };
        Test.prototype.getTestResultList = function (testResults) {
            var list = '';
            var group = '';
            var isFirst = true;
            for (var i = 0; i < testResults.length; ++i) {
                var result = testResults[i];
                if (result.testName !== group) {
                    group = result.testName;
                    if (isFirst) {
                        isFirst = false;
                    }
                    else {
                        list += '</li></ul>';
                    }
                    list += '<li>' + this.testRunLimiter.getLimiterForGroup(group) + result.testName + '<ul>';
                }
                var resultClass = (result.message === 'OK') ? 'success' : 'error';
                var functionLabal = result.funcName + ((result.parameterSetNumber === null)
                    ? '()'
                    : '(' + this.testRunLimiter.getLimiterForTest(group, result.funcName, result.parameterSetNumber) + ' paramater set: ' + result.parameterSetNumber + ')');
                list += '<li class="' + resultClass + '">' + this.testRunLimiter.getLimiterForTest(group, result.funcName) + functionLabal + ': ' + this.encodeHtmlEntities(result.message) + '</li>';
            }
            return list + '</ul>';
        };
        Test.prototype.encodeHtmlEntities = function (input) {
            return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };
        return Test;
    })();
    tsUnit.Test = Test;
    var TestRunLimiterRunAll = (function () {
        function TestRunLimiterRunAll() {
        }
        TestRunLimiterRunAll.prototype.isTestsGroupActive = function (groupName) {
            return true;
        };
        TestRunLimiterRunAll.prototype.isTestActive = function (testName) {
            return true;
        };
        TestRunLimiterRunAll.prototype.isParametersSetActive = function (paramatersSetNumber) {
            return true;
        };
        return TestRunLimiterRunAll;
    })();
    var TestRunLimiter = (function () {
        function TestRunLimiter() {
            this.groupName = null;
            this.testName = null;
            this.parameterSet = null;
            this.setRefreshOnLinksWithHash();
            this.translateStringIntoTestsLimit(window.location.hash);
        }
        TestRunLimiter.prototype.isTestsGroupActive = function (groupName) {
            if (this.groupName === null) {
                return true;
            }
            return this.groupName === groupName;
        };
        TestRunLimiter.prototype.isTestActive = function (testName) {
            if (this.testName === null) {
                return true;
            }
            return this.testName === testName;
        };
        TestRunLimiter.prototype.isParametersSetActive = function (paramatersSet) {
            if (this.parameterSet === null) {
                return true;
            }
            return this.parameterSet === paramatersSet;
        };
        TestRunLimiter.prototype.getLimiterForTest = function (groupName, testName, parameterSet) {
            if (parameterSet === void 0) { parameterSet = null; }
            if (parameterSet !== null) {
                testName += '(' + parameterSet + ')';
            }
            return '&nbsp;<a href="#' + groupName + '/' + testName + '\" class="ascii">&#9658;</a>&nbsp;';
        };
        TestRunLimiter.prototype.getLimiterForGroup = function (groupName) {
            return '&nbsp;<a href="#' + groupName + '" class="ascii">&#9658;</a>&nbsp;';
        };
        TestRunLimiter.prototype.getLimitCleaner = function () {
            return '<p><a href="#">Run all tests <span class="ascii">&#9658;</span></a></p>';
        };
        TestRunLimiter.prototype.setRefreshOnLinksWithHash = function () {
            var previousHandler = window.onhashchange;
            window.onhashchange = function (ev) {
                window.location.reload();
                if (typeof previousHandler === 'function') {
                    previousHandler(ev);
                }
            };
        };
        TestRunLimiter.prototype.translateStringIntoTestsLimit = function (value) {
            var regex = /^#([_a-zA-Z0-9]+)((\/([_a-zA-Z0-9]+))(\(([0-9]+)\))?)?$/;
            var result = regex.exec(value);
            if (result === null) {
                return;
            }
            if (result.length > 1 && !!result[1]) {
                this.groupName = result[1];
            }
            if (result.length > 4 && !!result[4]) {
                this.testName = result[4];
            }
            if (result.length > 6 && !!result[6]) {
                this.parameterSet = parseInt(result[6], 10);
            }
        };
        return TestRunLimiter;
    })();
    var TestContext = (function () {
        function TestContext() {
        }
        TestContext.prototype.setUp = function () {
        };
        TestContext.prototype.tearDown = function () {
        };
        TestContext.prototype.areIdentical = function (expected, actual, message) {
            if (message === void 0) { message = ''; }
            if (expected !== actual) {
                throw this.getError('areIdentical failed when given ' +
                    this.printVariable(expected) + ' and ' + this.printVariable(actual), message);
            }
        };
        TestContext.prototype.areNotIdentical = function (expected, actual, message) {
            if (message === void 0) { message = ''; }
            if (expected === actual) {
                throw this.getError('areNotIdentical failed when given ' +
                    this.printVariable(expected) + ' and ' + this.printVariable(actual), message);
            }
        };
        TestContext.prototype.areCollectionsIdentical = function (expected, actual, message) {
            var _this = this;
            if (message === void 0) { message = ''; }
            function resultToString(result) {
                var msg = '';
                while (result.length > 0) {
                    msg = '[' + result.pop() + ']' + msg;
                }
                return msg;
            }
            var compareArray = function (expected, actual, result) {
                var indexString = '';
                if (expected === null) {
                    if (actual !== null) {
                        indexString = resultToString(result);
                        throw _this.getError('areCollectionsIdentical failed when array a' +
                            indexString + ' is null and b' +
                            indexString + ' is not null', message);
                    }
                    return; // correct: both are nulls
                }
                else if (actual === null) {
                    indexString = resultToString(result);
                    throw _this.getError('areCollectionsIdentical failed when array a' +
                        indexString + ' is not null and b' +
                        indexString + ' is null', message);
                }
                if (expected.length !== actual.length) {
                    indexString = resultToString(result);
                    throw _this.getError('areCollectionsIdentical failed when length of array a' +
                        indexString + ' (length: ' + expected.length + ') is different of length of array b' +
                        indexString + ' (length: ' + actual.length + ')', message);
                }
                for (var i = 0; i < expected.length; i++) {
                    if ((expected[i] instanceof Array) && (actual[i] instanceof Array)) {
                        result.push(i);
                        compareArray(expected[i], actual[i], result);
                        result.pop();
                    }
                    else if (expected[i] !== actual[i]) {
                        result.push(i);
                        indexString = resultToString(result);
                        throw _this.getError('areCollectionsIdentical failed when element a' +
                            indexString + ' (' + _this.printVariable(expected[i]) + ') is different than element b' +
                            indexString + ' (' + _this.printVariable(actual[i]) + ')', message);
                    }
                }
                return;
            };
            compareArray(expected, actual, []);
        };
        TestContext.prototype.areCollectionsNotIdentical = function (expected, actual, message) {
            if (message === void 0) { message = ''; }
            try {
                this.areCollectionsIdentical(expected, actual);
            }
            catch (ex) {
                return;
            }
            throw this.getError('areCollectionsNotIdentical failed when both collections are identical', message);
        };
        TestContext.prototype.isTrue = function (actual, message) {
            if (message === void 0) { message = ''; }
            if (!actual) {
                throw this.getError('isTrue failed when given ' + this.printVariable(actual), message);
            }
        };
        TestContext.prototype.isFalse = function (actual, message) {
            if (message === void 0) { message = ''; }
            if (actual) {
                throw this.getError('isFalse failed when given ' + this.printVariable(actual), message);
            }
        };
        TestContext.prototype.isTruthy = function (actual, message) {
            if (message === void 0) { message = ''; }
            if (!actual) {
                throw this.getError('isTrue failed when given ' + this.printVariable(actual), message);
            }
        };
        TestContext.prototype.isFalsey = function (actual, message) {
            if (message === void 0) { message = ''; }
            if (actual) {
                throw this.getError('isFalse failed when given ' + this.printVariable(actual), message);
            }
        };
        TestContext.prototype.throws = function (a, message, errorString) {
            if (message === void 0) { message = ''; }
            if (errorString === void 0) { errorString = ''; }
            var actual;
            if (a.fn) {
                actual = a.fn;
                message = a.message;
                errorString = a.exceptionString;
            }
            var isThrown = false;
            try {
                actual();
            }
            catch (ex) {
                if (!errorString || ex.message === errorString) {
                    isThrown = true;
                }
                if (errorString && ex.message !== errorString) {
                    throw this.getError('different error string than supplied');
                }
            }
            if (!isThrown) {
                throw this.getError('did not throw an error', message || '');
            }
        };
        TestContext.prototype.executesWithin = function (actual, timeLimit, message) {
            if (message === void 0) { message = null; }
            function getTime() {
                return window.performance.now();
            }
            function timeToString(value) {
                return Math.round(value * 100) / 100;
            }
            var startOfExecution = getTime();
            try {
                actual();
            }
            catch (ex) {
                throw this.getError('isExecuteTimeLessThanLimit fails when given code throws an exception: "' + ex + '"', message);
            }
            var executingTime = getTime() - startOfExecution;
            if (executingTime > timeLimit) {
                throw this.getError('isExecuteTimeLessThanLimit fails when execution time of given code (' + timeToString(executingTime) + ' ms) ' +
                    'exceed the given limit(' + timeToString(timeLimit) + ' ms)', message);
            }
        };
        TestContext.prototype.fail = function (message) {
            if (message === void 0) { message = ''; }
            throw this.getError('fail', message);
        };
        TestContext.prototype.getError = function (resultMessage, message) {
            if (message === void 0) { message = ''; }
            if (message) {
                return new Error(resultMessage + '. ' + message);
            }
            return new Error(resultMessage);
        };
        TestContext.getNameOfClass = function (inputClass) {
            // see: https://www.stevefenton.co.uk/Content/Blog/Date/201304/Blog/Obtaining-A-Class-Name-At-Runtime-In-TypeScript/
            var funcNameRegex = /function (.{1,})\(/;
            var results = (funcNameRegex).exec(inputClass.constructor.toString());
            return (results && results.length > 1) ? results[1] : '';
        };
        TestContext.prototype.printVariable = function (variable) {
            if (variable === null) {
                return '"null"';
            }
            if (typeof variable === 'object') {
                return '{object: ' + TestContext.getNameOfClass(variable) + '}';
            }
            return '{' + (typeof variable) + '} "' + variable + '"';
        };
        return TestContext;
    })();
    tsUnit.TestContext = TestContext;
    var TestClass = (function (_super) {
        __extends(TestClass, _super);
        function TestClass() {
            _super.apply(this, arguments);
        }
        TestClass.prototype.parameterizeUnitTest = function (method, parametersArray) {
            method.parameters = parametersArray;
        };
        return TestClass;
    })(TestContext);
    tsUnit.TestClass = TestClass;
    var FakeFactory = (function () {
        function FakeFactory() {
        }
        FakeFactory.getFake = function (obj) {
            var implementations = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                implementations[_i - 1] = arguments[_i];
            }
            var fakeType = function () { };
            this.populateFakeType(fakeType, obj);
            var fake = new fakeType();
            for (var member in fake) {
                if (typeof fake[member] === 'function') {
                    fake[member] = function () { console.log('Default fake called.'); };
                }
            }
            var memberNameIndex = 0;
            var memberValueIndex = 1;
            for (var i = 0; i < implementations.length; i++) {
                var impl = implementations[i];
                fake[impl[memberNameIndex]] = impl[memberValueIndex];
            }
            return fake;
        };
        FakeFactory.populateFakeType = function (fake, toCopy) {
            for (var property in toCopy) {
                if (toCopy.hasOwnProperty(property)) {
                    fake[property] = toCopy[property];
                }
            }
            var __ = function () {
                this.constructor = fake;
            };
            __.prototype = toCopy.prototype;
            fake.prototype = new __();
        };
        return FakeFactory;
    })();
    tsUnit.FakeFactory = FakeFactory;
    var TestDefintion = (function () {
        function TestDefintion(testClass, name) {
            this.testClass = testClass;
            this.name = name;
        }
        return TestDefintion;
    })();
    var TestDescription = (function () {
        function TestDescription(testName, funcName, parameterSetNumber, message) {
            this.testName = testName;
            this.funcName = funcName;
            this.parameterSetNumber = parameterSetNumber;
            this.message = message;
        }
        return TestDescription;
    })();
    tsUnit.TestDescription = TestDescription;
    var TestResult = (function () {
        function TestResult() {
            this.passes = [];
            this.errors = [];
        }
        return TestResult;
    })();
    tsUnit.TestResult = TestResult;
})(tsUnit || (tsUnit = {}));
var Eden;
(function (Eden) {
    Eden.BlockAir = 0;
    Eden.BlockWall = 1;
    Eden.BlockFloor = 2;
    Eden.blockTypes = {};
    function registerBlock(type, block) {
        Eden.blockTypes[type] = block;
    }
    Eden.registerBlock = registerBlock;
})(Eden || (Eden = {}));
// Constructive Solid Geometry (CSG) is a modeling technique that uses Boolean
// operations like union and intersection to combine 3D solids. This library
// implements CSG operations on meshes elegantly and concisely using BSP trees,
// and is meant to serve as an easily understandable implementation of the
// algorithm. All edge cases involving overlapping coplanar polygons in both
// solids are correctly handled.
//
// Example usage:
//
//     var cube = CSG.cube();
//     var sphere = CSG.sphere({ radius: 1.3 });
//     var polygons = cube.subtract(sphere).toPolygons();
//
// ## Implementation Details
//
// All CSG operations are implemented in terms of two functions, `clipTo()` and
// `invert()`, which remove parts of a BSP tree inside another BSP tree and swap
// solid and empty space, respectively. To find the union of `a` and `b`, we
// want to remove everything in `a` inside `b` and everything in `b` inside `a`,
// then combine polygons from `a` and `b` into one solid:
//
//     a.clipTo(b);
//     b.clipTo(a);
//     a.build(b.allPolygons());
//
// The only tricky part is handling overlapping coplanar polygons in both trees.
// The code above keeps both copies, but we need to keep them in one tree and
// remove them in the other tree. To remove them from `b` we can clip the
// inverse of `b` against `a`. The code for union now looks like this:
//
//     a.clipTo(b);
//     b.clipTo(a);
//     b.invert();
//     b.clipTo(a);
//     b.invert();
//     a.build(b.allPolygons());
//
// Subtraction and intersection naturally follow from set operations. If
// union is `A | B`, subtraction is `A - B = ~(~A | B)` and intersection is
// `A & B = ~(~A | ~B)` where `~` is the complement operator.
//
// ## License
//
// Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.
// Adapted to Typescript and extended by Joel Webber (jgw@pobox.com).
var CSG;
(function (CSG) {
    // Holds a binary space partition tree representing a 3D solid. Two solids can
    // be combined using the `union()`, `subtract()`, and `intersect()` methods.
    var Model = (function () {
        function Model() {
            this.polygons = [];
        }
        // Construct a CSG solid from a list of `Polygon` instances.
        Model.fromPolygons = function (polygons) {
            var csg = new Model();
            csg.polygons = polygons;
            return csg;
        };
        Model.prototype.clone = function () {
            var csg = new Model();
            csg.polygons = this.polygons.map(function (p) { return p.clone(); });
            return csg;
        };
        Model.prototype.toPolygons = function () {
            return this.polygons;
        };
        // Return a new CSG solid representing space in either this solid or in the
        // solid `csg`. Neither this solid nor the solid `csg` are modified.
        //
        //     A.union(B)
        //
        //     +-------+            +-------+
        //     |       |            |       |
        //     |   A   |            |       |
        //     |    +--+----+   =   |       +----+
        //     +----+--+    |       +----+       |
        //          |   B   |            |       |
        //          |       |            |       |
        //          +-------+            +-------+
        //
        Model.prototype.union = function (csg) {
            var a = new Node(this.clone().polygons);
            var b = new Node(csg.clone().polygons);
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            return Model.fromPolygons(a.allPolygons());
        };
        // Return a new CSG solid representing space in this solid but not in the
        // solid `csg`. Neither this solid nor the solid `csg` are modified.
        //
        //     A.subtract(B)
        //
        //     +-------+            +-------+
        //     |       |            |       |
        //     |   A   |            |       |
        //     |    +--+----+   =   |    +--+
        //     +----+--+    |       +----+
        //          |   B   |
        //          |       |
        //          +-------+
        //
        Model.prototype.subtract = function (csg) {
            var a = new Node(this.clone().polygons);
            var b = new Node(csg.clone().polygons);
            a.invert();
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            a.invert();
            return Model.fromPolygons(a.allPolygons());
        };
        // Return a new CSG solid representing space both this solid and in the
        // solid `csg`. Neither this solid nor the solid `csg` are modified.
        //
        //     A.intersect(B)
        //
        //     +-------+
        //     |       |
        //     |   A   |
        //     |    +--+----+   =   +--+
        //     +----+--+    |       +--+
        //          |   B   |
        //          |       |
        //          +-------+
        //
        Model.prototype.intersect = function (csg) {
            var a = new Node(this.clone().polygons);
            var b = new Node(csg.clone().polygons);
            a.invert();
            b.clipTo(a);
            b.invert();
            a.clipTo(b);
            b.clipTo(a);
            a.build(b.allPolygons());
            a.invert();
            return Model.fromPolygons(a.allPolygons());
        };
        // Return a new CSG solid with solid and empty space switched. This solid is
        // not modified.
        Model.prototype.inverse = function () {
            var csg = this.clone();
            csg.polygons.map(function (p) { p.flip(); });
            return csg;
        };
        return Model;
    })();
    // Construct an axis-aligned solid cuboid. Optional parameters are `center`,
    // `radius`, and `xform`, which default to `[0, 0, 0]` and `[1, 1, 1]` and
    // the 3x3 identity matrix.
    //
    // Example code:
    //
    //     var cube = CSG.cube({
    //       center: [0, 0, 0],
    //       radius: [1, 1, 1],
    //       xform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
    //     });
    function cube(options) {
        var c = Vector.fromArray(options.center || [0, 0, 0]);
        var r = options.radius ? options.radius : [1, 1, 1];
        return Model.fromPolygons([
            [[0, 4, 6, 2], [-1, 0, 0]],
            [[1, 3, 7, 5], [+1, 0, 0]],
            [[0, 1, 5, 4], [0, -1, 0]],
            [[2, 6, 7, 3], [0, +1, 0]],
            [[0, 2, 3, 1], [0, 0, -1]],
            [[4, 5, 7, 6], [0, 0, +1]]
        ].map(function (info) {
            return new Polygon(info[0].map(function (i) {
                var pos = new Vector(r[0] * (2 * (i & 1 ? 1 : 0) - 1), r[1] * (2 * (i & 2 ? 1 : 0) - 1), r[2] * (2 * (i & 4 ? 1 : 0) - 1));
                var normal = Vector.fromArray(info[1]);
                if (options.xform) {
                    pos = pos.mat3Times(options.xform);
                    normal = normal.mat3Times(options.xform);
                }
                pos.x += c.x;
                pos.y += c.y;
                pos.z += c.z;
                return new Vertex(pos, normal);
            }));
        }));
    }
    CSG.cube = cube;
    // Construct a solid sphere. Optional parameters are `center`, `radius`,
    // `slices`, and `stacks`, which default to `[0, 0, 0]`, `1`, `16`, and `8`.
    // The `slices` and `stacks` parameters control the tessellation along the
    // longitude and latitude directions.
    //
    // Example usage:
    //
    //     var sphere = CSG.sphere({
    //       center: [0, 0, 0],
    //       radius: 1,
    //       slices: 16,
    //       stacks: 8
    //     });
    function sphere(options) {
        var c = Vector.fromArray(options.center || [0, 0, 0]);
        var r = options.radius || 1;
        var slices = options.slices || 16;
        var stacks = options.stacks || 8;
        var polygons = [], vertices;
        function vertex(theta, phi) {
            theta *= Math.PI * 2;
            phi *= Math.PI;
            var dir = new Vector(Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi));
            vertices.push(new Vertex(c.plus(dir.times(r)), dir));
        }
        for (var i = 0; i < slices; i++) {
            for (var j = 0; j < stacks; j++) {
                vertices = [];
                vertex(i / slices, j / stacks);
                if (j > 0) {
                    vertex((i + 1) / slices, j / stacks);
                }
                if (j < stacks - 1) {
                    vertex((i + 1) / slices, (j + 1) / stacks);
                }
                vertex(i / slices, (j + 1) / stacks);
                polygons.push(new Polygon(vertices));
            }
        }
        return Model.fromPolygons(polygons);
    }
    CSG.sphere = sphere;
    // Construct a solid cylinder. Optional parameters are `start`, `end`,
    // `radius`, and `slices`, which default to `[0, -1, 0]`, `[0, 1, 0]`, `1`, and
    // `16`. The `slices` parameter controls the tessellation.
    //
    // Example usage:
    //
    //     var cylinder = CSG.cylinder({
    //       start: [0, -1, 0],
    //       end: [0, 1, 0],
    //       radius: 1,
    //       slices: 16
    //     });
    function cylinder(options) {
        var s = Vector.fromArray(options.start || [0, -1, 0]);
        var e = Vector.fromArray(options.end || [0, 1, 0]);
        var ray = e.minus(s);
        var r = options.radius || 1;
        var slices = options.slices || 16;
        var axisZ = ray.unit(), isY = (Math.abs(axisZ.y) > 0.5);
        var axisX = new Vector(isY ? 1 : 0, isY ? 0 : 1, 0).cross(axisZ).unit();
        var axisY = axisX.cross(axisZ).unit();
        var start = new Vertex(s, axisZ.negated());
        var end = new Vertex(e, axisZ.unit());
        var polygons = [];
        function point(stack, slice, normalBlend) {
            var angle = slice * Math.PI * 2;
            var out = axisX.times(Math.cos(angle)).plus(axisY.times(Math.sin(angle)));
            var pos = s.plus(ray.times(stack)).plus(out.times(r));
            var normal = out.times(1 - Math.abs(normalBlend)).plus(axisZ.times(normalBlend));
            return new Vertex(pos, normal);
        }
        for (var i = 0; i < slices; i++) {
            var t0 = i / slices, t1 = (i + 1) / slices;
            polygons.push(new Polygon([start, point(0, t0, -1), point(0, t1, -1)]));
            polygons.push(new Polygon([point(0, t1, 0), point(0, t0, 0), point(1, t0, 0), point(1, t1, 0)]));
            polygons.push(new Polygon([end, point(1, t1, 1), point(1, t0, 1)]));
        }
        return Model.fromPolygons(polygons);
    }
    CSG.cylinder = cylinder;
    // Represents a 3D vector.
    //
    // Example usage:
    //
    //     new CSG.Vector(1, 2, 3);
    //     new CSG.Vector([1, 2, 3]);
    var Vector = (function () {
        function Vector(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        Vector.fromArray = function (a) {
            return new Vector(a[0], a[1], a[2]);
        };
        Vector.prototype.clone = function () {
            return new Vector(this.x, this.y, this.z);
        };
        Vector.prototype.negated = function () {
            return new Vector(-this.x, -this.y, -this.z);
        };
        Vector.prototype.plus = function (a) {
            return new Vector(this.x + a.x, this.y + a.y, this.z + a.z);
        };
        Vector.prototype.minus = function (a) {
            return new Vector(this.x - a.x, this.y - a.y, this.z - a.z);
        };
        Vector.prototype.times = function (a) {
            return new Vector(this.x * a, this.y * a, this.z * a);
        };
        Vector.prototype.dividedBy = function (a) {
            return new Vector(this.x / a, this.y / a, this.z / a);
        };
        Vector.prototype.dot = function (a) {
            return this.x * a.x + this.y * a.y + this.z * a.z;
        };
        Vector.prototype.lerp = function (a, t) {
            return this.plus(a.minus(this).times(t));
        };
        Vector.prototype.length = function () {
            return Math.sqrt(this.dot(this));
        };
        Vector.prototype.unit = function () {
            return this.dividedBy(this.length());
        };
        Vector.prototype.cross = function (a) {
            return new Vector(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x);
        };
        Vector.prototype.mat3Times = function (xf) {
            return new Vector(xf[0] * this.x + xf[3] * this.y + xf[6] * this.z, xf[1] * this.x + xf[4] * this.y + xf[7] * this.z, xf[2] * this.x + xf[5] * this.y + xf[8] * this.z);
        };
        return Vector;
    })();
    CSG.Vector = Vector;
    // Represents a vertex of a polygon. Use your own vertex class instead of this
    // one to provide additional features like texture coordinates and vertex
    // colors. Custom vertex classes need to provide a `pos` property and `clone()`,
    // `flip()`, and `interpolate()` methods that behave analogous to the ones
    // defined by `CSG.Vertex`. This class provides `normal` so convenience
    // functions like `CSG.sphere()` can return a smooth vertex normal, but `normal`
    // is not used anywhere else.
    var Vertex = (function () {
        function Vertex(pos, normal) {
            this.pos = pos.clone();
            this.normal = normal.clone();
        }
        Vertex.prototype.clone = function () {
            return new Vertex(this.pos.clone(), this.normal.clone());
        };
        // Invert all orientation-specific data (e.g. vertex normal). Called when the
        // orientation of a polygon is flipped.
        Vertex.prototype.flip = function () {
            this.normal = this.normal.negated();
        };
        // Create a new vertex between this vertex and `other` by linearly
        // interpolating all properties using a parameter of `t`. Subclasses should
        // override this to interpolate additional properties.
        Vertex.prototype.interpolate = function (other, t) {
            return new Vertex(this.pos.lerp(other.pos, t), this.normal.lerp(other.normal, t));
        };
        return Vertex;
    })();
    CSG.Vertex = Vertex;
    // Represents a plane in 3D space.
    var Plane = (function () {
        function Plane(normal, w) {
            this.normal = normal;
            this.w = w;
        }
        Plane.prototype.clone = function () {
            return new Plane(this.normal.clone(), this.w);
        };
        Plane.prototype.flip = function () {
            this.normal = this.normal.negated();
            this.w = -this.w;
        };
        // Split `polygon` by this plane if needed, then put the polygon or polygon
        // fragments in the appropriate lists. Coplanar polygons go into either
        // `coplanarFront` or `coplanarBack` depending on their orientation with
        // respect to this plane. Polygons in front or in back of this plane go into
        // either `front` or `back`.
        Plane.prototype.splitPolygon = function (polygon, coplanarFront, coplanarBack, front, back) {
            var COPLANAR = 0;
            var FRONT = 1;
            var BACK = 2;
            var SPANNING = 3;
            // Classify each point as well as the entire polygon into one of the above
            // four classes.
            var polygonType = 0;
            var types = [];
            for (var i = 0; i < polygon.vertices.length; i++) {
                var t = this.normal.dot(polygon.vertices[i].pos) - this.w;
                var type = (t < -Plane.EPSILON) ? BACK : (t > Plane.EPSILON) ? FRONT : COPLANAR;
                polygonType |= type;
                types.push(type);
            }
            // Put the polygon in the correct list, splitting it when necessary.
            switch (polygonType) {
                case COPLANAR:
                    (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
                    break;
                case FRONT:
                    front.push(polygon);
                    break;
                case BACK:
                    back.push(polygon);
                    break;
                case SPANNING:
                    var f = [], b = [];
                    for (var i = 0; i < polygon.vertices.length; i++) {
                        var j = (i + 1) % polygon.vertices.length;
                        var ti = types[i], tj = types[j];
                        var vi = polygon.vertices[i], vj = polygon.vertices[j];
                        if (ti != BACK)
                            f.push(vi);
                        if (ti != FRONT)
                            b.push(ti != BACK ? vi.clone() : vi);
                        if ((ti | tj) == SPANNING) {
                            var t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(vj.pos.minus(vi.pos));
                            var v = vi.interpolate(vj, t);
                            f.push(v);
                            b.push(v.clone());
                        }
                    }
                    if (f.length >= 3)
                        front.push(new Polygon(f, polygon.shared));
                    if (b.length >= 3)
                        back.push(new Polygon(b, polygon.shared));
                    break;
            }
        };
        // `Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
        // point is on the plane.
        Plane.EPSILON = 1e-5;
        Plane.fromPoints = function (a, b, c) {
            var n = b.minus(a).cross(c.minus(a)).unit();
            return new Plane(n, n.dot(a));
        };
        return Plane;
    })();
    CSG.Plane = Plane;
    // Represents a convex polygon. The vertices used to initialize a polygon must
    // be coplanar and form a convex loop. They do not have to be `CSG.Vertex`
    // instances but they must behave similarly (duck typing can be used for
    // customization).
    //
    // Each convex polygon has a `shared` property, which is shared between all
    // polygons that are clones of each other or were split from the same polygon.
    // This can be used to define per-polygon properties (such as surface color).
    var Polygon = (function () {
        function Polygon(vertices, shared) {
            if (shared === void 0) { shared = false; }
            this.vertices = vertices;
            this.shared = shared;
            this.plane = Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
        }
        Polygon.prototype.clone = function () {
            var vertices = this.vertices.map(function (v) { return v.clone(); });
            return new Polygon(vertices, this.shared);
        };
        Polygon.prototype.flip = function () {
            this.vertices.reverse().map(function (v) { v.flip(); });
            this.plane.flip();
        };
        return Polygon;
    })();
    CSG.Polygon = Polygon;
    // Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
    // by picking a polygon to split along. That polygon (and all other coplanar
    // polygons) are added directly to that node and the other polygons are added to
    // the front and/or back subtrees. This is not a leafy BSP tree since there is
    // no distinction between internal and leaf nodes.
    var _depth = 0;
    var Node = (function () {
        function Node(polygons) {
            this.plane = null;
            this.front = null;
            this.back = null;
            this.polygons = [];
            if (polygons) {
                this.build(polygons);
            }
        }
        Node.prototype.clone = function () {
            var node = new Node();
            node.plane = this.plane && this.plane.clone();
            node.front = this.front && this.front.clone();
            node.back = this.back && this.back.clone();
            node.polygons = this.polygons.map(function (p) { return p.clone(); });
            return node;
        };
        // Convert solid space to empty space and empty space to solid space.
        Node.prototype.invert = function () {
            for (var i = 0; i < this.polygons.length; i++) {
                this.polygons[i].flip();
            }
            this.plane.flip();
            if (this.front)
                this.front.invert();
            if (this.back)
                this.back.invert();
            var temp = this.front;
            this.front = this.back;
            this.back = temp;
        };
        // Recursively remove all polygons in `polygons` that are inside this BSP
        // tree.
        Node.prototype.clipPolygons = function (polygons) {
            if (!this.plane)
                return polygons.slice();
            var front = [], back = [];
            for (var i = 0; i < polygons.length; i++) {
                this.plane.splitPolygon(polygons[i], front, back, front, back);
            }
            if (this.front)
                front = this.front.clipPolygons(front);
            if (this.back)
                back = this.back.clipPolygons(back);
            else
                back = [];
            return front.concat(back);
        };
        // Remove all polygons in this BSP tree that are inside the other BSP tree
        // `bsp`.
        Node.prototype.clipTo = function (bsp) {
            this.polygons = bsp.clipPolygons(this.polygons);
            if (this.front) {
                this.front.clipTo(bsp);
            }
            if (this.back) {
                this.back.clipTo(bsp);
            }
        };
        // Return a list of all polygons in this BSP tree.
        Node.prototype.allPolygons = function () {
            var polygons = this.polygons.slice();
            if (this.front) {
                polygons = polygons.concat(this.front.allPolygons());
            }
            if (this.back) {
                polygons = polygons.concat(this.back.allPolygons());
            }
            return polygons;
        };
        // Build a BSP tree out of `polygons`. When called on an existing tree, the
        // new polygons are filtered down to the bottom of the tree and become new
        // nodes there. Each set of polygons is partitioned using the first polygon
        // (no heuristic is used to pick a good split).
        Node.prototype.build = function (polygons) {
            _depth = 0;
            this._build(polygons);
        };
        Node.prototype._build = function (polygons) {
            ++_depth;
            if (_depth > 10) {
                debugger;
            }
            if (!polygons.length) {
                --_depth;
                return;
            }
            if (!this.plane) {
                this.plane = polygons[0].plane.clone();
            }
            var front = [], back = [];
            for (var i = 0; i < polygons.length; i++) {
                this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
            }
            if (front.length) {
                if (!this.front) {
                    this.front = new Node();
                }
                this.front._build(front);
            }
            if (back.length) {
                if (!this.back) {
                    this.back = new Node();
                }
                this.back._build(back);
            }
            --_depth;
        };
        return Node;
    })();
    CSG.Node = Node;
})(CSG || (CSG = {}));
var Eden;
(function (Eden) {
    Eden.TAU = 2 * Math.PI;
})(Eden || (Eden = {}));
/// <reference path="lib/threejs/three.d.ts"/>
/// <reference path="blocktypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="blocks.ts"/>
/// <reference path="math.ts"/>
/// <reference path="envlines.ts"/>
var Eden;
(function (Eden) {
    var Root2 = Math.sqrt(2);
    var TwoRoot2 = 2 * Root2;
    var WallBlock = (function () {
        function WallBlock() {
        }
        WallBlock.prototype.render = function (env) {
            // Find all the lines that should be filled in.
            var lines = Eden.linesForEnv(env);
            // Find the directions of these lines if/as they cross the middle.
            var bits = 0;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var x = line.x, z = line.z, dx = Eden.LineDirs[line.dir][0], dz = Eden.LineDirs[line.dir][1];
                for (var j = 0; j < line.len - 1; j++) {
                    if ((x == 2) && (z == 2)) {
                        bits |= 1 << line.dir;
                    }
                    else if ((x + dx == 2) && (z + dz == 2)) {
                        bits |= 0x10 << line.dir;
                    }
                    x += dx;
                    z += dz;
                }
            }
            // Now render all the walls.
            // Start with a pillar (TODO: Drop the pillar if there are other walls).
            var csg = CSG.cube({ radius: [0.1, 0.45, 0.1] });
            // X wall.
            if (bits & 0x01) {
                csg = csg.union(CSG.cube({ center: [0.25, 0, 0], radius: [0.225, 0.45, 0.1] }));
            }
            if (bits & 0x10) {
                csg = csg.union(CSG.cube({ center: [-0.25, 0, 0], radius: [0.225, 0.45, 0.1] }));
            }
            // Z wall.
            if (bits & 0x02) {
                csg = csg.union(CSG.cube({ center: [0, 0, 0.25], radius: [0.1, 0.45, 0.225] }));
            }
            if (bits & 0x20) {
                csg = csg.union(CSG.cube({ center: [0, 0, -0.25], radius: [0.1, 0.45, 0.225] }));
            }
            // XZ wall.
            if (bits & 0x04) {
                csg = csg.union(CSG.cube({ center: [0.25, 0, 0.25], radius: [0.225 * Root2, 0.45, 0.1], xform: xform(3) }));
            }
            if (bits & 0x40) {
                csg = csg.union(CSG.cube({ center: [-0.25, 0, -0.25], radius: [0.225 * Root2, 0.45, 0.1], xform: xform(7) }));
            }
            // ZX wall.
            if (bits & 0x08) {
                csg = csg.union(CSG.cube({ center: [0.25, 0, -0.25], radius: [0.225 * Root2, 0.45, 0.1], xform: xform(5) }));
            }
            if (bits & 0x80) {
                csg = csg.union(CSG.cube({ center: [-0.25, 0, 0.25], radius: [0.225 * Root2, 0.45, 0.1], xform: xform(1) }));
            }
            return {
                geom: Eden.csgPolysToGeometry(csg.toPolygons()),
                mat: new THREE.MeshLambertMaterial({ color: 0xa0a0a0 })
            };
        };
        return WallBlock;
    })();
    Eden.WallBlock = WallBlock;
    function xform(eigth) {
        var m = new THREE.Matrix4();
        m.makeRotationY(eigth * Eden.TAU / 8);
        var e = m.elements;
        return [e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]];
    }
    Eden.registerBlock(Eden.BlockWall, new WallBlock());
})(Eden || (Eden = {}));
/// <reference path="lib/threejs/three.d.ts"/>
/// <reference path="blocktypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="blocks.ts"/>
var Eden;
(function (Eden) {
    var FloorBlock = (function () {
        function FloorBlock() {
        }
        FloorBlock.prototype.render = function (env) {
            var cube = CSG.cube({ center: [0, 0, 0], radius: [0.45, 0.05, 0.45] });
            return {
                geom: Eden.csgPolysToGeometry(cube.toPolygons()),
                mat: new THREE.MeshLambertMaterial({ color: 0x808000 })
            };
        };
        return FloorBlock;
    })();
    Eden.FloorBlock = FloorBlock;
    Eden.registerBlock(Eden.BlockFloor, new FloorBlock());
})(Eden || (Eden = {}));
/// <reference path="blocktypes.ts"/>
/// <reference path="wall.ts"/>
/// <reference path="floor.ts"/>
var Eden;
(function (Eden) {
    var _geomCache = {};
    // HACK: Just prints out y=2 plane for now.
    function envStr(env) {
        var s = "";
        for (var z = 0; z < 5; z++) {
            for (var x = 0; x < 5; x++) {
                s += "" + env[envOfs(x, 2, z)] + " ";
            }
            s += "\n";
        }
        return s;
    }
    Eden.envStr = envStr;
    function envOfs(x, y, z) {
        return (y * 25) + (z * 5) + x;
    }
    Eden.envOfs = envOfs;
    function envOfsCenter(dx, dy, dz) {
        return 62 + (dy * 25) + (dz * 5) + dx;
    }
    Eden.envOfsCenter = envOfsCenter;
    function geomForEnv(x, y, z, env) {
        var key = envKey(env);
        if (!(key in _geomCache)) {
            var bt = Eden.blockTypes[env[envOfsCenter(0, 0, 0)]];
            if (bt) {
                console.log(">>> " + x + ", " + y + ", " + z);
                _geomCache[key] = bt.render(env);
            }
            else {
                _geomCache[key] = null;
            }
        }
        return _geomCache[key];
    }
    Eden.geomForEnv = geomForEnv;
    function csgPolysToGeometry(polys) {
        var geom = new THREE.Geometry();
        var vidx = 0;
        for (var i = 0; i < polys.length; i++) {
            var p = polys[i];
            // Triangulate CSG polys, which can be convex polygons of any number of verts.
            for (var j = 0; j < p.vertices.length - 2; j++) {
                geom.vertices.push(csgVecToThree(p.vertices[0].pos));
                for (var k = 0; k < 2; k++) {
                    geom.vertices.push(csgVecToThree(p.vertices[(j + k + 1) % p.vertices.length].pos));
                }
                geom.faces.push(new THREE.Face3(vidx, vidx + 1, vidx + 2, csgVecToThree(p.vertices[0].normal)));
                vidx += 3;
            }
        }
        return geom;
    }
    Eden.csgPolysToGeometry = csgPolysToGeometry;
    function csgVecToThree(vert) {
        return new THREE.Vector3(vert.x, vert.y, vert.z);
    }
    function envKey(env) {
        return env.toString();
    }
})(Eden || (Eden = {}));
/// <reference path="blocktypes.ts"/>
/// <reference path="blocks.ts"/>
var Eden;
(function (Eden) {
    Eden.LineDirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    // TODO:
    // - Convert env to booleans to avoid the `== BlockWall` crap.
    // - Cache found lines.
    //   When caching, fill all rotations/inversions to avoid redundant work.
    // - Aggressively drop lines that touch nothing after longer lines are considered.
    function linesForEnv(env) {
        var lines = findAllLines(env);
        lines = optimizeLines(lines, countBlocks(env));
        console.log(Eden.envStr(env));
        console.log(">>> " + _count);
        return lines;
    }
    Eden.linesForEnv = linesForEnv;
    // Fills the line that passes in the given direction through the given point.
    // Keeps track of already-visited points/directions in `marks`.
    function fillLine(env, marks, x, z, dir) {
        // Find the starting point.
        var dx = -Eden.LineDirs[dir][0], dz = -Eden.LineDirs[dir][1];
        while ((x >= 1) && (x < 4) && (z >= 1) && (z < 4) && (env[Eden.envOfs(x + dx, 2, z + dz)] == Eden.BlockWall)) {
            x += dx;
            z += dz;
        }
        // Walk the line.
        dx = -dx;
        dz = -dz;
        var bit = 1 << dir;
        var line = { x: x, z: z, dir: dir, len: 1 };
        marks[Eden.envOfs(x, 2, z)] |= bit;
        while ((x + dx >= 0) && (x + dx < 5) && (z + dz >= 0) && (z + dz < 5) && (env[Eden.envOfs(x + dx, 2, z + dz)] == Eden.BlockWall)) {
            line.len++;
            x += dx;
            z += dz;
            marks[Eden.envOfs(x, 2, z)] |= bit;
        }
        return line;
    }
    // Finds all lines that run through a given point, adding them to the `lines` array.
    // Uses `marks` (must be the same size as `env`) to keep track of visited blocks/directions.
    function findLines(env, marks, lines, x, z) {
        var ofs = Eden.envOfs(x, 2, z);
        for (var dir = 0; dir < 4; dir++) {
            if ((env[ofs] != Eden.BlockWall) || (marks[ofs] & (1 << dir))) {
                continue;
            }
            var line = fillLine(env, marks, x, z, dir);
            if (line.len > 1) {
                lines.push(line);
            }
        }
    }
    // Finds all the lines that run through occupied cells in the environment.
    function findAllLines(env) {
        var marks = [];
        for (var i = 0; i < 125; i++) {
            marks[i] = 0;
        }
        var lines = [];
        var total = 0;
        for (var x = 0; x < 5; x++) {
            for (var z = 0; z < 5; z++) {
                if (env[Eden.envOfs(x, 2, z)] == Eden.BlockWall) {
                    findLines(env, marks, lines, x, z);
                    total++;
                }
            }
        }
        return lines;
    }
    // Counts the number of blocks set in the given environment.
    function countBlocks(env) {
        var total = 0;
        for (var x = 0; x < 5; x++) {
            for (var z = 0; z < 5; z++) {
                if (env[Eden.envOfs(x, 2, z)] == Eden.BlockWall) {
                    total++;
                }
            }
        }
        return total;
    }
    var _count = 0;
    function optimizeLines(lines, total) {
        // Sort lines by descending length.
        lines.sort(function (a, b) {
            return b.len - a.len;
        });
        // 'Touched' bits for each cell in the environment.
        var touched = [];
        for (var i = 0; i < 125; i++) {
            touched[i] = false;
        }
        _count = 0;
        return optimizeHelper(lines, total, touched);
    }
    function optimizeHelper(lines, total, touched) {
        // Find all candidate lines of equal length.
        var bestResult, bestLength = 100;
        while (true) {
            for (var i = 0; (i < lines.length) && (lines[i].len == lines[0].len); i++) {
                var head = lines[i];
                var tail = lines.slice();
                tail = tail.slice(0, i).concat(tail.slice(i + 1));
                var result = optimizeLine(head, tail, total, touched.slice()); // Always copy `touched` (TODO: Can skip the first).
                if (result.length && result.length < bestLength) {
                    bestResult = result;
                    bestLength = result.length;
                }
            }
            if (!bestResult && lines.length > i) {
                // We didn't find anything at len=N, so go ahead and try the next set.
                lines = lines.slice(i);
                continue;
            }
            break;
        }
        return bestResult;
    }
    function optimizeLine(head, tail, total, touched) {
        _count++;
        // Walk the line through the environment, updating `total` and `touched`.
        var anythingTouched = false;
        var x = head.x, z = head.z, dx = Eden.LineDirs[head.dir][0], dz = Eden.LineDirs[head.dir][1];
        for (var j = 0; j < head.len; j++) {
            var ofs = Eden.envOfs(x, 2, z);
            if (!touched[ofs]) {
                anythingTouched = true;
                touched[ofs] = true;
                total--;
            }
            x += dx;
            z += dz;
        }
        var result = [];
        if (anythingTouched) {
            result.push(head);
            if (total > 0) {
                if (tail.length > 0) {
                    // TODO: Deal with orphan cells, so we can guarantee that `optimized` always contains something.
                    // Fixing this will reduce unnecessary work.
                    var optimized = optimizeHelper(tail, total, touched);
                    if (optimized) {
                        result = result.concat(optimized);
                    }
                }
            }
        }
        return result;
    }
})(Eden || (Eden = {}));
/// <reference path="tsUnit.ts"/>
/// <reference path="envlines.ts"/>
var EdenTests;
(function (EdenTests) {
    function onePlane(plane) {
        var env = [];
        for (var i = 0; i < 125; i++) {
            env[i] = 0;
        }
        for (var i = 0; i < 25; i++) {
            env[50 + i] = plane[i];
        }
        return env;
    }
    function lineEq(exp, act) {
        return (exp.dir == act.dir) &&
            (exp.len == act.len) &&
            (exp.x == act.x) &&
            (exp.z == act.z);
    }
    function linesMatch(exp, act) {
        if (exp.length != act.length) {
            return false;
        }
        var matches = 0;
        for (var i = 0; i < exp.length; i++) {
            for (var j = 0; j < act.length; j++) {
                if (lineEq(exp[i], act[j])) {
                    matches++;
                    break;
                }
            }
        }
        return matches == exp.length;
    }
    var cases = [
        {
            env: onePlane([
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0,
                1, 1, 1, 1, 1,
                0, 0, 0, 0, 0,
                0, 0, 0, 0, 0
            ]),
            lines: [
                { x: 0, z: 2, dir: 0, len: 5 }
            ]
        },
        {
            env: onePlane([
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0,
                1, 1, 1, 1, 1,
                0, 0, 1, 0, 0,
                0, 0, 1, 0, 0
            ]),
            lines: [
                { x: 2, z: 0, dir: 1, len: 5 },
                { x: 0, z: 2, dir: 0, len: 5 }
            ]
        }
    ];
    var WallTests = (function (_super) {
        __extends(WallTests, _super);
        function WallTests() {
            _super.apply(this, arguments);
        }
        WallTests.prototype.testLinesForEnv = function () {
            for (var i = 0; i < cases.length; i++) {
                var act = Eden.linesForEnv(cases[i].env);
                if (!linesMatch(cases[i].lines, act)) {
                    throw "Failed on case " + i;
                }
            }
        };
        return WallTests;
    })(tsUnit.TestClass);
    EdenTests.WallTests = WallTests;
})(EdenTests || (EdenTests = {}));
var test = new tsUnit.Test(EdenTests);
test.showResults(document.getElementById('result'), test.run());
