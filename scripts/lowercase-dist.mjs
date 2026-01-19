import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist/cgi-costing-tool/browser');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

function lowercaseFiles() {
  if (!fs.existsSync(distPath)) {
    console.error(`Dist path ${distPath} does not exist.`);
    return;
  }

  const files = getAllFiles(distPath);
  const renameMap = [];
  
  // First, identify renames
  files.forEach(file => {
    const dir = path.dirname(file);
    const base = path.basename(file);
    const lowerBase = base.toLowerCase();
    
    if (base !== lowerBase) {
      renameMap.push({
        oldPath: file,
        newPath: path.join(dir, lowerBase),
        oldBase: base,
        newBase: lowerBase
      });
    }
  });

  // Second, perform renames
  renameMap.forEach(({ oldPath, newPath, oldBase, newBase }) => {
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: ${oldBase} -> ${newBase}`);
    }
  });

  // Third, update references in .html, .js, .css, .json files
  const allFiles = getAllFiles(distPath);
  allFiles.forEach(file => {
    if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.json')) {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      
      renameMap.forEach(({ oldBase, newBase }) => {
        const escapedBase = oldBase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedBase, 'g');
        if (regex.test(content)) {
          content = content.split(oldBase).join(newBase);
          modified = true;
        }
      });
      
      if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated references in: ${path.basename(file)}`);
      }
    }
  });
}

lowercaseFiles();
