import {writeFileSync} from "fs";
import {dirname, join} from "path";
import transform from "transform-json-types";
import * as json from "./input.json";

const getPath = () => join(dirname(__filename), "./output.ts");

const removeVarFromCode = (code: string, varName: string): string => {
  const regexp = new RegExp(`\nexport var ${varName} =[^;]+;\n`, "gm");
  return code.replace(regexp, "");
};

let output = transform(json, {
  lang: "io-ts",
});

output = `import * as t from "io-ts";\n\n${output}`;
output = `// tslint:disable: object-literal-sort-keys no-var-keyword\n${output}`;
output = `// var is used instead of const because
// transform-json-types generate types not in a declaration order
${output}`;
output = `${output}// tslint:enable: object-literal-sort-keys no-var-keyword\n`;
output = output.replace(/^const/gm, "export var");
output = output.replace(/\ string/gm, " t.string");
output = output.replace(/t\.Integer/gm, "t.number"); // Integer does not have ts type
output = removeVarFromCode(output, "RootInterface");
output = removeVarFromCode(output, "Default");

writeFileSync(getPath(), output, {
  encoding: "utf-8",
});
