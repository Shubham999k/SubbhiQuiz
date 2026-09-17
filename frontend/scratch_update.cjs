const fs = require("fs");
const path = require("path");

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith(".jsx") || fullPath.endsWith(".js")) {
      let content = fs.readFileSync(fullPath, "utf8");
      if (content.includes("AuthProvider")) {
        let newContent = content.replace(
          /import\s+\{\s*useAuth\s*\}\s+from\s+['"](.*?)AuthProvider['"];/g,
          'import { useAuth } from "$1AuthContext";',
        );
        if (newContent !== content) {
          fs.writeFileSync(fullPath, newContent);
          console.log("Updated", fullPath);
        }
      }
    }
  }
}

processDir("src");
