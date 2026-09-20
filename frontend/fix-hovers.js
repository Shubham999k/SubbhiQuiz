const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const dir = path.join(__dirname, 'src');

walk(dir, function(filePath) {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      .replace(/hover:bg-primary\/80/g, 'hover:opacity-80')
      .replace(/hover:bg-primary\/90/g, 'hover:opacity-90')
      .replace(/hover:bg-secondary\/90/g, 'hover:opacity-90')
      .replace(/hover:bg-error\/90/g, 'hover:opacity-90')
      .replace(/hover:bg-success\/90/g, 'hover:opacity-90')
      .replace(/hover:bg-primary\/10/g, 'hover:bg-base-200')
      .replace(/hover:bg-warning\/10/g, 'hover:bg-base-200')
      .replace(/hover:bg-error\/10/g, 'hover:bg-base-200');
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated ' + filePath);
    }
  }
});
console.log("Done");
