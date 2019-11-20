const remote = require('electron').remote;
const path = require('path');
const fs = require('fs');
const buttonClose = document.querySelector('#btn-close');
const form = document.querySelector('form');
const files = document.querySelector('#files');
const table = document.querySelector('table');
const operations = document.querySelectorAll('.operations');
const confirmDialog = document.querySelector('#confirm-dialog');
const successDialog = document.querySelector('#success-dialog');
const errorDialog = document.querySelector('#error-dialog');
let filesObjects = [];
let filesObjectsId = 0;

function showError(message) {
    errorDialog.querySelector('p').innerHTML = message;
    errorDialog.showModal();
}

function getRenderTableRow(file) {

    filesObjectsId++;

    const tableRowTpl = document.querySelector('#table-row');
    const clone = tableRowTpl.content.cloneNode(true);

    filesObjects.push({
        file,
        id: filesObjectsId
    });

    clone.querySelector('tr').id = 'file-' + filesObjectsId.toString();
    clone.querySelector('[data-name="current"]').innerHTML = file.path;

    return clone;

}

function getFileObject(id) {

    const filtred = filesObjects.filter(f => parseInt(f.id) === parseInt(id));

    if (filtred.length) {
        return filtred[0].file;
    } else {
        return false;
    }

}

function getRuleApllyed(parsedFile, operation, value) {

    switch (operation) {
        case 'add':
            return `${parsedFile.name}${value}${parsedFile.ext}`;

        case 'rem':
            if (parsedFile.name.substring(parsedFile.name.length - value.length, parsedFile.name.length) === value) {
                return parsedFile.name.substring(0, parsedFile.name.length - value.length) + parsedFile.ext;
            } else {
                return parsedFile.name + parsedFile.ext;
            }
        
        default:
            return parsedFile.name + parsedFile.ext;
    }

}

function applyOperation() {

    const sufix = document.querySelector('[name="sufix"]:checked');
    const rows = document.querySelectorAll('tbody tr');

    if (sufix) {

        const operation = sufix.value.split('|')[0];
        const value = sufix.value.split('|')[1];

        rows.forEach(row => {

            const id = row.id.split('-')[1];
            const file = getFileObject(id);
            const parsed = path.parse(file.path);
            const newName = getRuleApllyed(parsed, operation, value);

            row.querySelector('[data-name="new"]').innerHTML = newName;

        });

    }

}

function clearFilesObjects() {
    filesObjects = [];
    table.querySelector('tbody').innerHTML = '';
}

function execute() {

    const executingDialog = document.querySelector('#executing-dialog');

    executingDialog.showModal();

    recursiveExecute(0, () => {

        form.reset();
        clearFilesObjects();
        executingDialog.close();
        successDialog.showModal();

    });

}

function recursiveExecute(index, callback) {

    const executingDialog = document.querySelector('#executing-dialog');
    const sufix = document.querySelector('[name="sufix"]:checked');
    const operation = sufix.value.split('|')[0];
    const value = sufix.value.split('|')[1];
    const rows = document.querySelectorAll('tbody tr');
    const row = rows[index];
    const id = row.id.split('-')[1];
    const file = getFileObject(id);
    const parsed = path.parse(file.path);
    const newName = getRuleApllyed(parsed, operation, value);
    
    executingDialog.querySelector('p').innerHTML = `${index+1} de ${rows.length}`;

    fs.renameSync(`${parsed.dir}\\${parsed.base}`, `${parsed.dir}\\${newName}`);

    if ((index+1) < rows.length) {
        recursiveExecute(++index, callback);
    } else {
        callback();
    }

}

buttonClose.addEventListener('click', e => {

    e.preventDefault();

    remote.getCurrentWindow().close();

});

files.addEventListener('input', e => {

    clearFilesObjects();

    Array.from(e.target.files).forEach(file => {
        
        const row = getRenderTableRow(file);

        table.querySelector('tbody').appendChild(row);

    });

    applyOperation();

});

operations.forEach(operation => {
    operation.addEventListener('input', e => {
        applyOperation();
    });
});

form.addEventListener('submit', e => {

    e.preventDefault();

    const sufix = document.querySelector('[name="sufix"]:checked');
    const rows = document.querySelectorAll('tbody tr');

    if (!sufix) {
        showError('Escolha a operação.');
        return;
    }

    if (!rows.length) {
        showError('Selecione os arquivos.');
        return;
    }

    if (sufix && rows.length) {

        const operation = sufix.value.split('|')[0];
        const value = sufix.value.split('|')[1];

        if (operation && value) {
            confirmDialog.showModal();
        }

    }

});

confirmDialog.querySelector('#dialog-y').addEventListener('click', e => {

    confirmDialog.close();

    execute();

});

confirmDialog.querySelector('#dialog-n').addEventListener('click', e => {

    confirmDialog.close();

});

successDialog.querySelector('.btn').addEventListener('click', e => {

    successDialog.close();

});

errorDialog.querySelector('.btn').addEventListener('click', e => {

    errorDialog.close();

});
