import ts from "typescript";
import fs from "node:fs";
const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(
  config.config,
  ts.sys,
  process.cwd(),
);
const host = {
  getScriptFileNames: () => parsed.fileNames,
  getScriptVersion: () => "1",
  getScriptSnapshot: (file) =>
    ts.sys.fileExists(file)
      ? ts.ScriptSnapshot.fromString(ts.sys.readFile(file))
      : undefined,
  getCurrentDirectory: () => process.cwd(),
  getCompilationSettings: () => parsed.options,
  getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
};
const service = ts.createLanguageService(host);
for (const file of parsed.fileNames) {
  const edits = service.organizeImports(
    { type: "file", fileName: file },
    {},
    {},
  );
  for (const edit of edits) {
    let source = fs.readFileSync(edit.fileName, "utf8");
    for (const c of [...edit.textChanges].sort(
      (a, b) => b.span.start - a.span.start,
    )) {
      source =
        source.slice(0, c.span.start) +
        c.newText +
        source.slice(c.span.start + c.span.length);
    }
    fs.writeFileSync(edit.fileName, source);
  }
}
service.dispose();
console.log("Organized TypeScript imports.");
