"use strict";

var child_process = require('child_process');
var fs = require('fs');
var fse = require('fs-extra');
var glob = require('glob');
var path = require('path');
var yaml = require('js-yaml');

var src = 'src/sp-client';
var packageMappingFileRelativePath = 'package_service_mapping.json';
var repoRelativePath = 'repo.json';
var dest = 'docs-ref-autogen';
var packagesToFilter = ['@ms/announcement-list-demo'];


// 1. prepare
fse.removeSync(dest);
fse.mkdirpSync(dest);

var tsconfigs = glob.sync(path.join(src, '**/tsconfig.json'));
var toc = [];

tsconfigs.forEach(function (tsconfig) {
    var packagePath = tsconfig.replace('tsconfig.json', 'package.json');
    generatePackageDoc(packagePath, dest);
});


toc = JSON.parse(JSON.stringify(toc));
fs.writeFileSync(dest + '/toc.yml', yaml.safeDump(toc));
process.exit(0);

function generatePackageDoc(packagePath, dest) {
    var dir = path.dirname(packagePath);
    if (!fs.existsSync(packagePath)) {
        return;
    }

    var packageName = fse.readJsonSync(packagePath).name;
    if (packagesToFilter.indexOf(packageName) < 0) {
        console.log(packageName);
        console.log(dir);
        // packageName = packageName.replace(/\//g, '-');
        var sourceCodeBasePath = dir + '/src';
        if (fse.existsSync(sourceCodeBasePath)) {
            var packageDest = dest + '/' + packageName;
            fse.mkdirpSync(packageDest);
            try {
                child_process.execSync('typedoc --json ' + dir + '/api.json ' + dir + '/src --module commonjs --ignoreCompilerErrors');
                var basePath = sourceCodeBasePath.replace(src + '/', '');
                child_process.execFileSync('node', ['node_modules/type2docfx/dist/main', dir + '/api.json', packageDest]);
                if (fs.existsSync(packageDest + '/toc.yml')) {
                    var subToc = yaml.safeLoad(fs.readFileSync(packageDest + '/toc.yml'));
                    toc.push(subToc[0]);
                    fse.removeSync(packageDest + '/toc.yml');
                }
             }
             catch (e) {
                console.log(packageName + ": TypeDoc Parse Error.");
             }
        } else {
            console.log('No source file for ' + packageName);
        }
    }
}